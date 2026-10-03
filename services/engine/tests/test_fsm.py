import pytest
from sqlmodel import Session

from app.domain.fsm import ApplicationFSM, JobStatus
from app.domain.models import JobOffer
from tests.conftest import client, engine


def test_fsm_valid_lifecycle_transitions():
    # Parcours nominal simplifié : Offres -> Candidatures envoyées -> Retenue / Non retenue
    ApplicationFSM.validate_transition(JobStatus.DISCOVERED.value, JobStatus.SUBMITTED.value)
    ApplicationFSM.validate_transition(JobStatus.SUBMITTED.value, JobStatus.OFFER.value)
    ApplicationFSM.validate_transition(JobStatus.SUBMITTED.value, JobStatus.REJECTED.value)

    # Réversibilité
    ApplicationFSM.validate_transition(JobStatus.OFFER.value, JobStatus.SUBMITTED.value)
    ApplicationFSM.validate_transition(JobStatus.REJECTED.value, JobStatus.SUBMITTED.value)
    ApplicationFSM.validate_transition(JobStatus.SUBMITTED.value, JobStatus.DISCOVERED.value)


def test_fsm_invalid_wild_jump_blocked():
    # Saut sauvage interdit : DISCOVERED -> OFFER direct sans candidature envoyée
    with pytest.raises(ValueError, match="invalide"):
        ApplicationFSM.validate_transition(JobStatus.DISCOVERED.value, JobStatus.OFFER.value)

    # DISCOVERED -> REJECTED direct sans candidature envoyée (utiliser ARCHIVED pour éliminer)
    with pytest.raises(ValueError, match="invalide"):
        ApplicationFSM.validate_transition(JobStatus.DISCOVERED.value, JobStatus.REJECTED.value)


def test_api_transition_job_status():
    with Session(engine) as session:
        job = JobOffer(
            id="job-fsm-test",
            platform="linkedin",
            external_id="ext-fsm",
            title="Ingénieur Cloud PFE",
            company="OVHcloud",
            status="DISCOVERED",
        )
        session.add(job)
        session.commit()

    # 1. Tentative de transition illégale directe vers OFFER -> Erreur 422 RFC 7807
    bad_res = client.patch(
        "/api/jobs/job-fsm-test/transition",
        json={"new_status": "OFFER"},
    )
    assert bad_res.status_code == 422
    err_data = bad_res.json()
    assert "INVALID_STATE_TRANSITION" in str(err_data)

    # 2. Transition légale directe : DISCOVERED -> SUBMITTED
    res1 = client.patch(
        "/api/jobs/job-fsm-test/transition",
        json={"new_status": "SUBMITTED"},
    )
    assert res1.status_code == 200
    assert res1.json()["status"] == "SUBMITTED"

    # 3. Transition légale : SUBMITTED -> OFFER (Retenue)
    res2 = client.patch(
        "/api/jobs/job-fsm-test/transition",
        json={"new_status": "OFFER"},
    )
    assert res2.status_code == 200
    assert res2.json()["status"] == "OFFER"
