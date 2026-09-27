from sqlmodel import Session
from app.domain.models import JobOffer
from tests.conftest import engine, client



def test_collect_jobs_creates_offers():
    payload = {
        "keywords": ["PFE", "Ingénieur"],
        "locations": ["France", "Tunisie"],
        "platforms": ["linkedin", "jobteaser"],
        "limit_per_platform": 5,
    }
    response = client.post("/api/jobs/collect", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["collected_count"] > 0
    assert data["new_count"] > 0
    assert data["duplicate_count"] == 0
    assert "linkedin" in data["platforms"]
    assert "jobteaser" in data["platforms"]

    # Vérification que les offres sont bien récupérées par GET /api/jobs
    list_res = client.get("/api/jobs")
    assert list_res.status_code == 200
    jobs = list_res.json()
    assert len(jobs) == data["new_count"]
    assert any(j["platform"] == "linkedin" for j in jobs)
    assert any(j["platform"] == "jobteaser" for j in jobs)


def test_collect_jobs_deduplication():
    payload = {
        "keywords": ["PFE"],
        "locations": ["France"],
        "platforms": ["linkedin"],
        "limit_per_platform": 2,
    }
    # Première passe
    res1 = client.post("/api/jobs/collect", json=payload)
    assert res1.status_code == 200
    data1 = res1.json()
    initial_new = data1["new_count"]
    assert initial_new > 0

    # Deuxième passe avec les mêmes critères : doit détecter les doublons et ne rien ajouter
    res2 = client.post("/api/jobs/collect", json=payload)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["new_count"] == 0
    assert data2["duplicate_count"] == initial_new

    # Le total en base ne doit pas avoir augmenté
    list_res = client.get("/api/jobs?platform=linkedin")
    assert len(list_res.json()) == initial_new


def test_filter_jobs_by_country_and_search():
    # Insertion manuelle de 2 offres
    with Session(engine) as session:
        j1 = JobOffer(
            platform="linkedin",
            external_id="test-fr-1",
            title="Ingénieur Cloud PFE",
            company="Airbus",
            location="Toulouse",
            country="France",
            description_raw="Description stage",
            status="DISCOVERED",
        )
        j2 = JobOffer(
            platform="jobteaser",
            external_id="test-tn-1",
            title="Développeur IA PFE",
            company="Instadeep",
            location="Tunis",
            country="Tunisie",
            description_raw="Description stage",
            status="DISCOVERED",
        )
        session.add(j1)
        session.add(j2)
        session.commit()

    # Filtre France
    res_fr = client.get("/api/jobs?country=France")
    assert res_fr.status_code == 200
    jobs_fr = res_fr.json()
    assert len(jobs_fr) == 1
    assert jobs_fr[0]["company"] == "Airbus"

    # Filtre Tunisie
    res_tn = client.get("/api/jobs?country=Tunisie")
    assert res_tn.status_code == 200
    jobs_tn = res_tn.json()
    assert len(jobs_tn) == 1
    assert jobs_tn[0]["company"] == "Instadeep"

    # Recherche textuelle
    res_search = client.get("/api/jobs?search=airbus")
    assert res_search.status_code == 200
    assert len(res_search.json()) == 1


def test_archive_job_removes_from_radar_feed():
    with Session(engine) as session:
        job = JobOffer(
            platform="linkedin",
            external_id="test-to-archive",
            title="Stage PFE Support",
            company="Acme Corp",
            status="DISCOVERED",
        )
        session.add(job)
        session.commit()
        session.refresh(job)
        job_id = job.id

    # L'offre est visible dans le radar actif
    res_active = client.get("/api/jobs")
    assert any(j["id"] == job_id for j in res_active.json())

    # Archivage
    arch_res = client.patch(f"/api/jobs/{job_id}/archive")
    assert arch_res.status_code == 200
    assert arch_res.json()["status"] == "ARCHIVED"

    # L'offre a disparu du flux par défaut
    res_after = client.get("/api/jobs")
    assert not any(j["id"] == job_id for j in res_after.json())

    # Mais présente si include_archived=true
    res_all = client.get("/api/jobs?include_archived=true")
    assert any(j["id"] == job_id for j in res_all.json())


def test_pipeline_metrics_calculation():
    from datetime import datetime, timedelta, timezone

    now = datetime.now(timezone.utc)
    old_date = now - timedelta(days=10)

    with Session(engine) as session:
        # Nettoyage ou création spécifique
        j_sub1 = JobOffer(
            platform="linkedin",
            external_id="m-sub1",
            title="Ingénieur PFE 1",
            company="Company 1",
            status="SUBMITTED",
            updated_at=old_date,
        )
        j_int = JobOffer(
            platform="linkedin",
            external_id="m-int1",
            title="Ingénieur PFE 2",
            company="Company 2",
            status="INTERVIEW",
        )
        j_off = JobOffer(
            platform="jobteaser",
            external_id="m-off1",
            title="Ingénieur PFE 3",
            company="Company 3",
            status="OFFER",
        )
        j_rej = JobOffer(
            platform="jobteaser",
            external_id="m-rej1",
            title="Ingénieur PFE 4",
            company="Company 4",
            status="REJECTED",
        )
        session.add(j_sub1)
        session.add(j_int)
        session.add(j_off)
        session.add(j_rej)
        session.commit()

    res = client.get("/api/jobs/metrics")
    assert res.status_code == 200
    metrics = res.json()

    assert metrics["submitted_total"] >= 4
    assert metrics["by_status"]["SUBMITTED"] >= 1
    assert metrics["by_status"]["INTERVIEW"] >= 1
    assert metrics["by_status"]["OFFER"] >= 1
    assert metrics["by_status"]["REJECTED"] >= 1
    assert metrics["interview_rate_percent"] > 0
    assert metrics["stale_relance_count"] >= 1


def test_clear_all_jobs():
    # Insertion d'une offre
    with Session(engine) as session:
        j = JobOffer(
            platform="linkedin",
            external_id="clear-test-1",
            title="Ingénieur Test PFE",
            company="Test Corp",
            status="DISCOVERED",
        )
        session.add(j)
        session.commit()

    # Vérification présence
    res = client.get("/api/jobs")
    assert len(res.json()) > 0

    # Appel de suppression
    delete_res = client.delete("/api/jobs/clear")
    assert delete_res.status_code == 200
    assert delete_res.json()["status"] == "success"

    # Vérification que la liste est vide
    res_after = client.get("/api/jobs")
    assert res_after.status_code == 200
    assert len(res_after.json()) == 0

