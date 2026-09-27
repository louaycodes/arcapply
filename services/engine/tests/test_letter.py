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


def test_letter_selects_all_relevant_projects_by_score():
    """
    Valide que le moteur de scoring multi-critères :
    1. Cite le projet le plus pertinent en premier (Python+FastAPI sur offre Backend)
    2. Cite aussi le second projet pertinent (Docker)
    3. N'invoque PAS le projet sans lien (projet ML/R sans aucun tech en commun)
    4. Cite l'expérience pertinente (FastAPI)
    """
    profile = MasterProfile(
        id="prof-multi-1",
        full_name="Adam Ben Salah",
        email="adam@enit.tn",
        headline="Élève-Ingénieur Backend & Cloud",
        is_complete=True,
    )
    profile.skills = [
        Skill(name="Python", category="Languages"),
        Skill(name="FastAPI", category="Frameworks"),
        Skill(name="Docker", category="Tools"),
    ]
    profile.educations = [
        Education(
            school="ENIT",
            degree="Diplôme National d'Ingénieur",
            field_of_study="Génie Logiciel",
            start_date="2022",
        )
    ]
    # Trois projets : deux pertinents, un sans lien
    profile.projects = [
        Project(
            title="API Gateway Microservices",
            role="Backend Lead",
            description="Passerelle API haute disponibilité pour microservices distribués.",
            technologies_raw="Python,FastAPI,Docker",
        ),
        Project(
            title="CI/CD Pipeline Automatisé",
            role="DevOps",
            description="Pipeline de déploiement continu avec tests automatisés.",
            technologies_raw="Docker,Git",
        ),
        Project(
            title="Analyse Statistique en R",
            role="Data Analyst",
            description="Modélisation statistique de données épidémiologiques.",
            technologies_raw="R,ggplot2",
        ),
    ]
    profile.experiences = [
        Experience(
            company="StartupIO",
            role="Stagiaire Backend",
            description="Développement d'APIs REST avec FastAPI et PostgreSQL.",
            technologies_raw="FastAPI,Python,PostgreSQL",
            start_date="2024",
        )
    ]

    job = JobOffer(
        id="job-multi-test",
        platform="linkedin",
        external_id="ext-multi-1",
        title="Stage PFE Ingénieur Backend Python",
        company="Criteo",
        description_raw="Nous cherchons un ingénieur maîtrisant Python, FastAPI, Docker pour nos microservices.",
    )

    ats_match = ATSMatchingEngine.evaluate_alignment(job, profile)
    letter = CoverLetterService.generate_cover_letter(job, profile, ats_match, use_ai=False)
    content_lower = letter.content_markdown.lower()

    # 1. Le projet le plus pertinent (Python+FastAPI+Docker) est cité en premier
    assert "api gateway microservices" in content_lower, "Le projet principal pertinent doit être cité"

    # 2. Le second projet pertinent (Docker) est aussi cité
    assert "ci/cd pipeline" in content_lower, "Le second projet pertinent (Docker) doit être cité"

    # 3. Le projet sans lien (R, ggplot2) ne doit PAS être cité
    assert "analyse statistique en r" not in content_lower, "Les projets non-pertinents ne doivent pas être cités"
    assert "ggplot2" not in content_lower, "Les technologies non-matchées ne doivent pas apparaître"

    # 4. L'expérience pertinente (FastAPI) est mentionnée
    assert "startupIO".lower() in content_lower or "stagiaire backend" in content_lower, \
        "L'expérience pertinente doit être citée"

    # 5. Zéro cliché, zéro hallucination
    assert letter.cliche_score == 0
    assert "criteo" in content_lower
    assert "enit" in content_lower


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


