import json
import logging
import re
from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from sqlmodel import Session, select

logger = logging.getLogger(__name__)

from app.adapters.pdf import PDFCompilerService
from app.adapters.database import get_session
from app.api.auth import get_current_username
from app.domain.ats import ATSMatchingEngine
from app.domain.cv import CVGeneratorService, CVParserService, render_custom_cv_html
from app.domain.models import (
    CompilePDFRequest,
    CustomCVData,
    CustomCVDraft,
    JobOffer,
    MasterProfile,
    TargetedCV,
    TargetedCVRead,
)

router = APIRouter(prefix="/api/cv", tags=["CV Generation & PDF"])


def sanitize_filename(name: str) -> str:
    """Nettoie une chaîne pour un nom de fichier HTTP sûr."""
    return re.sub(r"[^\w\-_\.]", "_", name)


def _get_user_profile(session: Session, username: str) -> MasterProfile | None:
    uname = (username or "louay").strip().lower()
    profile = session.exec(
        select(MasterProfile).where(MasterProfile.user_id == uname)
    ).first()
    if not profile and uname == "louay":
        profile = session.exec(
            select(MasterProfile).where(
                (MasterProfile.user_id == "louay") | (MasterProfile.id == "default-profile")
            )
        ).first()
    return profile


def _get_or_create_cv(
    session: Session,
    job_id: str,
    lang: str = "fr",
    username: str = "louay",
) -> tuple[TargetedCV, MasterProfile, JobOffer]:
    normalized_lang = "en" if lang.lower().strip() == "en" else "fr"

    job = session.get(JobOffer, job_id)
    if not job or job.user_id != username:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "JOB_NOT_FOUND", "message": f"Offre {job_id} introuvable."},
        )

    profile = _get_user_profile(session, username)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "PROFILE_NOT_FOUND", "message": "Master Profile introuvable."},
        )

    if not profile.is_complete:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "PROFILE_INCOMPLETE",
                "message": "Le Master Profile est incomplet. Complétez vos formations, expériences et compétences pour générer un CV.",
            },
        )

    # Recherche du CV pour ce job, cette langue ET cet utilisateur
    statement = select(TargetedCV).where(
        TargetedCV.job_id == job_id,
        TargetedCV.language == normalized_lang,
        TargetedCV.user_id == username,
    )
    cv = session.exec(statement).first()

    # Si le CV n'existe pas ou contient l'ancien gabarit CSS rigide, on le régénère
    is_outdated = cv and (
        "page-break-inside: avoid" in cv.html_content
        or "margin: 10mm 14mm" in cv.html_content
    )

    if not cv:
        ats_match = ATSMatchingEngine.evaluate_alignment(job, profile)
        try:
            cv = CVGeneratorService.generate_cv(job, profile, ats_match, language=normalized_lang)
        except HTTPException:
            raise
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"error_code": "PROFILE_INCOMPLETE", "message": str(e)},
            )
        except Exception as e:
            logger.error(f"Erreur lors de la génération du CV: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={"error_code": "MODEL_ERROR", "message": "Le modèle IA rencontre un problème. Veuillez réessayer ultérieurement."},
            )
        cv.user_id = username
        session.add(cv)
        session.commit()
        session.refresh(cv)
    elif is_outdated:
        ats_match = ATSMatchingEngine.evaluate_alignment(job, profile)
        try:
            fresh_cv = CVGeneratorService.generate_cv(job, profile, ats_match, language=normalized_lang)
        except HTTPException:
            raise
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"error_code": "PROFILE_INCOMPLETE", "message": str(e)},
            )
        except Exception as e:
            logger.error(f"Erreur lors de la régénération du CV: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={"error_code": "MODEL_ERROR", "message": "Le modèle IA rencontre un problème. Veuillez réessayer ultérieurement."},
            )
        cv.headline = fresh_cv.headline
        cv.summary = fresh_cv.summary
        cv.html_content = fresh_cv.html_content
        cv.matched_skills_raw = fresh_cv.matched_skills_raw
        cv.transferable_skills_raw = fresh_cv.transferable_skills_raw
        cv.experiences_raw = fresh_cv.experiences_raw
        cv.projects_raw = fresh_cv.projects_raw
        cv.educations_raw = fresh_cv.educations_raw
        cv.user_id = username
        session.add(cv)
        session.commit()
        session.refresh(cv)

    return cv, profile, job


