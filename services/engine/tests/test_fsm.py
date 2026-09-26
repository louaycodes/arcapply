import pytest
from sqlmodel import Session

from app.domain.fsm import ApplicationFSM, JobStatus
from app.domain.models import JobOffer
from tests.conftest import client, engine


def test_fsm_valid_lifecycle_transitions():
    # Parcours nominal complet AD-6
    ApplicationFSM.validate_transition(JobStatus.DISCOVERED.value, JobStatus.REVIEWING.value)
    ApplicationFSM.validate_transition(JobStatus.REVIEWING.value, JobStatus.READY.value)
    ApplicationFSM.validate_transition(JobStatus.READY.value, JobStatus.SUBMITTED.value)
    ApplicationFSM.validate_transition(JobStatus.SUBMITTED.value, JobStatus.INTERVIEW.value)
    ApplicationFSM.validate_transition(JobStatus.INTERVIEW.value, JobStatus.OFFER.value)

    # Réversibilité en cas d'hésitation humaine
    ApplicationFSM.validate_transition(JobStatus.REVIEWING.value, JobStatus.DISCOVERED.value)
    ApplicationFSM.validate_transition(JobStatus.READY.value, JobStatus.REVIEWING.value)


def test_fsm_invalid_wild_jump_blocked():
    # Saut sauvage interdit : DISCOVERED -> SUBMITTED sans examen humain
    with pytest.raises(ValueError, match="AD-6"):
        ApplicationFSM.validate_transition(JobStatus.DISCOVERED.value, JobStatus.SUBMITTED.value)

    # Saut direct à READY sans passer par REVIEWING
    with pytest.raises(ValueError, match="invalide"):
        ApplicationFSM.validate_transition(JobStatus.DISCOVERED.value, JobStatus.READY.value)

    # Retour en arrière impossible depuis SUBMITTED vers DISCOVERED
    with pytest.raises(ValueError, match="invalide"):
        ApplicationFSM.validate_transition(JobStatus.SUBMITTED.value, JobStatus.DISCOVERED.value)


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

    # 1. Tentative de transition illégale directe vers SUBMITTED -> Erreur 422 RFC 7807
    bad_res = client.patch(
        "/api/jobs/job-fsm-test/transition",
        json={"new_status": "SUBMITTED"},
    )
    assert bad_res.status_code == 422
    err_data = bad_res.json()
    assert "INVALID_STATE_TRANSITION" in str(err_data)

    # 2. Transition légale : DISCOVERED -> REVIEWING
    res1 = client.patch(
        "/api/jobs/job-fsm-test/transition",
        json={"new_status": "REVIEWING"},
    )
    assert res1.status_code == 200
    assert res1.json()["status"] == "REVIEWING"

    # 3. Transition légale : REVIEWING -> READY
    res2 = client.patch(
        "/api/jobs/job-fsm-test/transition",
        json={"new_status": "READY"},
    )
    assert res2.status_code == 200
    assert res2.json()["status"] == "READY"

    # 4. Transition légale : READY -> SUBMITTED
    res3 = client.patch(
        "/api/jobs/job-fsm-test/transition",
        json={"new_status": "SUBMITTED"},
    )
    assert res3.status_code == 200
    assert res3.json()["status"] == "SUBMITTED"