def test_letter_vous_moi_nous_structure_pfe():
    """Vérifie la présence et le ton des 4 actes (Vous, Moi, Nous, Demain) en mode PFE."""
    profile = MasterProfile(
        id="prof-vous-moi-pfe",
        full_name="Sami Karray",
        is_complete=True,
    )
    profile.skills = [Skill(name="Python", category="Languages")]
    profile.educations = [
        Education(school="INSAT", field_of_study="Génie Logiciel")
    ]
    profile.projects = [
        Project(
            title="Cloud Monitor",
            role="Dev",
            description="Monitoring de métriques en temps réel.",
            technologies_raw="Python",
        )
    ]
    job = JobOffer(
        id="job-pfe-vmn",
        title="Stage PFE Développeur Backend",
        company="Thales",
        offer_type="PFE",
        description_raw="Stage PFE Python.",
    )

    ats_match = ATSMatchingEngine.evaluate_alignment(job, profile)
    letter = CoverLetterService.generate_cover_letter(job, profile, ats_match, use_ai=False)
    content = letter.content_markdown

    # VOUS : Entreprise + poste + mention de stage PFE
    assert "Thales" in content
    assert "Stage PFE Développeur Backend" in content
    assert "projet de fin d'études" in content.lower() or "stage" in content.lower()

    # MOI : Projet concret
    assert "Cloud Monitor" in content
    assert "Python" in content

    # NOUS : Contribution opérationnelle
    assert "En rejoignant vos équipes" in content or "En intégrant" in content

    # DEMAIN : Disponibilité PFE
    assert "six mois" in content.lower() or "semestre" in content.lower()
    assert "entretien" in content.lower()


def test_letter_vous_moi_nous_structure_job_no_pfe_mentions():
    """En mode JOB (CDI), aucune mention de PFE ou stage ne doit exister dans la lettre."""
    profile = MasterProfile(
        id="prof-vous-moi-job",
        full_name="Sami Karray",
        search_mode="JOB",
        is_complete=True,
    )
    profile.skills = [Skill(name="Go", category="Languages"), Skill(name="Docker", category="Tools")]
    profile.educations = [
        Education(school="ENIT", field_of_study="Télécoms & Réseaux")
    ]
    profile.projects = [
        Project(
            title="Go Reverse Proxy",
            role="Lead Dev",
            description="Proxy inverse haute performance.",
            technologies_raw="Go,Docker",
        )
    ]
    job = JobOffer(
        id="job-cdi-vmn",
        title="Ingénieur DevOps & Cloud (CDI)",
        company="Société Générale",
        offer_type="JOB",
        description_raw="Poste CDI : Go, Docker.",
    )

    ats_match = ATSMatchingEngine.evaluate_alignment(job, profile)
    letter = CoverLetterService.generate_cover_letter(job, profile, ats_match, use_ai=False)
    content = letter.content_markdown
    content_lower = content.lower()

    # Invariant absolu : aucune mention de stage / PFE
    assert "stage" not in content_lower, "Une candidature en mode JOB ne doit pas mentionner 'stage'"
    assert "pfe" not in content_lower, "Une candidature en mode JOB ne doit pas mentionner 'pfe'"
    assert "stagiaire" not in content_lower, "Une candidature en mode JOB ne doit pas mentionner 'stagiaire'"

    # VOUS & NOUS adaptés au contrat CDI et disponibilité immédiate
    assert "Société Générale" in content
    assert "Ingénieur DevOps & Cloud (CDI)" in content
    assert "disponible immédiatement" in content_lower
    assert "Go Reverse Proxy" in content
    assert letter.cliche_score == 0


def test_enriched_cliche_sanitization():
    """Valide l'éradication des nouveaux clichés d'ingénieur."""
    raw = (
        "Madame, Monsieur, je suis une force de proposition avec une soif d'apprendre. "
        "Véritable couteau suisse, je suis prêt à relever ce challenge."
    )
    count, detected = CoverLetterService.audit_cliches(raw)
    assert count >= 4

    sanitized = CoverLetterService.sanitize_cliches(raw)
    clean_count, clean_detected = CoverLetterService.audit_cliches(sanitized)
    assert clean_count == 0
    assert "force de proposition" not in sanitized.lower()
    assert "soif d'apprendre" not in sanitized.lower()
    assert "couteau suisse" not in sanitized.lower()
    assert "relever ce challenge" not in sanitized.lower()

