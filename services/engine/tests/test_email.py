from sqlmodel import Session
from app.domain.email_classifier import EmailClassifier
from app.domain.models import JobOffer
from tests.conftest import engine, client


def test_email_classifier_categories():
    # 1. Interview
    subject_inv = "Invitation à un entretien technique - Stage Ingénieur"
    body_inv = "Bonjour, nous aimerions convenir d'un créneau pour un entretien Teams la semaine prochaine."
    cat_inv, snip_inv = EmailClassifier.classify(subject_inv, body_inv)
    assert cat_inv == "INTERVIEW"
    assert "entretien" in snip_inv.lower()

    # 2. Rejection
    subject_rej = "Suite de votre candidature PFE"
    body_rej = "Nous regrettons de vous informer que nous avons choisi de poursuivre avec d'autres candidats."
    cat_rej, snip_rej = EmailClassifier.classify(subject_rej, body_rej)
    assert cat_rej == "REJECTION"
    assert "regrettons" in snip_rej.lower() or "candidats" in snip_rej.lower()

    # 3. Acknowledgement
    subject_ack = "Accusé de réception de votre candidature"
    body_ack = "Nous avons bien reçu votre dossier de candidature. Il a été transmis à nos équipes de recrutement."
    cat_ack, snip_ack = EmailClassifier.classify(subject_ack, body_ack)
    assert cat_ack == "ACKNOWLEDGEMENT"


def test_email_matching_and_automatic_interview_transition():
    # Création d'une offre à l'état SUBMITTED
    with Session(engine) as session:
        job = JobOffer(
            platform="linkedin",
            external_id="ext-thales-interview",
            title="Ingénieur Systèmes Embarqués PFE",
            company="Thales Group",
            status="SUBMITTED",
        )
        session.add(job)
        session.commit()
        session.refresh(job)
        job_id = job.id

    # Simulation d'un email de convocation
    payload = {
        "sender": "recrutement@thalesgroup.com",
        "subject": "Thales - Convocation entretien technique stage PFE",
        "body": "Bonjour, suite à votre candidature pour le stage, nous souhaitons vous rencontrer en visio.",
        "company_hint": "Thales",
    }
    res = client.post("/api/emails/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["category"] == "INTERVIEW"
    assert data["job_id"] == job_id
    assert "Thales" in data["company_name"]

    # Vérification que le statut de l'offre a basculé automatiquement vers INTERVIEW
    with Session(engine) as session:
        updated_job = session.get(JobOffer, job_id)
        assert updated_job.status == "INTERVIEW"


def test_email_matching_and_rejection_transition():
    # Création d'une offre à l'état SUBMITTED
    with Session(engine) as session:
        job = JobOffer(
            platform="jobteaser",
            external_id="ext-airbus-rej",
            title="Ingénieur DevOps PFE",
            company="Airbus Defence",
            status="SUBMITTED",
        )
        session.add(job)
        session.commit()
        session.refresh(job)
        job_id = job.id

    payload = {
        "sender": "careers@airbus.com",
        "subject": "Réponse concernant votre candidature Airbus",
        "body": "Nous avons bien étudié votre profil mais nous ne pouvons donner suite favorablement à votre démarche.",
    }
    res = client.post("/api/emails/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["category"] == "REJECTION"
    assert data["job_id"] == job_id

    # Vérification que le statut est REJECTED
    with Session(engine) as session:
        updated_job = session.get(JobOffer, job_id)
        assert updated_job.status == "REJECTED"


def test_email_recent_and_ingest_endpoints():
    # Simulation préalable d'un email pour peupler la base du test
    sim_payload = {
        "sender": "rh@renault.com",
        "subject": "Candidature Stage PFE",
        "body": "Merci pour votre candidature.",
    }
    client.post("/api/emails/simulate", json=sim_payload)

    # Ingest trigger
    res_ingest = client.post("/api/emails/ingest")
    assert res_ingest.status_code == 200
    assert res_ingest.json()["status"] == "synchronized"

    # Recent list
    res_recent = client.get("/api/emails/recent")
    assert res_recent.status_code == 200
    items = res_recent.json()
    assert isinstance(items, list)
    assert len(items) >= 1
    assert items[0]["sender"] == "rh@renault.com"
