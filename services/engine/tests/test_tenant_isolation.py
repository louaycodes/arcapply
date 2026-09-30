import pytest
import json
from sqlmodel import Session, select

from app.api.events import broadcast_event, _user_subscribers
from app.domain.models import JobOffer, MasterProfile, CustomCVDraft
from tests.conftest import engine, client


def test_job_isolation_between_tenants():
    with Session(engine) as session:
        # 1. Création d'une offre pour alice
        job_alice = JobOffer(
            platform="linkedin",
            external_id="ext-alice-101",
            title="Stage PFE IA Alice",
            company="AliceCorp",
            location="Paris",
            country="France",
            status="DISCOVERED",
            offer_type="PFE",
            user_id="alice",
        )
        session.add(job_alice)
        session.commit()
        session.refresh(job_alice)
        alice_job_id = job_alice.id

    # 2. Bob liste ses offres -> ne doit pas voir l'offre d'Alice
    res_bob_list = client.get("/api/jobs", headers={"X-Username": "bob"})
    assert res_bob_list.status_code == 200
    jobs_bob = res_bob_list.json()
    assert all(j["id"] != alice_job_id for j in jobs_bob)

    # 3. Bob tente d'accéder directement au détail de l'offre d'Alice -> 404
    res_bob_get = client.get(f"/api/jobs/{alice_job_id}", headers={"X-Username": "bob"})
    assert res_bob_get.status_code == 404

    # 4. Bob tente d'archiver l'offre d'Alice -> 404
    res_bob_archive = client.patch(f"/api/jobs/{alice_job_id}/archive", headers={"X-Username": "bob"})
    assert res_bob_archive.status_code == 404

    # 5. Bob tente de transiter l'état de l'offre d'Alice -> 404
    res_bob_trans = client.patch(
        f"/api/jobs/{alice_job_id}/transition",
        json={"new_status": "READY"},
        headers={"X-Username": "bob"},
    )
    assert res_bob_trans.status_code == 404

    # 6. Alice peut bien accéder à son offre
    res_alice_get = client.get(f"/api/jobs/{alice_job_id}", headers={"X-Username": "alice"})
    assert res_alice_get.status_code == 200
    assert res_alice_get.json()["id"] == alice_job_id


def test_clear_jobs_isolation():
    with Session(engine) as session:
        job_alice = JobOffer(
            platform="linkedin",
            external_id="ext-alice-clear",
            title="Stage PFE Alice",
            company="CorpA",
            offer_type="PFE",
            user_id="alice",
        )
        job_bob = JobOffer(
            platform="linkedin",
            external_id="ext-bob-clear",
            title="Stage PFE Bob",
            company="CorpB",
            offer_type="PFE",
            user_id="bob",
        )
        session.add(job_alice)
        session.add(job_bob)
        session.commit()
        bob_id = job_bob.id

    # Alice appelle clear
    res_clear = client.delete("/api/jobs/clear", headers={"X-Username": "alice"})
    assert res_clear.status_code == 200

    # Les offres d'Alice sont supprimées
    res_alice = client.get("/api/jobs", headers={"X-Username": "alice"})
    assert len(res_alice.json()) == 0

    # L'offre de Bob est toujours présente intacte
    res_bob = client.get("/api/jobs", headers={"X-Username": "bob"})
    assert any(j["id"] == bob_id for j in res_bob.json())


def test_ats_match_isolation():
    with Session(engine) as session:
        job_alice = JobOffer(
            platform="linkedin",
            external_id="ext-alice-ats",
            title="Stage PFE Data Alice",
            company="DataCorp",
            offer_type="PFE",
            user_id="alice",
        )
        session.add(job_alice)
        session.commit()
        session.refresh(job_alice)
        alice_id = job_alice.id

    # Bob tente d'évaluer l'alignement ATS sur l'offre d'Alice -> 404
    res_match = client.get(f"/api/ats/match/{alice_id}", headers={"X-Username": "bob"})
    assert res_match.status_code == 404

    # Batch ATS pour bob ne contient pas l'offre d'Alice
    res_batch = client.get("/api/ats/batch", headers={"X-Username": "bob"})
    assert res_batch.status_code == 200
    assert alice_id not in res_batch.json()


def test_cv_draft_isolation():
    # Alice sauvegarde son brouillon
    client.post(
        "/api/cv/save-draft",
        json={"full_name": "Alice Dupont", "headline": "Ingénieure IA", "language": "fr"},
        headers={"X-Username": "alice"},
    )

    # Bob sauvegarde son brouillon
    client.post(
        "/api/cv/save-draft",
        json={"full_name": "Bob Martin", "headline": "Ingénieur DevOps", "language": "fr"},
        headers={"X-Username": "bob"},
    )

    # Alice relit son brouillon
    res_alice = client.get("/api/cv/draft", headers={"X-Username": "alice"})
    assert res_alice.status_code == 200
    assert res_alice.json()["data"]["full_name"] == "Alice Dupont"

    # Bob relit son brouillon
    res_bob = client.get("/api/cv/draft", headers={"X-Username": "bob"})
    assert res_bob.status_code == 200
    assert res_bob.json()["data"]["full_name"] == "Bob Martin"


def test_email_isolation():
    # Simulation d'un email pour alice
    res_sim = client.post(
        "/api/emails/simulate",
        json={
            "sender": "rh@google.com",
            "subject": "Invitation entretien PFE",
            "body": "Bonjour, nous souhaitons vous rencontrer pour un entretien.",
        },
        headers={"X-Username": "alice"},
    )
    assert res_sim.status_code == 200

    # Bob consulte ses emails récents -> ne doit rien voir
    res_bob = client.get("/api/emails/recent", headers={"X-Username": "bob"})
    assert res_bob.status_code == 200
    assert len(res_bob.json()) == 0

    # Alice consulte ses emails -> voit son email
    res_alice = client.get("/api/emails/recent", headers={"X-Username": "alice"})
    assert res_alice.status_code == 200
    assert len(res_alice.json()) >= 1
    assert res_alice.json()[0]["sender"] == "rh@google.com"


@pytest.mark.asyncio
async def test_sse_targeted_broadcast():
    import asyncio
    queue_alice = asyncio.Queue()
    queue_bob = asyncio.Queue()

    _user_subscribers["alice"].add(queue_alice)
    _user_subscribers["bob"].add(queue_bob)

    try:
        # Émission d'un événement ciblé sur Alice
        await broadcast_event(
            "JOB_DISCOVERED",
            {"id": "test-job-alice", "title": "Offre Secrète Alice"},
            target_user="alice",
        )

        assert not queue_alice.empty()
        msg_alice = await queue_alice.get()
        assert "Offre Secrète Alice" in msg_alice

        # La file de Bob doit être strictement vide
        assert queue_bob.empty()
    finally:
        _user_subscribers["alice"].discard(queue_alice)
        _user_subscribers["bob"].discard(queue_bob)
