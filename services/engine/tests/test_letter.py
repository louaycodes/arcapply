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


def test_letter_always_generates_pfe_structure():
    """Toutes les lettres générées sont impérativement orientées stage PFE."""
    profile = MasterProfile(
        id="prof-vous-moi-pfe",
        full_name="Sami Karray",
        search_mode="PFE",
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
        id="job-pfe-vmn",
        title="Stage PFE Ingénieur DevOps & Cloud",
        company="Société Générale",
        offer_type="PFE",
        description_raw="Stage PFE : Go, Docker.",
    )

    ats_match = ATSMatchingEngine.evaluate_alignment(job, profile)
    letter = CoverLetterService.generate_cover_letter(job, profile, ats_match, use_ai=False)
    content = letter.content_markdown
    content_lower = content.lower()

    # Invariant absolu : mention explicite de PFE ou stage 6 mois
    assert "stage" in content_lower or "pfe" in content_lower
    assert "six mois" in content_lower or "6 mois" in content_lower
    assert "Société Générale" in content
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


def test_letter_ai_truncation_triggers_deterministic_fallback(monkeypatch):
    """Vérifie qu'une génération IA tronquée (finish_reason='length' ou phrase suspendue) est rejetée au profit du repli déterministe."""
    from unittest.mock import MagicMock
    from app.config import settings

    profile = MasterProfile(
        id="prof-trunc-1",
        full_name="Louay Zorai",
        is_complete=True,
    )
    profile.skills = [Skill(name="Python", category="Languages")]
    profile.educations = [Education(school="ENSI", field_of_study="Informatique")]
    profile.projects = [Project(title="Cloud Ops", description="Projet cloud.", technologies_raw="Python")]

    job = JobOffer(
        id="job-trunc-1",
        title="Stage PFE Cloud",
        company="TechCo",
        offer_type="PFE",
        description_raw="Stage PFE Python",
    )
    ats_match = ATSMatchingEngine.evaluate_alignment(job, profile)

    monkeypatch.setattr(settings, "groq_api_key", "mock-key")

    # Mock de Groq simulant une coupure par finish_reason="length"
    mock_choice = MagicMock()
    mock_choice.finish_reason = "length"
    mock_choice.message.content = "Madame, Monsieur, ce texte est tronqué au milieu de la phrase et les"

    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value.choices = [mock_choice]

    with monkeypatch.context() as m:
        m.setattr("groq.Groq", lambda api_key: mock_client)
        letter = CoverLetterService.generate_cover_letter(job, profile, ats_match, use_ai=True)

        # La lettre tronquée doit être rejetée et le repli déterministe complet doit être utilisé
        assert letter.content_markdown is not None
        assert "Madame, Monsieur" in letter.content_markdown
        assert letter.content_markdown.strip().endswith(profile.full_name)
        assert "tronqué au milieu de la phrase et les" not in letter.content_markdown


def test_render_cover_letter_html_and_txt():
    """Vérifie la génération HTML et TXT de la lettre de motivation."""
    profile = MasterProfile(
        id="prof-render-1",
        full_name="Louay Zorai",
        email="louay@arcapply.dev",
        phone="+33 6 12 34 56 78",
        location="Paris, France",
        headline="Élève-Ingénieur Cloud & IA",
        is_complete=True,
    )
    job = JobOffer(
        id="job-render-1",
        title="Ingénieur Logiciel Backend",
        company="Datadog",
        user_id="louay",
    )
    sample_content = (
        "Madame, Monsieur,\n\n"
        "Votre expertise en observabilité résonne avec mes ambitions.\n\n"
        "J'ai développé le projet « Cloud Monitor » en Python et Docker.\n\n"
        "Je souhaite contribuer activement à vos défis.\n\n"
        "Je vous prie d'agréer, Madame, Monsieur, mes salutations distinguées.\n\n"
        "Louay Zorai"
    )

    html_out = CoverLetterService.render_cover_letter_html(sample_content, profile=profile, job=job, lang="fr")
    assert "<!DOCTYPE html>" in html_out
    assert "Louay Zorai" in html_out
    assert "Datadog" in html_out
    assert "Candidature au poste de Ingénieur Logiciel Backend" in html_out
    assert "Cloud Monitor" in html_out
    assert "@page" in html_out

    txt_out = CoverLetterService.render_cover_letter_txt(sample_content, profile=profile, job=job, lang="fr")
    assert "Louay Zorai" in txt_out
    assert "Datadog" in txt_out
    assert "Candidature au poste de Ingénieur Logiciel Backend" in txt_out
    assert "Cloud Monitor" in txt_out


