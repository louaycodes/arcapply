import pytest
from sqlmodel import Session

from app.adapters.pdf import PDFCompilerService
from app.domain.ats import ATSMatchingEngine
from app.domain.cv import CVGeneratorService
from app.domain.models import Education, Experience, JobOffer, MasterProfile, Project, Skill
from tests.conftest import client, engine


def test_cv_generation_blocks_when_profile_incomplete():
    incomplete_profile = MasterProfile(
        id="inc-prof",
        full_name="Jean Incomplet",
        email="jean@test.com",
        is_complete=False,
    )
    job = JobOffer(
        id="job-inc",
        platform="linkedin",
        external_id="ext-inc",
        title="Stage PFE Python",
        company="Tech",
        description_raw="Python requis.",
    )
    ats_match = ATSMatchingEngine.evaluate_alignment(job, incomplete_profile)

    with pytest.raises(ValueError, match="CAP-1"):
        CVGeneratorService.generate_cv(job, incomplete_profile, ats_match)


def test_cv_generation_zero_hallucination_and_reordering():
    profile = MasterProfile(
        id="prof-cv-1",
        full_name="Amine Trabelsi",
        email="amine@insat.tn",
        headline="Élève-Ingénieur Systèmes & Cloud",
        is_complete=True,
    )
    profile.skills = [
        Skill(name="Python", category="Languages"),
        Skill(name="FastAPI", category="Frameworks"),
        Skill(name="Docker", category="Tools"),
    ]
    profile.experiences = [
        Experience(
            company="Legacy Corp",
            role="Support Technique",
            description="Assistance utilisateurs et maintenance de base.",
            technologies_raw="Excel",
            start_date="2023-01",
        ),
        Experience(
            company="Cloud Innovation",
            role="Développeur Backend",
            description="Conception de microservices FastAPI conteneurisés avec Docker.",
            technologies_raw="Python,FastAPI,Docker",
            start_date="2024-02",
        ),
    ]
    profile.projects = [
        Project(
            title="ArcApply Engine",
            role="Lead Dev",
            description="Moteur d'automatisation de candidatures en Python et SQLite.",
            technologies_raw="Python,SQLite",
        )
    ]
    profile.educations = [
        Education(
            school="INSAT",
            degree="Diplôme National d'Ingénieur",
            field_of_study="Génie Logiciel",
            start_date="2021",
            end_date="2026",
        )
    ]

    job = JobOffer(
        id="job-cv-target",
        platform="jobteaser",
        external_id="ext-cv-1",
        title="Stage PFE Ingénieur Backend FastAPI & Cloud",
        company="Orange Digital Center",
        description_raw="Exigences : Python, FastAPI, Docker, Rust, Kubernetes, GCP.",
    )

    ats_match = ATSMatchingEngine.evaluate_alignment(job, profile)
    cv = CVGeneratorService.generate_cv(job, profile, ats_match)

    # 1. Zéro Hallucination : Les technologies manquantes (Rust, Kubernetes, GCP) ne doivent JAMAIS apparaître
    html_lower = cv.html_content.lower()
    assert "rust" not in html_lower
    assert "kubernetes" not in html_lower
    assert "gcp" not in html_lower

    # 2. Compétences validées bien présentes
    assert "python" in html_lower
    assert "fastapi" in html_lower
    assert "docker" in html_lower

    # 3. Réordonnancement par pertinence : L'expérience chez Cloud Innovation (FastAPI/Docker)
    # doit être classée EN PREMIER devant Legacy Corp
    assert len(cv.experiences) == 2
    assert cv.experiences[0]["company"] == "Cloud Innovation"
    assert cv.experiences[1]["company"] == "Legacy Corp"


@pytest.mark.asyncio
async def test_pdf_compilation_via_playwright():
    sample_html = """<!DOCTYPE html>
    <html>
    <head><style>@page { size: A4; margin: 10mm; } body { font-family: sans-serif; }</style></head>
    <body>
        <h1>Amine Trabelsi</h1>
        <p>CV Vectoriel ATS 1 page généré via Playwright</p>
    </body>
    </html>
    """
    pdf_bytes = await PDFCompilerService.compile_html_to_pdf(sample_html)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 2000
    assert pdf_bytes.startswith(b"%PDF")