@router.post("/generate/{job_id}", response_model=TargetedCVRead)
def generate_targeted_cv(
    job_id: str,
    lang: str = Query("fr", description="Langue du CV : 'fr' ou 'en'"),
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
) -> TargetedCVRead:
    """
    Génère un CV personnalisé ciblé selon l'offre et le profil maître du candidat connecté (AD-4).
    Met à jour le CV existant si déjà généré pour cette langue.
    """
    normalized_lang = "en" if lang.lower().strip() == "en" else "fr"

    job = session.get(JobOffer, job_id)
    if not job or job.user_id != username:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "JOB_NOT_FOUND", "message": f"Offre {job_id} introuvable."},
        )

    profile = _get_user_profile(session, username)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "PROFILE_NOT_FOUND", "message": "Master Profile introuvable."},
        )

    if not profile.is_complete:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "PROFILE_INCOMPLETE",
                "message": "Le Master Profile est incomplet (CAP-1). Complétez vos informations avant de générer un CV.",
            },
        )

    ats_match = ATSMatchingEngine.evaluate_alignment(job, profile)
    try:
        new_cv = CVGeneratorService.generate_cv(job, profile, ats_match, language=normalized_lang)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error_code": "PROFILE_INCOMPLETE", "message": str(e)},
        )
    except Exception as e:
        logger.error(f"Erreur lors de la génération du CV: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error_code": "MODEL_ERROR", "message": "Le modèle IA rencontre un problème. Veuillez réessayer ultérieurement."},
        )
    new_cv.user_id = username

    statement = select(TargetedCV).where(
        TargetedCV.job_id == job_id,
        TargetedCV.language == normalized_lang,
        TargetedCV.user_id == username,
    )
    existing_cv = session.exec(statement).first()

    if existing_cv:
        existing_cv.headline = new_cv.headline
        existing_cv.summary = new_cv.summary
        existing_cv.html_content = new_cv.html_content
        existing_cv.matched_skills_raw = new_cv.matched_skills_raw
        existing_cv.transferable_skills_raw = new_cv.transferable_skills_raw
        existing_cv.experiences_raw = new_cv.experiences_raw
        existing_cv.projects_raw = new_cv.projects_raw
        existing_cv.educations_raw = new_cv.educations_raw
        existing_cv.language = normalized_lang
        session.add(existing_cv)
        session.commit()
        session.refresh(existing_cv)
        cv = existing_cv
    else:
        session.add(new_cv)
        session.commit()
        session.refresh(new_cv)
        cv = new_cv

    return TargetedCVRead(
        id=cv.id,
        job_id=cv.job_id,
        profile_id=cv.profile_id,
        headline=cv.headline,
        summary=cv.summary,
        matched_skills=cv.matched_skills,
        transferable_skills=cv.transferable_skills,
        experiences=cv.experiences,
        projects=cv.projects,
        educations=cv.educations,
        html_content=cv.html_content,
        language=cv.language,
        created_at=cv.created_at,
    )


@router.get("/preview/{job_id}", response_class=Response)
def preview_targeted_cv(
    job_id: str,
    lang: str = Query("fr", description="Langue d'aperçu : 'fr' ou 'en'"),
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
) -> Response:
    """Retourne le contenu HTML du CV ciblé pour affichage direct en iframe pour l'utilisateur."""
    cv, _, _ = _get_or_create_cv(session, job_id, lang=lang, username=username)
    return Response(content=cv.html_content, media_type="text/html; charset=utf-8")


