from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.adapters.database import get_session
from app.api.auth import get_current_username
from app.domain.ats import ATSMatchingEngine
from app.domain.models import ATSMatchResult, JobOffer, MasterProfile

router = APIRouter(prefix="/api/ats", tags=["ATS Deterministic Matching"])


def _get_master_profile(session: Session, username: str) -> MasterProfile:
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

    if not profile:
        profile = MasterProfile(
            id=f"profile-{uname}",
            user_id=uname,
            full_name=uname.capitalize(),
            email=f"{uname}@arcapply.local",
            is_complete=False,
        )
        session.add(profile)
        session.commit()

    return profile


@router.get("/match/{job_id}", response_model=ATSMatchResult)
def get_job_ats_match(
    job_id: str,
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
):
    """
    Calcule l'alignement ATS déterministe entre une offre de l'utilisateur et son Master Profile.
    Retourne le score (0 à 100%) et la ventilation en 3 listes sans aucune hallucination.
    """
    job = session.get(JobOffer, job_id)
    if not job or job.user_id != username:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "JOB_NOT_FOUND", "message": f"Offre {job_id} introuvable."},
        )

    profile = _get_master_profile(session, username)
    result = ATSMatchingEngine.evaluate_alignment(job, profile)
    return result


@router.get("/batch", response_model=dict[str, ATSMatchResult])
def get_batch_ats_matches(
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
):
    """
    Calcule l'alignement ATS pour toutes les offres actives du Radar de l'utilisateur en un seul appel.
    Permet au cockpit d'afficher instantanément les badges ATS sur chaque carte d'offre.
    """
    profile = _get_master_profile(session, username)
    jobs = session.exec(
        select(JobOffer).where(
            JobOffer.user_id == username,
            JobOffer.status != "ARCHIVED",
        )
    ).all()

    matches: dict[str, ATSMatchResult] = {}
    for job in jobs:
        matches[job.id] = ATSMatchingEngine.evaluate_alignment(job, profile)

    return matches
