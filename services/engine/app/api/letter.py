import logging
import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel
from sqlmodel import Session, select

logger = logging.getLogger(__name__)

from app.adapters.database import get_session
from app.adapters.pdf import PDFCompilerService
from app.api.auth import get_current_username
from app.domain.ats import ATSMatchingEngine
from app.domain.letter import CoverLetterService
from app.domain.models import (
    CoverLetter,
    CoverLetterRead,
    CoverLetterUpdate,
    JobOffer,
    MasterProfile,
    utc_now,
)

router = APIRouter(prefix="/api/letter", tags=["Cover Letter"])


def sanitize_filename(name: str) -> str:
    """Nettoie une chaîne pour un nom de fichier HTTP sûr."""
    return re.sub(r"[^\w\-_\.]", "_", name)


class CustomCoverLetterDownloadRequest(BaseModel):
    content_markdown: str
    job_id: Optional[str] = None
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    format: str = "pdf"
    lang: str = "fr"


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


@router.post("/generate/{job_id}", response_model=CoverLetterRead)
def generate_cover_letter(
    job_id: str,
    lang: str = Query("fr", description="Langue de la lettre : 'fr' ou 'en'"),
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
) -> CoverLetterRead:
    """
    Génère ou rafraîchit la lettre de motivation sobre d'élève-ingénieur (AD-4) pour l'utilisateur.
    Supporte la langue française ('fr') et anglaise ('en').
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
                "message": "Le Master Profile est incomplet. Renseignez vos projets et formations pour générer une lettre factuelle.",
            },
        )

    ats_match = ATSMatchingEngine.evaluate_alignment(job, profile)
    try:
        new_letter = CoverLetterService.generate_cover_letter(job, profile, ats_match, language=normalized_lang)
    except Exception as e:
        logger.error(f"Erreur lors de la génération de la lettre: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error_code": "MODEL_ERROR", "message": "Le modèle IA rencontre un problème. Veuillez réessayer ultérieurement."},
        )
    new_letter.user_id = username
    new_letter.language = normalized_lang

    statement = select(CoverLetter).where(
        CoverLetter.job_id == job_id,
        CoverLetter.user_id == username,
        CoverLetter.language == normalized_lang,
    )
    existing_letter = session.exec(statement).first()

    if existing_letter:
        existing_letter.content_markdown = new_letter.content_markdown
        existing_letter.cliche_score = new_letter.cliche_score
        existing_letter.banned_phrases_detected_raw = new_letter.banned_phrases_detected_raw
        existing_letter.thinking_plan = new_letter.thinking_plan
        existing_letter.target_role = new_letter.target_role
        existing_letter.company_name = new_letter.company_name
        existing_letter.language = normalized_lang
        existing_letter.updated_at = utc_now()
        session.add(existing_letter)
        session.commit()
        session.refresh(existing_letter)
        letter = existing_letter
    else:
        session.add(new_letter)
        session.commit()
        session.refresh(new_letter)
        letter = new_letter

    return CoverLetterRead(
        id=letter.id,
        job_id=letter.job_id,
        profile_id=letter.profile_id,
        target_role=letter.target_role,
        company_name=letter.company_name,
        content_markdown=letter.content_markdown,
        cliche_score=letter.cliche_score,
        banned_phrases_detected=letter.banned_phrases_detected,
        thinking_plan=letter.thinking_plan,
        language=letter.language,
        created_at=letter.created_at,
        updated_at=letter.updated_at,
    )


@router.get("/{job_id}", response_model=CoverLetterRead)
def get_cover_letter(
    job_id: str,
    lang: str = Query("fr", description="Langue de la lettre : 'fr' ou 'en'"),
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
) -> CoverLetterRead:
    """Récupère la lettre générée pour une offre de l'utilisateur (la génère si elle n'existe pas encore)."""
    normalized_lang = "en" if lang.lower().strip() == "en" else "fr"

    job = session.get(JobOffer, job_id)
    if not job or job.user_id != username:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "JOB_NOT_FOUND", "message": f"Offre {job_id} introuvable."},
        )

    statement = select(CoverLetter).where(
        CoverLetter.job_id == job_id,
        CoverLetter.user_id == username,
        CoverLetter.language == normalized_lang,
    )
    letter = session.exec(statement).first()

    if not letter:
        return generate_cover_letter(job_id, lang=normalized_lang, username=username, session=session)

    return CoverLetterRead(
        id=letter.id,
        job_id=letter.job_id,
        profile_id=letter.profile_id,
        target_role=letter.target_role,
        company_name=letter.company_name,
        content_markdown=letter.content_markdown,
        cliche_score=letter.cliche_score,
        banned_phrases_detected=letter.banned_phrases_detected,
        thinking_plan=letter.thinking_plan,
        language=letter.language,
        created_at=letter.created_at,
        updated_at=letter.updated_at,
    )


@router.put("/{job_id}", response_model=CoverLetterRead)
def update_cover_letter(
    job_id: str,
    payload: CoverLetterUpdate,
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
) -> CoverLetterRead:
    """Met à jour le contenu de la lettre édité par l'étudiant et recalcule l'audit anti-clichés."""
    job = session.get(JobOffer, job_id)
    if not job or job.user_id != username:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "JOB_NOT_FOUND", "message": f"Offre {job_id} introuvable."},
        )

    statement = select(CoverLetter).where(
        CoverLetter.job_id == job_id,
        CoverLetter.user_id == username,
    )
    letter = session.exec(statement).first()

    if not letter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "LETTER_NOT_FOUND", "message": f"Lettre pour l'offre {job_id} introuvable."},
        )

    cliche_count, detected_phrases = CoverLetterService.audit_cliches(payload.content_markdown)

    letter.content_markdown = payload.content_markdown
    letter.cliche_score = cliche_count
    letter.banned_phrases_detected = detected_phrases
    letter.updated_at = utc_now()

    session.add(letter)
    session.commit()
    session.refresh(letter)

    return CoverLetterRead(
        id=letter.id,
        job_id=letter.job_id,
        profile_id=letter.profile_id,
        target_role=letter.target_role,
        company_name=letter.company_name,
        content_markdown=letter.content_markdown,
        cliche_score=letter.cliche_score,
        banned_phrases_detected=letter.banned_phrases_detected,
        thinking_plan=letter.thinking_plan,
        created_at=letter.created_at,
        updated_at=letter.updated_at,
    )


@router.get("/download/{job_id}", response_class=Response)
async def download_cover_letter(
    job_id: str,
    format: str = Query("pdf", description="Format de téléchargement : 'pdf', 'html', 'jpeg' ou 'txt'"),
    lang: str = Query("fr", description="Langue de la lettre : 'fr' ou 'en'"),
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
) -> Response:
    """
    Télécharge la lettre de motivation dans l'un des 4 formats supportés :
    .pdf (PDF vectoriel), .html (Document web autonome), .jpeg (Image haute résolution) ou .txt (Texte brut).
    """
    normalized_lang = "en" if lang.lower().strip() == "en" else "fr"
    fmt = format.lower().lstrip(".").strip()
    if fmt not in ("pdf", "html", "jpeg", "txt"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": "INVALID_FORMAT", "message": f"Format '{format}' non supporté. Choisissez parmi: pdf, html, jpeg, txt."},
        )

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

    statement = select(CoverLetter).where(
        CoverLetter.job_id == job_id,
        CoverLetter.user_id == username,
        CoverLetter.language == normalized_lang,
    )
    letter = session.exec(statement).first()

    if not letter:
        if not profile.is_complete:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"error_code": "PROFILE_INCOMPLETE", "message": "Complétez votre profil pour générer la lettre."},
            )
        ats_match = ATSMatchingEngine.evaluate_alignment(job, profile)
        letter = CoverLetterService.generate_cover_letter(job, profile, ats_match, language=normalized_lang)
        letter.user_id = username
        letter.language = normalized_lang
        session.add(letter)
        session.commit()
        session.refresh(letter)

    clean_name = sanitize_filename(profile.full_name) or "Candidat"
    clean_company = sanitize_filename(job.company) or "Entreprise"
    base_filename = f"Lettre_{clean_name}_{clean_company}"

    if fmt == "txt":
        txt_content = CoverLetterService.render_cover_letter_txt(
            content_markdown=letter.content_markdown,
            profile=profile,
            job=job,
            lang=normalized_lang,
        )
        return Response(
            content=txt_content.encode("utf-8"),
            media_type="text/plain; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{base_filename}.txt"'},
        )
    elif fmt == "html":
        html_content = CoverLetterService.render_cover_letter_html(
            content_markdown=letter.content_markdown,
            profile=profile,
            job=job,
            lang=normalized_lang,
        )
        return Response(
            content=html_content.encode("utf-8"),
            media_type="text/html; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{base_filename}.html"'},
        )
    elif fmt == "pdf":
        html_content = CoverLetterService.render_cover_letter_html(
            content_markdown=letter.content_markdown,
            profile=profile,
            job=job,
            lang=normalized_lang,
        )
        pdf_bytes = await PDFCompilerService.compile_html_to_pdf(html_content)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{base_filename}.pdf"'},
        )
    elif fmt == "jpeg":
        html_content = CoverLetterService.render_cover_letter_html(
            content_markdown=letter.content_markdown,
            profile=profile,
            job=job,
            lang=normalized_lang,
        )
        img_bytes = await PDFCompilerService.compile_html_to_image(html_content, image_format="jpeg")
        return Response(
            content=img_bytes,
            media_type="image/jpeg",
            headers={"Content-Disposition": f'attachment; filename="{base_filename}.jpeg"'},
        )


@router.post("/download/custom", response_class=Response)
async def download_custom_cover_letter(
    payload: CustomCoverLetterDownloadRequest,
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
) -> Response:
    """
    Télécharge directement le contenu édité de la lettre de motivation dans l'un des 4 formats :
    .pdf, .html, .jpeg ou .txt.
    """
    normalized_lang = "en" if payload.lang.lower().strip() == "en" else "fr"
    fmt = payload.format.lower().lstrip(".").strip()
    if fmt not in ("pdf", "html", "jpeg", "txt"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": "INVALID_FORMAT", "message": f"Format '{payload.format}' non supporté. Choisissez parmi: pdf, html, jpeg, txt."},
        )

    profile = _get_user_profile(session, username)
    job = session.get(JobOffer, payload.job_id) if payload.job_id else None

    company = payload.company_name or (job.company if job else "Entreprise")
    title = payload.job_title or (job.title if job else "Ingénieur")

    clean_name = sanitize_filename(profile.full_name if profile else "Candidat") or "Candidat"
    clean_company = sanitize_filename(company) or "Entreprise"
    base_filename = f"Lettre_{clean_name}_{clean_company}"

    if fmt == "txt":
        txt_content = CoverLetterService.render_cover_letter_txt(
            content_markdown=payload.content_markdown,
            profile=profile,
            job=job,
            job_title=title,
            company_name=company,
            lang=normalized_lang,
        )
        return Response(
            content=txt_content.encode("utf-8"),
            media_type="text/plain; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{base_filename}.txt"'},
        )
    elif fmt == "html":
        html_content = CoverLetterService.render_cover_letter_html(
            content_markdown=payload.content_markdown,
            profile=profile,
            job=job,
            job_title=title,
            company_name=company,
            lang=normalized_lang,
        )
        return Response(
            content=html_content.encode("utf-8"),
            media_type="text/html; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{base_filename}.html"'},
        )
    elif fmt == "pdf":
        html_content = CoverLetterService.render_cover_letter_html(
            content_markdown=payload.content_markdown,
            profile=profile,
            job=job,
            job_title=title,
            company_name=company,
            lang=normalized_lang,
        )
        pdf_bytes = await PDFCompilerService.compile_html_to_pdf(html_content)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{base_filename}.pdf"'},
        )
    elif fmt == "jpeg":
        html_content = CoverLetterService.render_cover_letter_html(
            content_markdown=payload.content_markdown,
            profile=profile,
            job=job,
            job_title=title,
            company_name=company,
            lang=normalized_lang,
        )
        img_bytes = await PDFCompilerService.compile_html_to_image(html_content, image_format="jpeg")
        return Response(
            content=img_bytes,
            media_type="image/jpeg",
            headers={"Content-Disposition": f'attachment; filename="{base_filename}.jpeg"'},
        )
