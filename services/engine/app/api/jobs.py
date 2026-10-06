from datetime import timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from sqlalchemy import func, or_
from sqlmodel import Session, SQLModel, col, delete, desc, select
from app.adapters.scheduler import ALL_CONNECTORS, CrawlerScheduler
from app.adapters.connectors import infer_offer_type, is_pfe_offer
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
from app.domain.anti_rescrape import (
    is_job_already_applied,
    is_job_already_archived,
    is_job_excluded_from_scraping,
    record_applied_signature,
    remove_applied_signature,
    record_archived_signature,
    remove_archived_signature,
)
from app.ports.connectors import BaseJobConnector
from app.api.auth import get_current_username

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
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
):
    """Liste les offres du Radar, filtrées pour l'utilisateur courant selon le search_mode du profil."""
    query = select(JobOffer).where(JobOffer.user_id == username)

    if not include_archived:
        query = query.where(JobOffer.status != "ARCHIVED")

    if country and country != "all":
        query = query.where(JobOffer.country == country)

    if platform and platform != "all":
        query = query.where(JobOffer.platform == platform)

    if status:
        query = query.where(JobOffer.status == status)

    # --- Filtrage par type d'offre (ArcApply 100% PFE) ---
    if offer_type:
        resolved_type = offer_type.upper()
        if resolved_type not in VALID_OFFER_TYPES:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "error_code": "INVALID_OFFER_TYPE",
                    "message": f"offer_type invalide : '{offer_type}'. ArcApply est dédié exclusivement aux stages PFE (valeur acceptée : PFE).",
                },
            )
        query = query.where(JobOffer.offer_type == resolved_type)
    else:
        query = query.where(JobOffer.offer_type == "PFE")
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
    # Garde-fou strict : seules les offres conformes aux critères de stage PFE s'affichent
    return [o for o in offers if is_pfe_offer(o.title, o.description_raw)]


@router.delete("/clear")
@router.delete("")
async def clear_all_jobs(
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
):
    """
    Supprime toutes les offres d'emploi associées à l'utilisateur courant
    ainsi que les CVs ciblés et lettres de motivation associés.
    """
    user_jobs = session.exec(select(JobOffer).where(JobOffer.user_id == username)).all()
    for j in user_jobs:
        session.exec(delete(TargetedCV).where(TargetedCV.job_id == j.id))
        session.exec(delete(CoverLetter).where(CoverLetter.job_id == j.id))
        session.exec(delete(EmailInteraction).where(EmailInteraction.job_id == j.id))
        session.delete(j)

    session.exec(delete(EmailInteraction).where(EmailInteraction.user_id == username))
    session.commit()

    # Diffusion SSE pour actualisation immédiate de l'interface du tenant
    await broadcast_event(
        "JOBS_CLEARED",
        {"message": f"Toutes les offres de {username} ont été supprimées avec succès."},
        target_user=username,
    )

    return {
        "status": "success",
        "message": f"Toutes les offres de {username} et documents associés ont été supprimés avec succès.",
    }


@router.get("/metrics", response_model=PipelineMetrics)
def get_pipeline_metrics(
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
):

    """
    Calcule les métriques en temps réel du pipeline Kanban :
    - Répartition par statut
    - Total de candidatures soumises (SUBMITTED, INTERVIEW, OFFER, REJECTED)
    - Candidatures actives (SUBMITTED, INTERVIEW)
    - Taux de transformation en entretien (cible > 15%)
    - Taux de réponse global
    - Candidatures soumises depuis plus de 7 jours nécessitant une relance
    """
    all_jobs = session.exec(select(JobOffer).where(JobOffer.user_id == username)).all()
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
def get_sources_status(username: str = Depends(get_current_username)):
    """Retourne la liste des connecteurs enregistrés et leur télémétrie de scraping pour l'utilisateur."""
    return CrawlerScheduler.get_status(user_id=username)


@router.post("/crawl-all")
async def trigger_full_crawl(
    payload: Optional[JobCollectRequest] = None,
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
):
    """Déclenche l'ingestion multi-sources en temps réel avec diffusion SSE pour l'utilisateur."""
    kw = payload.keywords if payload else None
    loc = payload.locations if payload else None
    plat = payload.platforms if payload else None
    limit = payload.limit_per_platform if payload and payload.limit_per_platform else 15
    summary = await CrawlerScheduler.run_full_crawl(
        keywords=kw,
        locations=loc,
        platforms=plat,
        limit_per_platform=limit,
        session=session,
        user_id=username,
    )

    return summary


@router.get("/{job_id}", response_model=JobOfferRead)
def get_job(
    job_id: str,
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
):
    """Récupère le détail d'une offre spécifique de l'utilisateur."""
    job = session.get(JobOffer, job_id)
    if not job or job.user_id != username:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail={"error_code": "JOB_NOT_FOUND", "message": f"Offre {job_id} introuvable."},
        )
    return job


