from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.adapters.database import get_session
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
    new_letter = CoverLetterService.generate_cover_letter(job, profile, ats_match, language=normalized_lang)
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
