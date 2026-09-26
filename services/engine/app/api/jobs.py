from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, col, desc, select
from app.adapters.connectors.jobteaser import JobteaserJobConnector
from app.adapters.connectors.linkedin import LinkedInJobConnector
from app.adapters.database import get_session
from app.api.events import broadcast_event
from app.domain.models import (
    JobCollectRequest,
    JobCollectSummary,
    JobOffer,
    JobOfferRead,
    utc_now,
)
from app.ports.connectors import BaseJobConnector

router = APIRouter(prefix="/api/jobs", tags=["Job Offers & Radar"])

CONNECTORS: dict[str, type[BaseJobConnector]] = {
    "linkedin": LinkedInJobConnector,
    "jobteaser": JobteaserJobConnector,
}


@router.get("", response_model=list[JobOfferRead])
def list_jobs(
    country: Optional[str] = Query(None, description="Filtrer par pays (ex: France, Tunisie)"),
    platform: Optional[str] = Query(None, description="Filtrer par plateforme source"),
    status: Optional[str] = Query(None, description="Filtrer par statut"),
    search: Optional[str] = Query(None, description="Recherche textuelle dans le titre ou l'entreprise"),
    include_archived: bool = Query(False, description="Inclure les offres archivées"),
    session: Session = Depends(get_session),
):
    """Liste les offres d'emploi avec filtres pour alimenter le flux Radar."""
    query = select(JobOffer)

    if not include_archived:
        query = query.where(JobOffer.status != "ARCHIVED")

    if country and country != "all":
        query = query.where(JobOffer.country == country)

    if platform and platform != "all":
        query = query.where(JobOffer.platform == platform)

    if status:
        query = query.where(JobOffer.status == status)

    if search:
        search_filter = f"%{search.lower()}%"
        query = query.where(
            col(JobOffer.title).ilike(search_filter)
            | col(JobOffer.company).ilike(search_filter)
        )

    query = query.order_by(desc(JobOffer.collected_at))
    offers = session.exec(query).all()
    return offers


@router.get("/{job_id}", response_model=JobOfferRead)
def get_job(job_id: str, session: Session = Depends(get_session)):
    """Récupère le détail d'une offre spécifique."""
    job = session.get(JobOffer, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "JOB_NOT_FOUND", "message": f"Offre {job_id} introuvable."},
        )
    return job


@router.patch("/{job_id}/archive", response_model=JobOfferRead)
async def archive_job(job_id: str, session: Session = Depends(get_session)):
    """Archive une offre et la retire du flux Radar actif."""
    job = session.get(JobOffer, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "JOB_NOT_FOUND", "message": f"Offre {job_id} introuvable."},
        )

    job.status = "ARCHIVED"
    job.updated_at = utc_now()
    session.add(job)
    session.commit()
    session.refresh(job)

    # Diffusion SSE
    await broadcast_event(
        "JOB_ARCHIVED",
        {"id": job.id, "title": job.title, "company": job.company},
    )

    return job


@router.post("/collect", response_model=JobCollectSummary)
async def trigger_collection(
    request: JobCollectRequest,
    session: Session = Depends(get_session),
):
    """
    Déclenche la collecte multi-plateformes avec déduplication stricte
    et diffusion temps réel de la progression par SSE.
    """
    total_collected = 0
    new_jobs_count = 0
    duplicate_count = 0
    active_platforms: list[str] = []

    for platform_key in request.platforms:
        connector_cls = CONNECTORS.get(platform_key.lower())
        if not connector_cls:
            continue

        active_platforms.append(platform_key)
        connector = connector_cls()

        # Émission d'événement SSE de début de scraping pour la plateforme
        await broadcast_event(
            "SCRAPE_PROGRESS",
            {
                "platform": platform_key,
                "status": "in_progress",
                "message": f"Démarrage de la collecte sur {platform_key.capitalize()}...",
            },
        )

        raw_jobs = await connector.search_jobs(
            keywords=request.keywords,
            locations=request.locations,
            limit=request.limit_per_platform,
        )

        for raw in raw_jobs:
            total_collected += 1
            # Vérification de déduplication stricte sur (platform, external_id)
            existing = session.exec(
                select(JobOffer).where(
                    JobOffer.platform == raw["platform"],
                    JobOffer.external_id == raw["external_id"],
                )
            ).first()

            if existing:
                duplicate_count += 1
                continue

            # Création de la nouvelle offre
            new_job = JobOffer(
                platform=raw["platform"],
                external_id=raw["external_id"],
                title=raw["title"],
                company=raw["company"],
                location=raw.get("location", ""),
                country=raw.get("country", "France"),
                description_raw=raw.get("description_raw", ""),
                url=raw.get("url", ""),
                status="DISCOVERED",
            )
            session.add(new_job)
            session.commit()
            session.refresh(new_job)
            new_jobs_count += 1

            # Diffusion immédiate de l'offre découverte sur le bus SSE
            await broadcast_event(
                "JOB_DISCOVERED",
                {
                    "id": new_job.id,
                    "title": new_job.title,
                    "company": new_job.company,
                    "location": new_job.location,
                    "country": new_job.country,
                    "platform": new_job.platform,
                    "status": new_job.status,
                    "url": new_job.url,
                    "collected_at": new_job.collected_at.isoformat(),
                },
            )

        # Événement SSE de fin de plateforme
        await broadcast_event(
            "SCRAPE_PROGRESS",
            {
                "platform": platform_key,
                "status": "completed",
                "message": f"Collecte achevée sur {platform_key.capitalize()}.",
            },
        )

    summary_msg = (
        f"Collecte terminée : {new_jobs_count} nouvelle(s) offre(s) PFE détectée(s), "
        f"{duplicate_count} doublon(s) filtré(s)."
    )

    return JobCollectSummary(
        collected_count=total_collected,
        new_count=new_jobs_count,
        duplicate_count=duplicate_count,
        platforms=active_platforms,
        message=summary_msg,
    )