@router.patch("/{job_id}/archive", response_model=JobOfferRead)
async def archive_job(
    job_id: str,
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
):
    """Archive une offre et la retire du flux Radar actif de l'utilisateur."""
    job = session.get(JobOffer, job_id)
    if not job or job.user_id != username:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail={"error_code": "JOB_NOT_FOUND", "message": f"Offre {job_id} introuvable."},
        )

    job.status = "ARCHIVED"
    job.updated_at = utc_now()
    session.add(job)
    session.commit()
    session.refresh(job)

    # Enregistrement pérenne du bouclier anti-rescrape
    record_archived_signature(session, job)

    # Diffusion SSE
    await broadcast_event(
        "JOB_ARCHIVED",
        {"id": job.id, "title": job.title, "company": job.company},
        target_user=username,
    )

    return job


@router.patch("/{job_id}/transition", response_model=JobOfferRead)
async def transition_job_status(
    job_id: str,
    payload: JobTransitionRequest,
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
):
    """
    Exécute une transition d'état sur l'offre selon la machine à états finis AD-6.
    Rejette toute transition illégale (ex: DISCOVERED -> SUBMITTED) avec HTTP 422.
    """
    job = session.get(JobOffer, job_id)
    if not job or job.user_id != username:
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

    target_st = payload.new_status.upper()
    old_st = job.status
    job.status = target_st
    if target_st in ("SUBMITTED", "INTERVIEW", "OFFER"):
        job.is_applied = True
        if not job.applied_at:
            job.applied_at = utc_now()
        record_applied_signature(session, job)
    elif target_st in ("DISCOVERED", "REVIEWING"):
        job.is_applied = False
        job.applied_at = None
        remove_applied_signature(session, username, job.id)

    if target_st == "ARCHIVED":
        record_archived_signature(session, job)
    elif old_st == "ARCHIVED" and target_st != "ARCHIVED":
        remove_archived_signature(session, username, job.id)

    job.updated_at = utc_now()
    session.add(job)
    session.commit()
    session.refresh(job)

    # Diffusion SSE du changement de statut
    await broadcast_event(
        "JOB_STATUS_CHANGED",
        {
            "id": job.id,
            "title": job.title,
            "company": job.company,
            "status": job.status,
            "is_applied": job.is_applied,
        },
        target_user=username,
    )

    return job


@router.post("/{job_id}/mark-applied", response_model=JobOfferRead)
async def mark_job_as_applied(
    job_id: str,
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
) -> JobOffer:
    """
    Marque explicitement une offre comme déjà postulée par le candidat.
    Enregistre son empreinte dans le bouclier anti-rescrape pour garantir
    qu'elle ne sera plus JAMAIS ré-importée ou ré-affichée comme nouvelle découverte.
    """
    job = session.get(JobOffer, job_id)
    if not job or job.user_id != username:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail={"error_code": "JOB_NOT_FOUND", "message": f"Offre {job_id} introuvable."},
        )

    job.is_applied = True
    job.status = "SUBMITTED"
    job.applied_at = utc_now()
    job.updated_at = utc_now()
    session.add(job)
    session.commit()
    session.refresh(job)

    # Persistance de l'empreinte anti-rescrape
    record_applied_signature(session, job)

    await broadcast_event(
        "JOB_STATUS_CHANGED",
        {
            "id": job.id,
            "title": job.title,
            "company": job.company,
            "status": job.status,
            "is_applied": True,
        },
        target_user=username,
    )

    return job


@router.post("/{job_id}/unmark-applied", response_model=JobOfferRead)
async def unmark_job_as_applied(
    job_id: str,
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
) -> JobOffer:
    """
    Annule le statut déjà postulé d'une offre et la replace dans les découvertes actives.
    """
    job = session.get(JobOffer, job_id)
    if not job or job.user_id != username:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail={"error_code": "JOB_NOT_FOUND", "message": f"Offre {job_id} introuvable."},
        )

    job.is_applied = False
    job.status = "DISCOVERED"
    job.applied_at = None
    job.updated_at = utc_now()
    session.add(job)
    session.commit()
    session.refresh(job)

    # Suppression de l'empreinte anti-rescrape
    remove_applied_signature(session, username, job.id)

    await broadcast_event(
        "JOB_STATUS_CHANGED",
        {
            "id": job.id,
            "title": job.title,
            "company": job.company,
            "status": job.status,
            "is_applied": False,
        },
        target_user=username,
    )

    return job


@router.post("/collect", response_model=JobCollectSummary)
async def trigger_collection(
    request: JobCollectRequest,
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
):
    """
    Déclenche la collecte multi-plateformes avec déduplication stricte,
    enrichissement approfondi et diffusion temps réel de la progression par SSE.
    """
    res = await CrawlerScheduler.run_full_crawl(
        keywords=request.keywords,
        locations=request.locations,
        platforms=request.platforms,
        limit_per_platform=request.limit_per_platform,
        session=session,
        user_id=username,
    )
    return JobCollectSummary(
        collected_count=res.get("collected_count", 0),
        new_count=res.get("new_count", 0),
        duplicate_count=res.get("duplicate_count", 0),
        platforms=res.get("platforms", request.platforms),
        message=res.get("message", "Collecte multi-sources achevée."),
    )


@router.delete("/wipe")
def wipe_user_jobs(
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session),
):
    """Supprime toutes les offres d'emploi associées à l'utilisateur courant."""
    jobs = session.exec(select(JobOffer).where(JobOffer.user_id == username)).all()
    count = len(jobs)
    for j in jobs:
        session.delete(j)
    session.commit()
    return {"status": "ok", "deleted_count": count, "user": username}

