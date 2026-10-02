import pytest
from unittest.mock import AsyncMock, patch
from sqlmodel import Session, select

from app.domain.anti_rescrape import (
    clean_text_for_match,
    is_job_already_applied,
    normalize_job_url,
    record_applied_signature,
    remove_applied_signature,
)
from app.domain.models import AppliedJobSignature, JobOffer, MasterProfile
from tests.conftest import client, engine


def test_mark_and_unmark_job_as_applied_endpoints():
    """Vérifie le marquage explicite et l'annulation d'une offre déjà postulée."""
    with Session(engine) as session:
        job = JobOffer(
            id="job-mark-applied-1",
            platform="linkedin",
            external_id="ext-mark-1",
            title="Stage PFE Ingénieur Logiciel",
            company="Thales",
            status="DISCOVERED",
            user_id="louay",
        )
        session.add(job)
        session.commit()

    # 1. Marquer comme déjà postulé
    res_mark = client.post("/api/jobs/job-mark-applied-1/mark-applied")
    assert res_mark.status_code == 200
    data_mark = res_mark.json()
    assert data_mark["is_applied"] is True
    assert data_mark["status"] == "SUBMITTED"
    assert data_mark["applied_at"] is not None

    with Session(engine) as session:
        sig = session.exec(
            select(AppliedJobSignature).where(
                AppliedJobSignature.user_id == "louay",
                AppliedJobSignature.job_id == "job-mark-applied-1",
            )
        ).first()
        assert sig is not None
        assert sig.company_clean == "thales"
        assert "ingenieur" in sig.title_clean

    # 2. Démarquer (unmark)
    res_unmark = client.post("/api/jobs/job-mark-applied-1/unmark-applied")
    assert res_unmark.status_code == 200
    data_unmark = res_unmark.json()
    assert data_unmark["is_applied"] is False
    assert data_unmark["status"] == "DISCOVERED"
    assert data_unmark["applied_at"] is None

    with Session(engine) as session:
        sig_after = session.exec(
            select(AppliedJobSignature).where(
                AppliedJobSignature.user_id == "louay",
                AppliedJobSignature.job_id == "job-mark-applied-1",
            )
        ).first()
        assert sig_after is None


def test_already_applied_offer_is_never_rescrapped():
    """Garantit qu'une offre marquée comme déjà postulée n'est plus jamais ré-insérée par les scrapers."""
    with Session(engine) as session:
        job = JobOffer(
            id="job-shield-airbus",
            platform="linkedin",
            external_id="ext-airbus-pfe",
            title="Stage PFE Cloud Backend",
            company="Airbus",
            url="https://www.linkedin.com/jobs/view/ext-airbus-pfe/?trackingId=123",
            apply_url="https://airbus.wd3.myworkdayjobs.com/career/job/123",
            status="SUBMITTED",
            is_applied=True,
            user_id="louay",
        )
        session.add(job)
        session.commit()
        record_applied_signature(session, job)

    with Session(engine) as session:
        # Cas 1 : Même plateforme et même external_id
        raw_same_ext = {
            "platform": "linkedin",
            "external_id": "ext-airbus-pfe",
            "company": "Airbus",
            "title": "Stage PFE Cloud Backend",
        }
        assert is_job_already_applied(session, "louay", raw_same_ext) is True

        # Cas 2 : Autre plateforme (ex: WTTJ ou Top 100), mais même entreprise et poste identique
        raw_other_plat = {
            "platform": "top100_enterprises",
            "external_id": "top100-airbus-999",
            "company": "Airbus",
            "title": "Stage PFE Cloud Backend",
        }
        assert is_job_already_applied(session, "louay", raw_other_plat) is True

        # Cas 3 : Même URL de candidature avec paramètres de tracking différents
        raw_same_url = {
            "platform": "indeed",
            "external_id": "indeed-xyz",
            "company": "Airbus Group",
            "title": "Ingénieur Cloud",
            "url": "https://airbus.wd3.myworkdayjobs.com/career/job/123?utm_source=indeed",
        }
        assert is_job_already_applied(session, "louay", raw_same_url) is True

        # Cas 4 : Une offre différente chez une autre entreprise doit être autorisée
        raw_different = {
            "platform": "linkedin",
            "external_id": "ext-thales-new",
            "company": "Dassault Aviation",
            "title": "Stage PFE DevOps",
        }
        assert is_job_already_applied(session, "louay", raw_different) is False


@pytest.mark.asyncio
async def test_collection_skips_already_applied_jobs():
    """Vérifie que la route /api/jobs/collect ignore les offres déjà postulées et les compte comme doublons."""
    with Session(engine) as session:
        job = JobOffer(
            id="job-coll-shield",
            platform="linkedin",
            external_id="li-applied-123",
            title="Stage PFE IA",
            company="Mistral AI",
            status="SUBMITTED",
            is_applied=True,
            user_id="louay",
        )
        session.add(job)
        session.commit()
        record_applied_signature(session, job)

    mock_raw_jobs = [
        {
            "platform": "linkedin",
            "external_id": "li-applied-123",
            "title": "Stage PFE IA",
            "company": "Mistral AI",
            "description_raw": "Stage PFE IA chez Mistral",
        }
    ]

    with patch("app.adapters.connectors.linkedin.LinkedInJobConnector.search_jobs", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = mock_raw_jobs

        res = client.post(
            "/api/jobs/collect",
            json={
                "keywords": ["PFE"],
                "locations": ["France"],
                "platforms": ["linkedin"],
                "limit_per_platform": 1,
            },
        )
        assert res.status_code == 200
        summary = res.json()
        assert summary["new_count"] == 0
        assert summary["duplicate_count"] >= 1
