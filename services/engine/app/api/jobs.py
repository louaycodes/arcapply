from datetime import timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from sqlalchemy import func, or_
from sqlmodel import Session, SQLModel, col, delete, desc, select
from app.adapters.scheduler import ALL_CONNECTORS, CrawlerScheduler
from app.adapters.connectors import infer_offer_type
from app.adapters.database import get_session
from app.api.events import broadcast_event
from app.domain.fsm import ApplicationFSM
from app.domain.models import (
    CoverLetter,
    EmailInteraction,
    JobCollectRequest,
    JobCollectSummary,
    JobOffer,
    JobOfferRead,
    MasterProfile,
    TargetedCV,
    VALID_OFFER_TYPES,
    utc_now,
)
from app.ports.connectors import BaseJobConnector

class JobTransitionRequest(SQLModel):
    new_status: str


class PipelineMetrics(SQLModel):
    total_tracked: int
    by_status: dict[str, int]
    submitted_total: int
    active_count: int
    interview_count: int
    offer_count: int
    rejected_count: int
    interview_rate_percent: float
    response_rate_percent: float
    stale_relance_count: int


router = APIRouter(prefix="/api/jobs", tags=["Job Offers & Radar"])

CONNECTORS = ALL_CONNECTORS



@router.get("", response_model=list[JobOfferRead])
def list_jobs(
    country: Optional[str] = Query(None, description="Filtrer par pays (ex: France, Tunisie)"),
    platform: Optional[str] = Query(None, description="Filtrer par plateforme source"),
    status: Optional[str] = Query(None, description="Filtrer par statut"),
    offer_type: Optional[str] = Query(
        None,
        description="Surcharge explicite du filtrage par type d'offre (PFE|JOB). Si absent, utilise le search_mode du profil.",
    ),
    period: Optional[str] = Query(None, description="Filtrage temporel de fraîcheur: today | week | month"),
    direct_only: bool = Query(False, description="Uniquement sites carrières directs des entreprises"),
    search: Optional[str] = Query(None, description="Recherche textuelle dans le titre ou l'entreprise"),
    include_archived: bool = Query(False, description="Inclure les offres archivées"),
    session: Session = Depends(get_session),
):
    """Liste les offres du Radar, filtrées automatiquement selon le search_mode du profil.

    Le type d'offre actif est déterminé dans cet ordre de priorité :
    1. Le query param ``offer_type`` (surcharge explicite, pour les tests).
    2. Le champ ``search_mode`` du profil ``default-profile`` (source de vérité).
    3. ``"PFE"`` comme valeur de repli si le profil est absent.
    """
    query = select(JobOffer)

    if not include_archived:
        query = query.where(JobOffer.status != "ARCHIVED")

    if country and country != "all":
        query = query.where(JobOffer.country == country)

    if platform and platform != "all":
        query = query.where(JobOffer.platform == platform)

    if status:
        query = query.where(JobOffer.status == status)

    # --- Filtrage par type d'offre (search_mode corrélé) ---
    if offer_type:
        # Surcharge explicite : valider puis appliquer
        resolved_type = offer_type.upper()
        if resolved_type not in VALID_OFFER_TYPES:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "error_code": "INVALID_OFFER_TYPE",
                    "message": f"offer_type invalide : '{offer_type}'. Valeurs acceptées : PFE, JOB.",
                },
            )
        query = query.where(JobOffer.offer_type == resolved_type)
    else:
        # Lecture automatique du search_mode du profil
        profile = session.get(MasterProfile, "default-profile")
        active_mode = profile.search_mode if profile else "PFE"
        query = query.where(JobOffer.offer_type == active_mode)
    # -------------------------------------------------------

    # --- Filtrage direct carrière & temporel ---
    if direct_only:
        query = query.where(JobOffer.is_direct_career_site == True)

    if period:
        now = utc_now()
        period_lower = period.lower()
        threshold = None
        if period_lower == "today":
            threshold = now - timedelta(hours=24)
        elif period_lower == "week":
            threshold = now - timedelta(days=7)
        elif period_lower == "month":
            threshold = now - timedelta(days=30)

        if threshold is not None:
            query = query.where(
                or_(
                    JobOffer.published_at >= threshold,
                    (JobOffer.published_at == None) & (JobOffer.collected_at >= threshold),
                )
            )
    # -------------------------------------------

    if search:
        search_filter = f"%{search.lower()}%"
        query = query.where(
            col(JobOffer.title).ilike(search_filter)
            | col(JobOffer.company).ilike(search_filter)
        )

    query = query.order_by(desc(JobOffer.collected_at))
    offers = session.exec(query).all()
    return offers


@router.delete("/clear")
@router.delete("")
async def clear_all_jobs(session: Session = Depends(get_session)):
    """
    Supprime toutes les offres d'emploi de la base de données locale
    ainsi que les CVs ciblés et lettres de motivation associés.
    """
    session.exec(delete(TargetedCV))
    session.exec(delete(CoverLetter))
    session.exec(delete(EmailInteraction))
    session.exec(delete(JobOffer))
    session.commit()

    # Diffusion SSE pour actualisation immédiate de l'interface
    await broadcast_event(
        "JOBS_CLEARED",
        {"message": "Toutes les offres ont été supprimées avec succès."},
    )

    return {
        "status": "success",
        "message": "Toutes les offres et documents associés ont été supprimés avec succès.",
    }