@router.get("/pdf/{job_id}", response_class=Response)
async def download_cv_pdf(
    job_id: str,
    lang: str = Query("fr", description="Langue du PDF : 'fr' ou 'en'"),
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
) -> Response:
    """Compile le CV en PDF vectoriel 1 page standardisée via Playwright (AD-7) pour l'utilisateur."""
    cv, profile, job = _get_or_create_cv(session, job_id, lang=lang, username=username)

    pdf_bytes = await PDFCompilerService.compile_html_to_pdf(cv.html_content)

    clean_name = sanitize_filename(profile.full_name) or "Candidat"
    clean_company = sanitize_filename(job.company) or "Entreprise"
    lang_suffix = lang.upper()
    filename = f"CV_{clean_name}_{clean_company}_{lang_suffix}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": "application/pdf",
        },
    )


# ============================================================================
# Studio CV — Interactive Editor & Pixel-Perfect PDF Endpoints
# ============================================================================

@router.post("/upload")
async def upload_and_parse_cv(
    file: UploadFile = File(...),
    sync_to_profile: bool = Query(False, description="Mettre à jour le Master Profile avec les données extraites"),
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
):
    """
    Reçoit un fichier de CV (PDF, JSON ou TXT), en extrait les données de manière résiliente
    et retourne les données structurées et le HTML vectoriel pour l'utilisateur connecté.
    """
    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": "EMPTY_FILE", "message": "Le fichier transmis est vide."},
        )

    parsed_cv = CVParserService.parse_cv_file(content, file.filename or "cv.pdf")
    html_content = render_custom_cv_html(parsed_cv)

    if sync_to_profile:
        profile = _get_user_profile(session, username)
        if profile:
            if parsed_cv.full_name and (not profile.full_name or profile.full_name == "Candidat Ingénieur"):
                profile.full_name = parsed_cv.full_name
            if parsed_cv.headline and not profile.headline:
                profile.headline = parsed_cv.headline
            if parsed_cv.email and not profile.email:
                profile.email = parsed_cv.email
            if parsed_cv.phone and not profile.phone:
                profile.phone = parsed_cv.phone
            if parsed_cv.portfolio_url and not profile.website_url:
                profile.website_url = parsed_cv.portfolio_url
            if parsed_cv.linkedin_url and not profile.linkedin_url:
                profile.linkedin_url = parsed_cv.linkedin_url
            if parsed_cv.github_url and not profile.github_url:
                profile.github_url = parsed_cv.github_url
            if parsed_cv.summary and not profile.bio:
                profile.bio = parsed_cv.summary
            session.add(profile)
            session.commit()

    return {
        "filename": file.filename,
        "data": parsed_cv,
        "html_content": html_content,
    }


@router.post("/render")
def render_cv_preview(data: CustomCVData):
    """Génère le HTML A4 vectoriel à partir des données éditées du CV."""
    html_content = render_custom_cv_html(data)
    return {"html_content": html_content}


@router.post("/compile-pdf", response_class=Response)
async def compile_custom_pdf(req: CompilePDFRequest) -> Response:
    """
    Compile l'exact contenu HTML/CSS en PDF vectoriel A4 via Playwright (Chromium).
    Garantit une fidélité visuelle 100% absolue avec la prévisualisation de l'éditeur.
    """
    if not req.html_content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": "EMPTY_HTML", "message": "Le contenu HTML est requis pour la compilation PDF."},
        )

    pdf_bytes = await PDFCompilerService.compile_html_to_pdf(req.html_content)
    clean_name = sanitize_filename(req.filename or "CV_Personnalise.pdf")
    if not clean_name.lower().endswith(".pdf"):
        clean_name += ".pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{clean_name}"',
            "Content-Type": "application/pdf",
        },
    )


@router.get("/from-profile")
def get_cv_from_profile(
    lang: str = Query("fr", description="Langue : 'fr' ou 'en'"),
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
):
    """Charge les données du Master Profile souverain de l'utilisateur et les projette en structure CustomCVData."""
    profile = _get_user_profile(session, username)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "PROFILE_NOT_FOUND", "message": "Master Profile introuvable."},
        )
    custom_cv = CVParserService.convert_profile_to_custom_cv(profile, language=lang)
    html_content = render_custom_cv_html(custom_cv)

    is_profile_empty = (
        not profile.experiences
        and not profile.educations
        and not profile.projects
        and not profile.skills
    )

    return {
        "data": custom_cv,
        "html_content": html_content,
        "is_profile_empty": is_profile_empty,
    }


