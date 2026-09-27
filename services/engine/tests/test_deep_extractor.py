import json
from datetime import datetime, timedelta, timezone
from app.domain.job_extractor import JobDeepExtractor
from app.domain.models import JobOffer
from app.adapters.database import init_db, get_engine
from sqlmodel import Session, select


def test_job_deep_extractor_skills():
    title = "Stage Ingénieur R&D - Développeur Fullstack (Python / React)"
    desc = """
    Nous recherchons un stagiaire de fin d'études passionné par le Cloud et l'IA.
    Stack technique :
    - Langages : Python, TypeScript
    - Frameworks : FastAPI, React, Next.js
    - DevOps & Cloud : Docker, Kubernetes, AWS, Terraform, CI/CD
    - Base de données : PostgreSQL, Redis
    """
    skills = JobDeepExtractor.extract_skills(title, desc)
    assert "Python" in skills
    assert "React" in skills
    assert "FastAPI" in skills
    assert "Docker" in skills
    assert "Kubernetes" in skills
    assert "AWS" in skills
    assert "PostgreSQL" in skills
    assert "Redis" in skills


def test_job_deep_extractor_contract_duration():
    pfe_title = "Stage PFE - Ingénieur Data Science (6 mois)"
    pfe_desc = "Ce stage de fin d'études d'une durée de 6 mois démarrera en février 2026."
    duration = JobDeepExtractor.extract_contract_duration(pfe_title, pfe_desc, "PFE")
    assert "6 mois" in duration

    job_title = "Ingénieur DevOps Confirmé (CDI)"
    job_desc = "Poste en CDI basé à Paris."
    job_duration = JobDeepExtractor.extract_contract_duration(job_title, job_desc, "JOB")
    assert "CDI" in job_duration


def test_job_deep_extractor_work_mode():
    desc_remote = "Ce poste est ouvert en 100% télétravail (Full remote)."
    assert JobDeepExtractor.extract_work_mode("France", desc_remote) == "Télétravail total"

    desc_hybrid = "Organisation du travail hybride : 2 jours de télétravail par semaine."
    assert JobDeepExtractor.extract_work_mode("Tunis", desc_hybrid) == "Hybride"

    desc_onsite = "Présentiel requis au siège de l'entreprise."
    assert JobDeepExtractor.extract_work_mode("Paris", desc_onsite) == "Sur site"


def test_job_deep_extractor_salary_stipend():
    desc_stipend = "Gratification de stage : 1 400 € / mois + tickets restaurant."
    assert "1 400 € / mois" in JobDeepExtractor.extract_salary_stipend(desc_stipend)

    desc_tn = "Indemnité de stage : 800 DT / mois."
    assert "800 DT / mois" in JobDeepExtractor.extract_salary_stipend(desc_tn)


def test_job_deep_extractor_department():
    title_ai = "Stage PFE - Modèles de Fondation et LLM"
    desc_ai = "Recherche en IA générative et RAG."
    assert JobDeepExtractor.extract_department(title_ai, desc_ai) == "Data, IA & Machine Learning"

    title_cyber = "Stagiaire Analyste SOC & Cybersécurité"
    desc_cyber = "Analyse des vulnérabilités et pentest applicatif."
    assert JobDeepExtractor.extract_department(title_cyber, desc_cyber) == "Cybersécurité"


def test_job_deep_extractor_relative_date_parsing():
    base_time = datetime(2026, 3, 27, 12, 0, 0, tzinfo=timezone.utc)

    # Hier
    dt_yesterday = JobDeepExtractor.parse_relative_published_at("hier", base_time)
    assert dt_yesterday is not None
    assert dt_yesterday.day == 26

    # Il y a 2 jours
    dt_2d = JobDeepExtractor.parse_relative_published_at("il y a 2 jours", base_time)
    assert dt_2d is not None
    assert dt_2d.day == 25

    # Il y a 3 heures
    dt_3h = JobDeepExtractor.parse_relative_published_at("il y a 3 heures", base_time)
    assert dt_3h is not None
    assert dt_3h.hour == 9

    # Format ISO
    dt_iso = JobDeepExtractor.parse_relative_published_at("2026-03-20")
    assert dt_iso is not None
    assert dt_iso.year == 2026
    assert dt_iso.month == 3
    assert dt_iso.day == 20


def test_job_deep_extractor_enrich_job_data():
    base_time = datetime(2026, 3, 27, 12, 0, 0, tzinfo=timezone.utc)
    raw = {
        "title": "Stage PFE Ingénieur Logiciel Python / Docker",
        "company": "Tech Innovate",
        "location": "Paris, France",
        "country": "France",
        "description_raw": "Rejoignez notre équipe pour un stage de 6 mois. Stack: Python, FastAPI, Docker. 1200 € / mois. Hybride.",
        "published_date_raw": "il y a 1 jour",
        "url": "https://example.com/job/1",
    }
    enriched = JobDeepExtractor.enrich_job_data(raw, base_time)
    skills = json.loads(enriched["skills_required"])
    assert "Python" in skills
    assert "FastAPI" in skills
    assert "Docker" in skills
    assert "6 mois" in enriched["contract_duration"]
    assert enriched["work_mode"] == "Hybride"
    assert "1200 € / mois" in enriched["salary_stipend"]
    assert enriched["published_at"] is not None
    assert enriched["published_at"].day == 26


def test_database_migrations_and_enriched_columns():
    init_db()
    engine = get_engine()
    with Session(engine) as session:
        test_job = JobOffer(
            platform="custom_direct",
            external_id="test-enriched-123",
            title="Stage Ingénieur Cloud & DevOps",
            company="Global IT Leader",
            location="Tunis",
            country="Tunisie",
            description_raw="Stage PFE DevOps Kubernetes Terraform",
            url="https://careers.example.com/job/123",
            skills_required=json.dumps(["Kubernetes", "Terraform", "Docker"]),
            contract_duration="6 mois (PFE)",
            work_mode="Hybride",
            salary_stipend="1200 DT / mois",
            department="Cloud, DevOps & Infra",
            is_direct_career_site=True,
            apply_url="https://careers.example.com/job/123/apply",
            published_at=datetime(2026, 3, 27, 10, 0, 0, tzinfo=timezone.utc),
        )
        session.add(test_job)
        session.commit()
        session.refresh(test_job)

        # Vérification relecture
        loaded = session.exec(select(JobOffer).where(JobOffer.id == test_job.id)).first()
        assert loaded is not None
        assert loaded.is_direct_career_site is True
        assert "Kubernetes" in loaded.skills_required
        assert loaded.department == "Cloud, DevOps & Infra"
        assert loaded.salary_stipend == "1200 DT / mois"

        # Cleanup
        session.delete(loaded)
        session.commit()