@router.get("/metrics", response_model=PipelineMetrics)
def get_pipeline_metrics(session: Session = Depends(get_session)):
    """
    Calcule les métriques en temps réel du pipeline Kanban :
    - Répartition par statut
    - Total de candidatures soumises (SUBMITTED, INTERVIEW, OFFER, REJECTED)
    - Candidatures actives (SUBMITTED, INTERVIEW)
    - Taux de transformation en entretien (cible > 15%)
    - Taux de réponse global
    - Candidatures soumises depuis plus de 7 jours nécessitant une relance
    """
    all_jobs = session.exec(select(JobOffer)).all()
    total = len(all_jobs)

    counts: dict[str, int] = {
        "DISCOVERED": 0,
        "REVIEWING": 0,
        "READY": 0,
        "SUBMITTED": 0,
        "INTERVIEW": 0,
        "OFFER": 0,
        "REJECTED": 0,
        "ARCHIVED": 0,
    }
    for j in all_jobs:
        if j.status in counts:
            counts[j.status] += 1
        else:
            counts[j.status] = 1

    interview_count = counts.get("INTERVIEW", 0)
    offer_count = counts.get("OFFER", 0)
    rejected_count = counts.get("REJECTED", 0)
    submitted_count = counts.get("SUBMITTED", 0)

    # Total ayant franchi la soumission
    submitted_total = submitted_count + interview_count + offer_count + rejected_count
    active_count = submitted_count + interview_count

    interview_rate = (
        round(((interview_count + offer_count) / submitted_total) * 100, 1)
        if submitted_total > 0
        else 0.0
    )
    response_rate = (
        round(((interview_count + offer_count + rejected_count) / submitted_total) * 100, 1)
        if submitted_total > 0
        else 0.0
    )

    now = utc_now()
    seven_days_ago = now - timedelta(days=7)
    stale_relance_count = 0
    for j in all_jobs:
        if j.status == "SUBMITTED":
            check_date = j.updated_at or j.collected_at
            if check_date.tzinfo is None:
                check_date = check_date.replace(tzinfo=timezone.utc)
            if check_date <= seven_days_ago:
                stale_relance_count += 1

    return PipelineMetrics(
        total_tracked=total,
        by_status=counts,
        submitted_total=submitted_total,
        active_count=active_count,
        interview_count=interview_count,
        offer_count=offer_count,
        rejected_count=rejected_count,
        interview_rate_percent=interview_rate,
        response_rate_percent=response_rate,
        stale_relance_count=stale_relance_count,
    )


@router.get("/sources")
def get_sources_status():
    """Retourne la liste des connecteurs enregistrés et leur télémétrie de scraping."""
    return CrawlerScheduler.get_status()


@router.post("/crawl-all")
async def trigger_full_crawl(
    payload: Optional[JobCollectRequest] = None,
    session: Session = Depends(get_session),
):
    """Déclenche l'ingestion multi-sources en temps réel avec diffusion SSE."""
    kw = payload.keywords if payload else None
    loc = payload.locations if payload else None
    plat = payload.platforms if payload else None
    summary = await CrawlerScheduler.run_full_crawl(
        keywords=kw,
        locations=loc,
        platforms=plat,
        session=session,
    )
    return summary


@router.get("/{job_id}", response_model=JobOfferRead)
def get_job(job_id: str, session: Session = Depends(get_session)):
    """Récupère le détail d'une offre spécifique."""
    job = session.get(JobOffer, job_id)
    if not job:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail={"error_code": "JOB_NOT_FOUND", "message": f"Offre {job_id} introuvable."},
        )
    return job


@router.patch("/{job_id}/archive", response_model=JobOfferRead)
async def archive_job(job_id: str, session: Session = Depends(get_session)):
    """Archive une offre et la retire du flux Radar actif."""
    job = session.get(JobOffer, job_id)
    if not job:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
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


@router.patch("/{job_id}/transition", response_model=JobOfferRead)
async def transition_job_status(
    job_id: str,
    payload: JobTransitionRequest,
    session: Session = Depends(get_session),
):
    """
    Exécute une transition d'état sur l'offre selon la machine à états finis AD-6.
    Rejette toute transition illégale (ex: DISCOVERED -> SUBMITTED) avec HTTP 422.
    """
    job = session.get(JobOffer, job_id)
    if not job:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail={"error_code": "JOB_NOT_FOUND", "message": f"Offre {job_id} introuvable."},
        )

    try:
        ApplicationFSM.validate_transition(job.status, payload.new_status)
    except ValueError as e:
        raise HTTPException(
            status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "INVALID_STATE_TRANSITION",
                "message": str(e),
                "current_status": job.status,
                "target_status": payload.new_status,
            },
        )

    job.status = payload.new_status.upper()
    job.updated_at = utc_now()
    session.add(job)
    session.commit()
    session.refresh(job)

    # Diffusion SSE du changement de statut
    await broadcast_event(
        "JOB_STATUS_CHANGED",
        {"id": job.id, "title": job.title, "company": job.company, "status": job.status},
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

            # Inférence automatique du type d'offre avant persistance
            inferred_type = infer_offer_type(
                title=raw["title"],
                description=raw.get("description_raw", ""),
            )

            # Création de la nouvelle offre avec offer_type classifié
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
                offer_type=inferred_type,
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