@router.get("/profile-pdf", response_class=Response)
async def download_profile_cv_pdf(
    lang: str = Query("fr", description="Langue : 'fr' ou 'en'"),
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
) -> Response:
    """
    Génère et télécharge le CV complet vectoriel A4 (PDF) reflétant l'intégralité
    des données du Master Profile de l'utilisateur actif.
    """
    profile = _get_user_profile(session, username)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "PROFILE_NOT_FOUND", "message": "Master Profile introuvable."},
        )

    custom_cv = CVParserService.convert_profile_to_custom_cv(profile, language=lang)
    html_content = render_custom_cv_html(custom_cv)
    pdf_bytes = await PDFCompilerService.compile_html_to_pdf(html_content)

    candidat_name = profile.full_name.strip() if profile.full_name else "Candidat"
    clean_name = sanitize_filename(f"CV_{candidat_name}.pdf")
    if not clean_name.lower().endswith(".pdf"):
        clean_name += ".pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{clean_name}"',
            "Content-Type": "application/pdf",
        },
    )


@router.post("/save-draft")
def save_cv_draft(
    data: CustomCVData,
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
):
    """Sauvegarde le brouillon du CV propre à l'utilisateur dans SQLite."""
    draft_id = f"draft-{username}"
    draft = session.get(CustomCVDraft, draft_id)
    if not draft:
        draft = session.exec(select(CustomCVDraft).where(CustomCVDraft.user_id == username)).first()

    if data.html_content and data.html_content.strip():
        html_content = data.html_content
    else:
        html_content = render_custom_cv_html(data)

    data_json = json.dumps(data.model_dump(), default=str)
    if not draft:
        draft = CustomCVDraft(
            id=draft_id,
            user_id=username,
            title=f"CV {data.full_name}".strip() or "Mon CV",
            data_json=data_json,
            html_content=html_content,
        )
    else:
        draft.user_id = username
        draft.title = f"CV {data.full_name}".strip() or "Mon CV"
        draft.data_json = data_json
        draft.html_content = html_content

    session.add(draft)
    session.commit()
    session.refresh(draft)
    return {"status": "saved", "id": draft.id, "updated_at": draft.updated_at}


@router.get("/draft")
def get_cv_draft(
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
):
    """Récupère le dernier brouillon de CV sauvegardé pour l'utilisateur courant."""
    draft_id = f"draft-{username}"
    draft = session.get(CustomCVDraft, draft_id)
    if not draft:
        draft = session.exec(select(CustomCVDraft).where(CustomCVDraft.user_id == username)).first()

    profile = _get_user_profile(session, username)
    is_profile_empty = False
    if profile:
        is_profile_empty = (
            not profile.experiences
            and not profile.educations
            and not profile.projects
            and not profile.skills
        )

    if not draft:
        if profile:
            custom_cv = CVParserService.convert_profile_to_custom_cv(profile, language="fr")
            html_content = render_custom_cv_html(custom_cv)
            return {
                "data": custom_cv,
                "html_content": html_content,
                "has_draft": False,
                "is_profile_empty": is_profile_empty,
            }
        return {"data": None, "html_content": "", "has_draft": False, "is_profile_empty": True}

    try:
        data_dict = json.loads(draft.data_json)
        custom_cv = CustomCVData(**data_dict)
    except Exception:
        custom_cv = CVParserService.convert_profile_to_custom_cv(profile, language="fr") if profile else None

    html_content = draft.html_content if draft.html_content else (render_custom_cv_html(custom_cv) if custom_cv else "")

    return {
        "data": custom_cv,
        "html_content": html_content,
        "has_draft": True,
        "is_profile_empty": is_profile_empty,
        "updated_at": draft.updated_at,
    }
