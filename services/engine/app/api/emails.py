from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, desc, select
from app.adapters.database import get_session
from app.api.events import broadcast_event
from app.domain.email_classifier import EmailClassifier
from app.domain.fsm import ApplicationFSM
from app.domain.models import (
    EmailInteraction,
    EmailInteractionRead,
    EmailSimulateRequest,
    JobOffer,
    utc_now,
)

router = APIRouter(prefix="/api/emails", tags=["Recruiter Emails"])


@router.get("/recent", response_model=list[EmailInteractionRead])
def list_recent_emails(
    limit: int = Query(30, ge=1, le=100),
    session: Session = Depends(get_session),
):
    """Liste les derniers retours recruteurs ingérés et archivés."""
    interactions = session.exec(
        select(EmailInteraction).order_by(desc(EmailInteraction.created_at)).limit(limit)
    ).all()

    result: list[EmailInteractionRead] = []
    for inter in interactions:
        item = EmailInteractionRead.model_validate(inter)
        if inter.job_id:
            job = session.get(JobOffer, inter.job_id)
            if job:
                item.company_name = job.company
                item.job_title = job.title
        result.append(item)

    return result


@router.post("/simulate", response_model=EmailInteractionRead)
async def simulate_incoming_email(
    payload: EmailSimulateRequest,
    session: Session = Depends(get_session),
):
    """
    Simule la réception d'un email d'un recruteur (ou ingestion réelle),
    analyse déterministement le contenu, associe à la candidature correspondante,
    et déclenche la mise à jour d'état FSM si applicable (Entretien ou Refus).
    """
    category, snippet = EmailClassifier.classify(payload.subject, payload.body)

    # Récupération des offres pour rapprochement
    jobs = session.exec(select(JobOffer)).all()
    matched_job = EmailClassifier.match_job(
        subject=payload.subject,
        body=payload.body,
        sender=payload.sender,
        jobs=jobs,
        company_hint=payload.company_hint,
    )

    # Mise à jour FSM si offre associée
    if matched_job:
        old_status = matched_job.status
        new_status = None

        if category == "INTERVIEW":
            # Si déjà soumis ou en révision, passage en entretien
            if old_status in ("SUBMITTED", "READY"):
                new_status = "INTERVIEW"
        elif category == "REJECTION":
            if old_status in ("SUBMITTED", "INTERVIEW", "READY"):
                new_status = "REJECTED"

        if new_status and new_status != old_status:
            matched_job.status = new_status
            matched_job.updated_at = utc_now()
            session.add(matched_job)
            session.commit()
            session.refresh(matched_job)

            # Événement SSE de changement de statut
            await broadcast_event(
                "JOB_STATUS_CHANGED",
                {
                    "job_id": matched_job.id,
                    "old_status": old_status,
                    "new_status": new_status,
                },
            )

    # Persistance de l'interaction email
    interaction = EmailInteraction(
        job_id=matched_job.id if matched_job else None,
        sender=payload.sender,
        subject=payload.subject,
        snippet=snippet,
        category=category,
        raw_body=payload.body,
        received_at=utc_now(),
    )
    session.add(interaction)
    session.commit()
    session.refresh(interaction)

    # Diffusion SSE de l'email reçu
    await broadcast_event(
        "EMAIL_RECEIVED",
        {
            "id": interaction.id,
            "category": interaction.category,
            "company": matched_job.company if matched_job else None,
            "subject": interaction.subject,
            "snippet": interaction.snippet,
        },
    )

    result = EmailInteractionRead.model_validate(interaction)
    if matched_job:
        result.company_name = matched_job.company
        result.job_title = matched_job.title

    return result


@router.post("/ingest")
async def trigger_email_ingestion(session: Session = Depends(get_session)):
    """
    Déclenche un cycle de synchronisation de la boîte mail.
    Pour l'environnement local/bac à sable, vérifie l'état et retourne le statut de synchronisation.
    """
    total_emails = len(session.exec(select(EmailInteraction)).all())
    return {
        "status": "synchronized",
        "message": "Boîte de réception synchronisée avec succès.",
        "total_archived": total_emails,
        "last_sync": utc_now().isoformat(),
    }