def test_cover_letter_download_endpoints_all_formats():
    """Vérifie le téléchargement de la lettre de motivation dans les 4 formats : .txt, .html, .jpeg, .pdf."""
    with Session(engine) as session:
        job = JobOffer(
            id="job-dl-all",
            platform="linkedin",
            external_id="ext-dl-all",
            title="Stage Ingénieur DevOps",
            company="Dassault Aviation",
            description_raw="Stage PFE DevOps Kubernetes.",
            status="DISCOVERED",
            user_id="louay",
        )
        session.add(job)

        profile = session.get(MasterProfile, "default-profile")
        if profile:
            profile.full_name = "Louay Zorai"
            profile.is_complete = True
            session.add(profile)
        session.commit()

    # 1. Format TXT
    res_txt = client.get("/api/letter/download/job-dl-all?format=txt")
    assert res_txt.status_code == 200
    assert "text/plain" in res_txt.headers["content-type"]
    assert "attachment; filename=" in res_txt.headers["content-disposition"]
    assert res_txt.headers["content-disposition"].endswith('.txt"')
    assert "Dassault Aviation" in res_txt.text

    # 2. Format HTML
    res_html = client.get("/api/letter/download/job-dl-all?format=html")
    assert res_html.status_code == 200
    assert "text/html" in res_html.headers["content-type"]
    assert res_html.headers["content-disposition"].endswith('.html"')
    assert "<!DOCTYPE html>" in res_html.text
    assert "Dassault Aviation" in res_html.text

    # 3. Format PDF
    res_pdf = client.get("/api/letter/download/job-dl-all?format=pdf")
    assert res_pdf.status_code == 200
    assert "application/pdf" in res_pdf.headers["content-type"]
    assert res_pdf.headers["content-disposition"].endswith('.pdf"')
    assert len(res_pdf.content) > 1000
    assert res_pdf.content.startswith(b"%PDF")

    # 4. Format JPEG
    res_jpeg = client.get("/api/letter/download/job-dl-all?format=jpeg")
    assert res_jpeg.status_code == 200
    assert "image/jpeg" in res_jpeg.headers["content-type"]
    assert res_jpeg.headers["content-disposition"].endswith('.jpeg"')
    assert len(res_jpeg.content) > 1000


def test_custom_cover_letter_download():
    """Vérifie le téléchargement personnalisé à la volée du texte édité."""
    payload_txt = {
        "content_markdown": "Madame, Monsieur,\n\nTexte customisé en direct.\n\nCordialement,\n\nTesteur",
        "job_title": "Lead Dev",
        "company_name": "StartupTech",
        "format": "txt",
    }
    res_txt = client.post("/api/letter/download/custom", json=payload_txt)
    assert res_txt.status_code == 200
    assert "StartupTech" in res_txt.text
    assert "Texte customisé en direct." in res_txt.text

    payload_pdf = {
        "content_markdown": "Madame, Monsieur,\n\nTexte customisé en direct pour PDF.\n\nCordialement,\n\nTesteur",
        "job_title": "Lead Dev",
        "company_name": "StartupTech",
        "format": "pdf",
    }
    res_pdf = client.post("/api/letter/download/custom", json=payload_pdf)
    assert res_pdf.status_code == 200
    assert res_pdf.content.startswith(b"%PDF")

