from sqlmodel import Session
from app.domain.ats import ATSMatchingEngine
from app.domain.models import Education, Experience, JobOffer, MasterProfile, Skill
from tests.conftest import client, engine


def test_ats_matching_exact_and_transferable_and_missing():
    profile = MasterProfile(
        id="test-ats-profile",
        full_name="Yassine Ben Salem",
        email="yassine@insat.tn",
        is_complete=True,
    )
    profile.skills = [
        Skill(name="Python", category="Languages"),
        Skill(name="Next.js", category="Frameworks"),
        Skill(name="FastAPI", category="Frameworks"),
    ]
    profile.experiences = [
        Experience(
            company="Tech Corp",
            role="Backend Dev",
            description="Développement de microservices avec Docker et bases SQLite.",
            technologies_raw="Docker,SQLite",
        )
    ]

    job = JobOffer(
        id="test-job-ats",
        platform="linkedin",
        external_id="ext-ats-1",
        title="Stage PFE Ingénieur Backend Python & React",
        company="Capgemini",
        description_raw=(
            "Nous recherchons un stagiaire PFE pour concevoir des APIs en Python et FastAPI. "
            "Compétences requises : Python, FastAPI, React, Docker, Kubernetes, Rust."
        ),
    )

    result = ATSMatchingEngine.evaluate_alignment(job, profile)

    # Vérifications des catégories
    matched = [s.lower() for s in result.matched_skills]
    transferable = [s.lower() for s in result.transferable_skills]
    missing = [s.lower() for s in result.missing_skills]

    # Python, FastAPI, Docker sont déclarés dans le profil -> MATCHED
    assert "python" in matched
    assert "fastapi" in matched
    assert "docker" in matched

    # React n'est pas déclaré mais Next.js est présent -> TRANSFERABLE (0.6x)
    assert "react" in transferable

    # Kubernetes et Rust sont requis mais complètement absents -> MISSING (Zéro hallucination)
    assert "kubernetes" in missing
    assert "rust" in missing

    # Score mathématique : 3 correspondances (3.0) + 1 transférable (0.6) sur 6 compétences requises = 3.6 / 6 = 60%
    assert 55 <= result.score <= 65
    assert result.total_required == 6


def test_ats_zero_hallucination_guarantee():
    # Profil minimal sans aucune compétence
    empty_profile = MasterProfile(
        id="empty-profile",
        full_name="Profil Vide",
        email="vide@test.com",
        is_complete=False,
    )
    job = JobOffer(
        id="test-job-demanding",
        platform="jobteaser",
        external_id="ext-demand",
        title="Ingénieur C++ et Go",
        company="Thales",
        description_raw="Exigences strictes : C++, Go, Linux, Docker.",
    )

    result = ATSMatchingEngine.evaluate_alignment(job, empty_profile)

    # Aucune compétence ne doit être inventée
    assert len(result.matched_skills) == 0
    assert len(result.transferable_skills) == 0
    assert len(result.missing_skills) >= 4
    assert result.score <= 10


def test_api_get_job_ats_match_and_batch():
    with Session(engine) as session:
        # Création d'une offre en base
        job = JobOffer(
            id="job-api-ats",
            platform="linkedin",
            external_id="ext-api-ats",
            title="Stage Ingénieur Logiciel Python",
            company="Dassault",
            description_raw="Stage PFE : Python, Docker, API REST.",
            status="DISCOVERED",
        )
        session.add(job)

        # Ajout de compétences au profil par défaut
        profile = session.get(MasterProfile, "default-profile")
        if profile:
            profile.skills.append(Skill(profile_id=profile.id, name="Python"))
            profile.skills.append(Skill(profile_id=profile.id, name="Docker"))
            session.add(profile)
        session.commit()

    # Test endpoint GET /api/ats/match/{job_id}
    res = client.get("/api/ats/match/job-api-ats")
    assert res.status_code == 200
    data = res.json()
    assert data["job_id"] == "job-api-ats"
    assert data["score"] > 50
    assert any("python" in s.lower() for s in data["matched_skills"])

    # Test endpoint GET /api/ats/batch
    batch_res = client.get("/api/ats/batch")
    assert batch_res.status_code == 200
    batch_data = batch_res.json()
    assert "job-api-ats" in batch_data
    assert batch_data["job-api-ats"]["score"] == data["score"]
