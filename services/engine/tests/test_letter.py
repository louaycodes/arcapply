import pytest
from sqlmodel import Session

from app.domain.ats import ATSMatchingEngine
from app.domain.letter import CoverLetterService
from app.domain.models import Education, Experience, JobOffer, MasterProfile, Project, Skill
from tests.conftest import client, engine


def test_audit_and_sanitize_cliches():
    cliche_text = (
        "Madame, Monsieur, je suis un candidat idéal, dynamique et motivé. "
        "Intégrer votre prestigieuse entreprise est une opportunité rêvée."
    )

    count, detected = CoverLetterService.audit_cliches(cliche_text)
    assert count >= 3
    assert any("dynamique et motiv" in d.lower() for d in detected)
    assert any("candidat id" in d.lower() for d in detected)

    sanitized = CoverLetterService.sanitize_cliches(cliche_text)
    assert "dynamique et motivé" not in sanitized.lower()
    assert "candidat idéal" not in sanitized.lower()
    assert "prestigieuse entreprise" not in sanitized.lower()

    # Re-audit : zéro cliché
    clean_count, clean_detected = CoverLetterService.audit_cliches(sanitized)
    assert clean_count == 0
    assert len(clean_detected) == 0


def test_letter_generation_zero_hallucination_and_facts():
    profile = MasterProfile(
        id="prof-letter-1",
        full_name="Nour Trabelsi",
        email="nour@insat.tn",
        headline="Élève-Ingénieur Systèmes Distribués",
        is_complete=True,
    )
    profile.skills = [
        Skill(name="Python", category="Languages"),
        Skill(name="FastAPI", category="Frameworks"),
        Skill(name="Docker", category="Tools"),
    ]
    profile.educations = [
        Education(
            school="INSAT",
            degree="Diplôme National d'Ingénieur",
            field_of_study="Génie Logiciel",
            start_date="2021",
        )
    ]
    profile.projects = [
        Project(
            title="Distributed Queue Worker",
            role="Lead Backend",
            description="Moteur de tâches asynchrones haute résilience.",
            technologies_raw="Python,FastAPI,Docker",
        )
    ]

    job = JobOffer(
        id="job-letter-target",
        platform="linkedin",
        external_id="ext-let-1",
        title="Stage PFE Ingénieur Cloud & Backend",
        company="Datadog",
        description_raw="Compétences : Python, FastAPI, Docker, Rust, Kubernetes.",
    )

    ats_match = ATSMatchingEngine.evaluate_alignment(job, profile)
    letter = CoverLetterService.generate_cover_letter(job, profile, ats_match)

    content_lower = letter.content_markdown.lower()

    # 1. Zéro Hallucination : Les technologies manquantes (Rust, Kubernetes) ne sont JAMAIS citées
    assert "rust" not in content_lower
    assert "kubernetes" not in content_lower

    # 2. Faits attestés bien présents
    assert "insat" in content_lower
    assert "distributed queue worker" in content_lower
    assert "python" in content_lower
    assert "datadog" in content_lower

    # 3. Zéro cliché d'IA
    assert letter.cliche_score == 0
    assert len(letter.banned_phrases_detected) == 0


def test_letter_generation_blocked_when_profile_incomplete():
    incomplete = MasterProfile(
        id="inc-let-prof",
        full_name="Profil Incomplet",
        email="inc@test.com",
        is_complete=False,
    )
    job = JobOffer(
        id="job-inc-let",
        platform="jobteaser",
        external_id="ext-inc-let",
        title="Stage PFE",
        company="Société",
    )
    ats_match = ATSMatchingEngine.evaluate_alignment(job, incomplete)

    with pytest.raises(ValueError, match="CAP-1"):
        CoverLetterService.generate_cover_letter(job, incomplete, ats_match)


def test_letter_api_endpoints():
    with Session(engine) as session:
        job = JobOffer(
            id="job-api-let",
            platform="linkedin",
            external_id="ext-api-let",
            title="Stage Ingénieur Backend Python",
            company="Airbus",
            description_raw="Stage PFE Python et Docker.",
            status="DISCOVERED",
        )
        session.add(job)

        profile = session.get(MasterProfile, "default-profile")
        if profile:
            profile.is_complete = True
            profile.skills.append(Skill(profile_id=profile.id, name="Python"))
            profile.skills.append(Skill(profile_id=profile.id, name="Docker"))
            session.add(profile)
        session.commit()

    # 1. POST /api/letter/generate/{job_id}
    res_gen = client.post("/api/letter/generate/job-api-let")
    assert res_gen.status_code == 200
    data = res_gen.json()
    assert data["job_id"] == "job-api-let"
    assert "Airbus" in data["content_markdown"]
    assert data["cliche_score"] == 0

    # 2. GET /api/letter/{job_id}
    res_get = client.get("/api/letter/job-api-let")
    assert res_get.status_code == 200
    assert res_get.json()["content_markdown"] == data["content_markdown"]

    # 3. PUT /api/letter/{job_id} (Édition manuelle avec ajout volontaire d'un cliché pour tester l'audit)
    updated_text = data["content_markdown"] + "\n\nJe suis très dynamique et motivé !"
    res_put = client.put(
        "/api/letter/job-api-let",
        json={"content_markdown": updated_text},
    )
    assert res_put.status_code == 200
    put_data = res_put.json()
    assert put_data["cliche_score"] >= 1
    assert any("dynamique et motiv" in p.lower() for p in put_data["banned_phrases_detected"])
