import asyncio
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlmodel import Session, select

from app.adapters.database import get_session
from app.api.auth import get_current_username
from app.domain.models import JobOffer, ReconDossier, ReconDossierRead
from app.domain.recon import run_deep_recon_on_job

router = APIRouter(prefix="/api/recon", tags=["deep-recon"])


@router.get("/dossier/{job_id}", response_model=ReconDossierRead)
def get_recon_dossier(
    job_id: str,
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
):
    """Récupère le dossier d'enquête approfondie Deep Recon d'une offre."""
    dossier = session.exec(
        select(ReconDossier).where(
            ReconDossier.job_id == job_id,
            ReconDossier.user_id == username,
        )
    ).first()

    if not dossier:
        raise HTTPException(status_code=404, detail="Dossier d'enquête introuvable pour cette offre")

    return ReconDossierRead(
        id=dossier.id,
        job_id=dossier.job_id,
        user_id=dossier.user_id,
        external_url=dossier.external_url,
        full_description=dossier.full_description,
        company_name=dossier.company_name,
        company_website=dossier.company_website,
        company_mission=dossier.company_mission,
        company_culture=dossier.company_culture,
        tech_stack_detected=dossier.tech_stack_detected,
        investigation_notes=dossier.investigation_notes,
        status=dossier.status,
        created_at=dossier.created_at,
        updated_at=dossier.updated_at,
    )


@router.post("/trigger/{job_id}")
async def trigger_recon_investigation(
    job_id: str,
    background_tasks: BackgroundTasks,
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
):
    """Déclenche l'agent autonome Deep Recon sur une offre en arrière-plan."""
    job = session.exec(
        select(JobOffer).where(
            JobOffer.id == job_id,
            JobOffer.user_id == username,
        )
    ).first()

    if not job:
        raise HTTPException(status_code=404, detail="Offre introuvable")

    background_tasks.add_task(run_deep_recon_on_job, job_id, username)
    return {
        "status": "success",
        "message": f"Agent Deep Recon déployé sur l'offre '{job.title}' chez {job.company}",
    }
