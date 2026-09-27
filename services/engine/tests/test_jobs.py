from datetime import datetime, timedelta, timezone
from sqlmodel import Session
from app.adapters.connectors import infer_offer_type
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

    # Vérification que les offres sont bien récupérées par GET /api/jobs (PFE et/ou JOB)
    pfe_res = client.get("/api/jobs?offer_type=PFE")
    job_res = client.get("/api/jobs?offer_type=JOB")
    assert pfe_res.status_code == 200
    assert job_res.status_code == 200
    total_offers = len(pfe_res.json()) + len(job_res.json())
    assert total_offers == data["new_count"]
    all_jobs = pfe_res.json() + job_res.json()
    assert any(j["platform"] == "linkedin" for j in all_jobs)
    assert any(j["platform"] == "jobteaser" for j in all_jobs)


def test_collect_jobs_deduplication():
    from unittest.mock import patch, AsyncMock
    mock_raw_jobs = [
        {
            "external_id": "li-dedup-1",
            "platform": "linkedin",
            "title": "Stage PFE Cloud Engineer",
            "company": "Thales",
            "location": "Paris, France",
            "country": "France",
            "description_raw": "Stage de fin d'études Cloud et DevOps.",
            "url": "https://www.linkedin.com/jobs/view/li-dedup-1",
        },
        {
            "external_id": "li-dedup-2",
            "platform": "linkedin",
            "title": "Stage PFE DevOps Kubernetes",
            "company": "Airbus",
            "location": "Toulouse, France",
            "country": "France",
            "description_raw": "Stage DevOps sur infrastructure Kubernetes.",
            "url": "https://www.linkedin.com/jobs/view/li-dedup-2",
        },
    ]

    payload = {
        "keywords": ["PFE"],
        "locations": ["France"],
        "platforms": ["linkedin"],
        "limit_per_platform": 2,
    }

    with patch("app.adapters.connectors.linkedin.LinkedInJobConnector.search_jobs", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = mock_raw_jobs

        # Première passe
        res1 = client.post("/api/jobs/collect", json=payload)
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["new_count"] == 2
        assert data1["duplicate_count"] == 0

        # Deuxième passe avec les mêmes critères : doit détecter les doublons et ne rien ajouter
        res2 = client.post("/api/jobs/collect", json=payload)
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["new_count"] == 0
        assert data2["duplicate_count"] == 2

        # Le total en base ne doit pas avoir augmenté
        list_res = client.get("/api/jobs?platform=linkedin")
        assert len(list_res.json()) == 2


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


def test_infer_offer_type_heuristics():
    # Cas PFE
    assert infer_offer_type("Stage PFE Ingénieur Data", "") == "PFE"
    assert infer_offer_type("Stage fin d'études Cybersécurité", "Projet de fin d'études de 6 mois") == "PFE"
    assert infer_offer_type("Alternance Développeur Python", "") == "PFE"
    assert infer_offer_type("Ingénieur R&D Intern", "Summer internship") == "PFE"

    # Cas JOB
    assert infer_offer_type("CDI Développeur Fullstack", "") == "JOB"
    assert infer_offer_type("Ingénieur DevOps Senior (CDI)", "Poste à pourvoir en CDI") == "JOB"
    assert infer_offer_type("Poste Développeur Backend", "Emploi CDI") == "JOB"
    assert infer_offer_type("Senior Software Engineer", "Full-time position") == "JOB"

    # Ambiguïté ou égalité -> priorité PFE (repli étudiant)
    assert infer_offer_type("Ingénieur Logiciel", "Stage PFE avec possibilité de CDI à l'issue") == "PFE"
    assert infer_offer_type("Stage / Emploi", "") == "PFE"


def test_jobs_filter_by_profile_search_mode():
    with Session(engine) as session:
        pfe_job = JobOffer(
            platform="linkedin",
            external_id="filter-pfe-mode-1",
            title="Stage PFE Cloud Scalability",
            company="CloudCorp",
            offer_type="PFE",
            status="DISCOVERED",
        )
        job_job = JobOffer(
            platform="linkedin",
            external_id="filter-job-mode-1",
            title="Ingénieur CDI DevOps",
            company="JobCorp",
            offer_type="JOB",
            status="DISCOVERED",
        )
        session.add(pfe_job)
        session.add(job_job)
        session.commit()
        session.refresh(pfe_job)
        session.refresh(job_job)

    # 1. Par défaut (search_mode="PFE") -> seules les offres PFE sont retournées
    res_default = client.get("/api/jobs")
    assert res_default.status_code == 200
    offers = res_default.json()
    assert any(o["id"] == pfe_job.id for o in offers)
    assert not any(o["id"] == job_job.id for o in offers)
    assert all(o["offer_type"] == "PFE" for o in offers)

    # 2. Bascule du profil vers "JOB" -> seules les offres JOB sont retournées
    put_res = client.put("/api/profile", json={"search_mode": "JOB"})
    assert put_res.status_code == 200
    assert put_res.json()["search_mode"] == "JOB"

    res_job_mode = client.get("/api/jobs")
    assert res_job_mode.status_code == 200
    job_offers = res_job_mode.json()
    assert any(o["id"] == job_job.id for o in job_offers)
    assert not any(o["id"] == pfe_job.id for o in job_offers)
    assert all(o["offer_type"] == "JOB" for o in job_offers)

    # 3. Bascule retour vers "PFE"
    client.put("/api/profile", json={"search_mode": "PFE"})
    res_pfe_mode = client.get("/api/jobs")
    assert res_pfe_mode.status_code == 200
    assert any(o["id"] == pfe_job.id for o in res_pfe_mode.json())


def test_jobs_filter_explicit_override_param():
    with Session(engine) as session:
        pfe_job = JobOffer(
            platform="jobteaser",
            external_id="override-pfe-param-1",
            title="Stage PFE IA",
            company="AICorp",
            offer_type="PFE",
            status="DISCOVERED",
        )
        job_job = JobOffer(
            platform="jobteaser",
            external_id="override-job-param-1",
            title="Lead Tech CDI",
            company="TechCorp",
            offer_type="JOB",
            status="DISCOVERED",
        )
        session.add(pfe_job)
        session.add(job_job)
        session.commit()
        session.refresh(pfe_job)
        session.refresh(job_job)

    # Profil en PFE, mais requête surcharge avec offer_type=JOB
    client.put("/api/profile", json={"search_mode": "PFE"})
    res_override = client.get("/api/jobs?offer_type=JOB")
    assert res_override.status_code == 200
    offers = res_override.json()
    assert any(o["id"] == job_job.id for o in offers)
    assert not any(o["id"] == pfe_job.id for o in offers)
    assert all(o["offer_type"] == "JOB" for o in offers)

    # Surcharge avec offer_type=PFE
    res_pfe = client.get("/api/jobs?offer_type=PFE")
    assert res_pfe.status_code == 200
    assert any(o["id"] == pfe_job.id for o in res_pfe.json())


def test_jobs_filter_invalid_offer_type_returns_422():
    res = client.get("/api/jobs?offer_type=INVALID_TYPE")
    assert res.status_code == 422
    data = res.json()
    assert data["detail"]["error_code"] == "INVALID_OFFER_TYPE"


def test_profile_update_search_mode_validation():
    # Mode valide PFE
    res1 = client.put("/api/profile", json={"search_mode": "PFE"})
    assert res1.status_code == 200
    assert res1.json()["search_mode"] == "PFE"

    # Mode valide JOB
    res2 = client.put("/api/profile", json={"search_mode": "JOB"})
    assert res2.status_code == 200
    assert res2.json()["search_mode"] == "JOB"

    # Mode valide en minuscule -> normalisé en majuscule
    res3 = client.put("/api/profile", json={"search_mode": "pfe"})
    assert res3.status_code == 200
    assert res3.json()["search_mode"] == "PFE"

    # Mode invalide -> HTTP 422
    res_err = client.put("/api/profile", json={"search_mode": "STAGE"})
    assert res_err.status_code == 422
    data = res_err.json()
    assert data["detail"]["error_code"] == "INVALID_SEARCH_MODE"


def test_jobs_filter_period_and_direct_career():
    now = datetime.now(timezone.utc)
    with Session(engine) as session:
        # Offre d'aujourd'hui direct career
        j_today = JobOffer(
            platform="top100_enterprises",
            external_id="test-today-direct",
            title="Stage PFE Cloud AWS Direct",
            company="Amazon Tech",
            location="Paris",
            country="France",
            description_raw="Stage PFE Cloud",
            status="DISCOVERED",
            offer_type="PFE",
            is_direct_career_site=True,
            published_at=now - timedelta(hours=2),
            collected_at=now - timedelta(hours=2),
        )
        # Offre vieille de 15 jours
        j_old = JobOffer(
            platform="linkedin",
            external_id="test-old-job",
            title="Stage PFE Ancien",
            company="Old Corp",
            location="Tunis",
            country="Tunisie",
            description_raw="Stage PFE",
            status="DISCOVERED",
            offer_type="PFE",
            is_direct_career_site=False,
            published_at=now - timedelta(days=15),
            collected_at=now - timedelta(days=15),
        )
        session.add(j_today)
        session.add(j_old)
        session.commit()
        session.refresh(j_today)
        session.refresh(j_old)
        id_today = j_today.id
        id_old = j_old.id

    # Test filtre today
    res_today = client.get("/api/jobs?period=today")
    assert res_today.status_code == 200
    ids_today = [j["id"] for j in res_today.json()]
    assert id_today in ids_today
    assert id_old not in ids_today

    # Test filtre direct_only
    res_direct = client.get("/api/jobs?direct_only=true")
    assert res_direct.status_code == 200
    ids_direct = [j["id"] for j in res_direct.json()]
    assert id_today in ids_direct
    assert id_old not in ids_direct

    # Cleanup
    with Session(engine) as session:
        j1 = session.get(JobOffer, id_today)
        j2 = session.get(JobOffer, id_old)
        if j1:
            session.delete(j1)
        if j2:
            session.delete(j2)
        session.commit()