def test_cv_api_endpoints():
    with Session(engine) as session:
        # Création de l'offre
        job = JobOffer(
            id="job-api-cv",
            platform="linkedin",
            external_id="ext-api-cv",
            title="Stage Ingénieur Backend Python",
            company="Thales",
            description_raw="Stage PFE Python et Docker.",
            status="DISCOVERED",
        )
        session.add(job)

        # Rendre le default-profile complet
        profile = session.get(MasterProfile, "default-profile")
        if profile:
            profile.is_complete = True
            profile.skills.append(Skill(profile_id=profile.id, name="Python"))
            profile.skills.append(Skill(profile_id=profile.id, name="Docker"))
            session.add(profile)
        session.commit()

    # 1. POST /api/cv/generate/{job_id}
    res_gen = client.post("/api/cv/generate/job-api-cv")
    assert res_gen.status_code == 200
    data = res_gen.json()
    assert data["job_id"] == "job-api-cv"
    assert "html_content" in data
    assert any("python" in s.lower() for s in data["matched_skills"])

    # 2. GET /api/cv/preview/{job_id}
    res_prev = client.get("/api/cv/preview/job-api-cv")
    assert res_prev.status_code == 200
    assert "text/html" in res_prev.headers["content-type"]
    assert "Thales" in res_prev.text

    # 3. GET /api/cv/pdf/{job_id}
    res_pdf = client.get("/api/cv/pdf/job-api-cv")
    assert res_pdf.status_code == 200
    assert res_pdf.headers["content-type"] == "application/pdf"
    assert res_pdf.content.startswith(b"%PDF")
    assert "attachment" in res_pdf.headers.get("content-disposition", "")


def test_cv_contains_all_8_sections_and_portfolio_link():
    with Session(engine) as session:
        job = JobOffer(
            id="job-cv-sections",
            platform="linkedin",
            external_id="ext-cv-sections",
            title="Stage PFE Cloud & DevOps",
            company="Devoteam",
            description_raw="Kubernetes, Docker, Python, Ansible requis.",
            status="DISCOVERED",
        )
        session.add(job)

        profile = session.get(MasterProfile, "default-profile")
        if profile:
            profile.full_name = "Louay Zorai"
            profile.is_complete = True
            profile.website_url = "https://www.louaycodes.tn"
            profile.skills = [
                Skill(profile_id=profile.id, name="Kubernetes", category="Cloud & DevOps"),
                Skill(profile_id=profile.id, name="Docker", category="Cloud & DevOps"),
                Skill(profile_id=profile.id, name="Python", category="Programming"),
            ]
            session.add(profile)
        session.commit()

    # Génération en Français
    res_fr = client.post("/api/cv/generate/job-cv-sections?lang=fr")
    assert res_fr.status_code == 200
    html_fr = res_fr.json()["html_content"]

    # 1. Contact avec lien portfolio live www.louaycodes.tn
    assert "www.louaycodes.tn" in html_fr
    assert "https://www.louaycodes.tn" in html_fr
    assert "portfolio-link" in html_fr

    # 2. Sections en Français
    assert "FORMATION" in html_fr
    assert "EXPÉRIENCES PROFESSIONNELLES (STAGES)" in html_fr
    assert "PROJETS SÉLECTIONNÉS" in html_fr
    assert "COMPÉTENCES TECHNIQUES" in html_fr
    assert "ACTIVITÉS EXTRA-PROFESSIONNELLES" in html_fr
    assert "LANGUES" in html_fr

    # 3. Activités extra-professionnelles requises
    assert "Enactus EMC" in html_fr
    assert "Lycée Pilote Bizerte Youth Club" in html_fr

    # 4. Langues requises
    assert "Arabe" in html_fr
    assert "Français" in html_fr
    assert "Anglais" in html_fr

    # 5. Génération en Anglais
    res_en = client.post("/api/cv/generate/job-cv-sections?lang=en")
    assert res_en.status_code == 200
    html_en = res_en.json()["html_content"]

    # Sections en Anglais
    assert "EDUCATION" in html_en
    assert "PROFESSIONAL EXPERIENCE (INTERNSHIPS)" in html_en
    assert "SELECTED PROJECTS" in html_en
    assert "TECHNICAL SKILLS" in html_en
    assert "EXTRACURRICULAR ACTIVITIES" in html_en
    assert "LANGUAGES" in html_en

    # Activités en anglais
    assert "Project Department" in html_en
    assert "Communication Director" in html_en

    # Langues en anglais
    assert "Arabic" in html_en
    assert "Native" in html_en
    assert "Fluent" in html_en
    assert "Technical" in html_en

