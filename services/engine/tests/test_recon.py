import pytest
import uuid
from sqlmodel import Session, select

from app.domain.models import JobOffer, ReconDossier
from app.domain.recon import run_deep_recon_on_job
from tests.conftest import engine, client


@pytest.mark.asyncio
async def test_deep_recon_langgraph_execution():
    uid = uuid.uuid4().hex[:6]
    job_id = f"job-recon-{uid}"
    with Session(engine) as session:
        job = JobOffer(
            id=job_id,
            title="Stage Ingénieur DevOps / Cloud PFE",
            company="CloudScale Innovations",
            location="Paris, France",
            platform="linkedin",
            external_id=f"ext-recon-{uid}",
            url="https://example.com/jobs/cloud-engineer",
            description_raw="Recherche élève-ingénieur PFE pour déploiement Kubernetes, CI/CD GitHub Actions, Terraform et microservices FastAPI.",
            user_id="louay",
        )
        session.add(job)
        session.commit()

    # Exécution du graphe LangGraph
    dossier = await run_deep_recon_on_job(job_id, user_id="louay", engine=engine)
    assert dossier is not None
    assert dossier.job_id == job_id
    assert dossier.status == "COMPLETED"
    assert "Kubernetes" in dossier.tech_stack_detected
    assert "Terraform" in dossier.tech_stack_detected


def test_recon_api_endpoints():
    uid = uuid.uuid4().hex[:6]
    job_id = f"job-recon-{uid}"
    with Session(engine) as session:
        job = JobOffer(
            id=job_id,
            title="Stage Ingénieur DevOps / Cloud PFE",
            company="CloudScale Innovations",
            location="Paris, France",
            platform="linkedin",
            external_id=f"ext-recon-{uid}",
            url="https://example.com/jobs/cloud-engineer",
            description_raw="Recherche élève-ingénieur PFE pour déploiement Kubernetes, CI/CD GitHub Actions, Terraform et microservices FastAPI.",
            user_id="louay",
        )
        session.add(job)

        dossier = ReconDossier(
            job_id=job_id,
            user_id="louay",
            company_name="CloudScale Innovations",
            full_description=job.description_raw or "",
            tech_stack_detected_raw='["Kubernetes", "Terraform"]',
            status="COMPLETED",
        )
        session.add(dossier)
        session.commit()

    token = client.post("/api/auth/login", json={"username": "louay", "password": "louay"}).json()["token"]

    # Trigger recon
    res = client.post(
        f"/api/recon/trigger/{job_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200

    # Get dossier
    dossier_res = client.get(
        f"/api/recon/dossier/{job_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert dossier_res.status_code == 200
    data = dossier_res.json()
    assert data["job_id"] == job_id
    assert data["company_name"] == "CloudScale Innovations"
    assert "Kubernetes" in data["tech_stack_detected"]
