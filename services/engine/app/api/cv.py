import re
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlmodel import Session, select

from app.adapters.pdf import PDFCompilerService
from app.adapters.database import get_session
from app.domain.ats import ATSMatchingEngine
from app.domain.cv import CVGeneratorService
from app.domain.models import (
    JobOffer,
    MasterProfile,
    TargetedCV,
    TargetedCVRead,
)

router = APIRouter(prefix="/api/cv", tags=["CV Generation & PDF"])


def sanitize_filename(name: str) -> str:
    """Nettoie une chaîne pour un nom de fichier HTTP sûr."""
    return re.sub(r"[^\w\-_\.]", "_", name)


def _get_or_create_cv(session: Session, job_id: str, lang: str = "fr") -> tuple[TargetedCV, MasterProfile, JobOffer]:
    normalized_lang = "en" if lang.lower().strip() == "en" else "fr"

    job = session.get(JobOffer, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "JOB_NOT_FOUND", "message": f"Offre {job_id} introuvable."},
        )

    profile = session.get(MasterProfile, "default-profile")
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

    # Vérification si un CV existe déjà pour cette offre ET cette langue
    statement = select(TargetedCV).where(
        TargetedCV.job_id == job_id,
        TargetedCV.language == normalized_lang,
    )
    cv = session.exec(statement).first()

    # Si le CV n'existe pas ou contient l'ancien gabarit CSS rigide, on le régénère
    is_outdated = cv and (
        "page-break-inside: avoid" in cv.html_content
        or "margin: 10mm 14mm" in cv.html_content
    )

    if not cv:
        ats_match = ATSMatchingEngine.evaluate_alignment(job, profile)
        cv = CVGeneratorService.generate_cv(job, profile, ats_match, language=normalized_lang)
        session.add(cv)
        session.commit()
        session.refresh(cv)
    elif is_outdated:
        ats_match = ATSMatchingEngine.evaluate_alignment(job, profile)
        fresh_cv = CVGeneratorService.generate_cv(job, profile, ats_match, language=normalized_lang)
        cv.headline = fresh_cv.headline
        cv.summary = fresh_cv.summary
        cv.html_content = fresh_cv.html_content
        cv.matched_skills_raw = fresh_cv.matched_skills_raw
        cv.transferable_skills_raw = fresh_cv.transferable_skills_raw
        cv.experiences_raw = fresh_cv.experiences_raw
        cv.projects_raw = fresh_cv.projects_raw
        cv.educations_raw = fresh_cv.educations_raw
        session.add(cv)
        session.commit()
        session.refresh(cv)

    return cv, profile, job


@router.post("/generate/{job_id}", response_model=TargetedCVRead)
def generate_targeted_cv(
    job_id: str,
    lang: str = Query("fr", description="Langue du CV : 'fr' ou 'en'"),
    session: Session = Depends(get_session),
) -> TargetedCVRead:
    """
    Génère un CV personnalisé ciblé selon l'offre et le profil maître (AD-4).
    Met à jour le CV existant si déjà généré pour cette langue.
    """
    normalized_lang = "en" if lang.lower().strip() == "en" else "fr"

    job = session.get(JobOffer, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "JOB_NOT_FOUND", "message": f"Offre {job_id} introuvable."},
        )

    profile = session.get(MasterProfile, "default-profile")
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
    new_cv = CVGeneratorService.generate_cv(job, profile, ats_match, language=normalized_lang)

    # Upsert dans la base pour la paire (job_id, language)
    statement = select(TargetedCV).where(
        TargetedCV.job_id == job_id,
        TargetedCV.language == normalized_lang,
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
    session: Session = Depends(get_session),
) -> Response:
    """Retourne le contenu HTML du CV ciblé pour affichage direct en iframe."""
    cv, _, _ = _get_or_create_cv(session, job_id, lang=lang)
    return Response(content=cv.html_content, media_type="text/html; charset=utf-8")


@router.get("/pdf/{job_id}", response_class=Response)
async def download_cv_pdf(
    job_id: str,
    lang: str = Query("fr", description="Langue du PDF : 'fr' ou 'en'"),
    session: Session = Depends(get_session),
) -> Response:
    """Compile le CV en PDF vectoriel 1 page standardisée via Playwright (AD-7)."""
    cv, profile, job = _get_or_create_cv(session, job_id, lang=lang)

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
