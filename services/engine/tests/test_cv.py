import io
import pytest
from sqlmodel import Session

from app.adapters.pdf import PDFCompilerService
from app.domain.ats import ATSMatchingEngine
from app.domain.cv import CVGeneratorService
from app.domain.models import Education, Experience, ExtracurricularBase, JobOffer, LanguageBase, MasterProfile, Project, Skill
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
            profile.educations = [
                Education(profile_id=profile.id, school="ESPRIT", degree="Diplôme National d'Ingénieur", field_of_study="Architectures Cloud", start_date="2022", end_date="2027")
            ]
            profile.experiences = [
                Experience(profile_id=profile.id, company="Capgemini Tunisie", role="Stagiaire DevOps", description="CI/CD avec Jenkins.", technologies_raw="Jenkins,CI/CD", start_date="06/2025", end_date="07/2025")
            ]
            profile.projects = [
                Project(profile_id=profile.id, title="FinOps Agent", role="Lead Développeur", description="Plateforme multi-agents pour coûts AWS.", technologies_raw="AWS,Python", url="https://www.louaycodes.tn")
            ]
            profile.skills = [
                Skill(profile_id=profile.id, name="Kubernetes", category="Cloud & DevOps"),
                Skill(profile_id=profile.id, name="Docker", category="Cloud & DevOps"),
                Skill(profile_id=profile.id, name="Python", category="Programming"),
            ]
            profile.extracurriculars = [
                ExtracurricularBase(organization="Enactus EMC", role="Département Projets", role_en="Project Department", date="2022 – 2023", description="Impact communautaire.", description_en="Community impact."),
                ExtracurricularBase(organization="Lycée Pilote Bizerte Youth Club", role="Directeur de la Communication", role_en="Communication Director", date="2018 – 2019", description="Couverture médiatique.", description_en="Media coverage."),
            ]
            profile.languages = [
                LanguageBase(name="Arabe", level="Langue maternelle"),
                LanguageBase(name="Français", level="Courant"),
                LanguageBase(name="Anglais", level="Technique"),
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


@pytest.mark.asyncio
async def test_cv_pdf_two_pages_flow_balance():
    import io
    import pypdf

    with Session(engine) as session:
        job = JobOffer(
            id="job-cv-balance",
            platform="linkedin",
            external_id="ext-cv-bal",
            title="Ingénieur DevOps / Cloud",
            company="Accenture",
            description_raw="Kubernetes, Docker, AWS, CI/CD, Python requis.",
            status="DISCOVERED",
        )
        session.add(job)

        profile = session.get(MasterProfile, "default-profile")
        if profile:
            profile.full_name = "Louay Zorai"
            profile.is_complete = True
            profile.website_url = "https://www.louaycodes.tn"
            profile.headline = "Élève-Ingénieur Architectures Cloud / DevOps"
            profile.bio = "Élève-ingénieur en informatique spécialisé en architectures Cloud & DevOps à l'ESPRIT. Solides compétences pratiques en Kubernetes, Docker, AWS et conception de systèmes distribués fiables."
            profile.educations = [
                Education(profile_id=profile.id, school="ESPRIT", degree="Diplôme National d'Ingénieur", field_of_study="Architectures Cloud", start_date="2022", end_date="2027")
            ]
            skills_names = ["OpenStack", "Kubernetes", "Docker", "Ansible", "Prometheus", "Grafana", "Zabbix", "AWS", "TCP/IP", "VMware", "Cisco", "Spring Boot", "FastAPI", "Node.js", "Angular", "Next.js", "Python", "Java", "C++", "Git", "Linux"]
            profile.skills = [Skill(profile_id=profile.id, name=s) for s in skills_names]
            profile.experiences = [
                Experience(profile_id=profile.id, company="Capgemini Tunisie", role="Stagiaire FinOps", description="Plateforme FinOps autonome multi-agents pour la détection d'anomalies de coûts AWS, prévisions et recommandations via Flask et Angular.", technologies_raw="AWS,Python,Angular,Docker,LangGraph", start_date="06/2026", end_date="08/2026"),
                Experience(profile_id=profile.id, company="EY Tunisie", role="Stagiaire AI & DATA", description="Modélisation de graphes de réseaux et création de tableaux de bord analytiques avec Python, NetworkX et PowerBI.", technologies_raw="Python,NetworkX,PowerBI", start_date="08/2026", end_date="09/2026"),
                Experience(profile_id=profile.id, company="Capgemini Tunisie", role="Stagiaire DevOps", description="Mise en œuvre et automatisation de pipelines d'intégration et déploiement continus (CI/CD) avec Jenkins.", technologies_raw="Jenkins,CI/CD,Git", start_date="06/2025", end_date="07/2025"),
                Experience(profile_id=profile.id, company="Natilait", role="Stagiaire", description="Immersion pratique dans les systèmes d'information industriels et administration réseau.", technologies_raw="Linux,Réseaux", start_date="06/2024", end_date="07/2024"),
            ]
            profile.projects = [
                Project(profile_id=profile.id, title="FinOps Agent", role="Lead Développeur", description="Plateforme multi-agents orchestrée par LangGraph pour la découverte, prévision et réduction des coûts AWS.", technologies_raw="AWS,Python,LangGraph,ChromaDB,Angular"),
                Project(profile_id=profile.id, title="Pipeline CI/CD auto-hébergé", role="Ingénieur DevOps", description="J'ai construit un pipeline CI/CD complet pour une application Spring Boot et Angular, s'exécutant de bout en bout sur un serveur Linux auto-géré. Chaque push sur GitHub déclenche automatiquement Jenkins via un webhook, qui exécute la compilation, teste le code, l'analyse avec SonarQube et OWASP Dependency-Check, construit une image Docker, la pousse sur Docker Hub, et la déploie sur un cluster Kubernetes. Prometheus et Grafana surveillent la santé du cluster, et Jenkins envoie un résumé de build au format HTML par email après chaque exécution.", technologies_raw="Jenkins,Kubernetes,Docker,Prometheus,Grafana"),
                Project(profile_id=profile.id, title="Insightify", role="Lead Développeur", description="Application de bureau de gestion de podcasts avec reconnaissance faciale et vocale, messagerie interne et C++.", technologies_raw="C++,Qt,Python"),
                Project(profile_id=profile.id, title="Skill Sphere", role="Développeur Fullstack", description="Simulateur d'entretien technique avec l'API Grok AI, analytics en temps réel et conseils personnalisés.", technologies_raw="NextJS,PostgreSQL,Grok"),
                Project(profile_id=profile.id, title="Fast Agil", role="Ingénieur Mobile", description="Application mobile de gestion de file d'attente et réservation intelligente avec FlutterFlow et Firebase.", technologies_raw="FlutterFlow,Firebase"),
            ]
            profile.extracurriculars = [
                ExtracurricularBase(organization="Enactus EMC", role="Département Projets", date="2022 – 2023", description="Impact communautaire et entrepreneuriat social."),
                ExtracurricularBase(organization="Lycée Pilote Bizerte Youth Club", role="Directeur de la Communication", date="2018 – 2019", description="Couverture médiatique et communication."),
            ]
            profile.languages = [
                LanguageBase(name="Arabe", level="Langue maternelle"),
                LanguageBase(name="Français", level="Courant"),
                LanguageBase(name="Anglais", level="Technique"),
            ]
            session.add(profile)
        session.commit()

    res = client.post("/api/cv/generate/job-cv-balance?lang=fr")
    assert res.status_code == 200
    html = res.json()["html_content"]

    # 1. Vérification des règles CSS de saut de page
    assert "page-break-after: avoid;" in html
    assert "break-after: avoid;" in html
    assert ".section {\n            margin-bottom: 8px;\n        }" in html or "page-break-inside: avoid" not in html.split(".section {")[1].split("}")[0]

    # 2. Compilation PDF vectoriel 2 pages
    pdf_bytes = await PDFCompilerService.compile_html_to_pdf(html)
    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    assert len(reader.pages) == 2, f"Le CV doit faire exactement 2 pages, reçu {len(reader.pages)}"

    # 3. La page 1 doit être remplie (>40 lignes de texte)
    p1_lines = [l.strip() for l in reader.pages[0].extract_text().splitlines() if l.strip()]
    p2_lines = [l.strip() for l in reader.pages[1].extract_text().splitlines() if l.strip()]
    assert len(p1_lines) >= 40, f"La page 1 doit être remplie jusqu'en bas, seulement {len(p1_lines)} lignes trouvées"
    assert len(p2_lines) >= 4, f"La page 2 doit contenir le reste des sections, {len(p2_lines)} lignes trouvées"


def test_cv_upload_and_parsing_endpoint():
    sample_cv_text = """
    LOUAY ZORAI
    Élève-Ingénieur Architectures Cloud / DevOps
    louay@louaycodes.tn • +216 28 898 908 • Tunis • www.louaycodes.tn • linkedin.com/in/louay-zorai • github.com/louayzorai

    PROFIL PROFESSIONNEL
    Élève-ingénieur passionné par les architectures cloud-native, Kubernetes et Terraform.

    FORMATION
    Diplôme National d'Ingénieur en informatique — ESPRIT (2022 – 2027)
    Spécialisation Systèmes Distribués et Cloud.

    EXPÉRIENCES PROFESSIONNELLES (STAGES)
    Stagiaire FinOps — Capgemini Tunisie (06/2026 – 08/2026)
    Plateforme multi-agents pour la détection d'anomalies de coûts AWS.
    Technologies : AWS, Python, Angular, Docker

    PROJETS SÉLECTIONNÉS
    Pipeline CI/CD auto-hébergé — Ingénieur DevOps
    Mise en place d'un pipeline Jenkins avec Kubernetes et Docker.
    Technologies : Jenkins, Kubernetes, Docker

    COMPÉTENCES TECHNIQUES
    Cloud : AWS, Docker, Kubernetes, Terraform, Ansible
    Backend : Python, FastAPI, Spring Boot

    LANGUES
    Arabe : Langue maternelle • Français : Courant • Anglais : Technique
    """

    files = {"file": ("test_cv.txt", io.BytesIO(sample_cv_text.encode("utf-8")), "text/plain")}
    res = client.post("/api/cv/upload?sync_to_profile=true", files=files)
    assert res.status_code == 200
    data = res.json()

    assert "data" in data
    assert "html_content" in data
    cv_data = data["data"]
    assert "LOUAY ZORAI" in cv_data["full_name"]
    assert cv_data["email"] == "louay@louaycodes.tn"
    assert "28 898 908" in cv_data["phone"]
    assert len(cv_data["educations"]) >= 1
    assert "ESPRIT" in cv_data["educations"][0]["school"]
    assert len(cv_data["experiences"]) >= 1
    assert "Capgemini" in cv_data["experiences"][0]["company"]
    assert any("AWS" in s or "Docker" in s for cat in cv_data["skills_categories"] for s in cat["skills"])


def test_cv_render_custom_endpoint():
    payload = {
        "full_name": "Sarah Connor",
        "headline": "Lead Cloud Security Engineer",
        "email": "sarah@cyberdyne.org",
        "phone": "+33 6 12 34 56 78",
        "location": "Paris, France",
        "portfolio_url": "https://sarah.dev",
        "linkedin_url": "https://linkedin.com/in/sarah-connor",
        "github_url": "https://github.com/sarah-connor",
        "summary": "Experte en résilience d'infrastructures et Zero Trust.",
        "educations": [
            {
                "school": "Polytech",
                "degree": "Diplôme d'Ingénieur",
                "field_of_study": "Cybersécurité",
                "start_date": "2020",
                "end_date": "2025",
                "description": "Sécurité des systèmes distribués",
            }
        ],
        "experiences": [
            {
                "company": "CyberDyne Systems",
                "role": "SecOps Intern",
                "location": "Paris",
                "start_date": "02/2025",
                "end_date": "08/2025",
                "description": "Hardening de clusters Kubernetes et détection d'intrusions.",
                "technologies": ["Kubernetes", "Falco", "Docker"],
            }
        ],
        "projects": [
            {
                "title": "ZeroTrust Enforcer",
                "role": "Creator",
                "url": "https://sarah.dev/project",
                "description": "Agent eBPF open-source.",
                "technologies": ["eBPF", "Go", "Linux"],
            }
        ],
        "skills_categories": [
            {
                "title": "Cloud & Sécurité",
                "skills": ["Kubernetes", "Docker", "eBPF", "Linux", "Terraform"],
            }
        ],
        "extracurricular": [],
        "languages": ["Français : Courant", "Anglais : Bilingue"],
        "language": "fr",
        "font_size_pt": 9.2,
        "line_height": 1.4,
        "margin_top_mm": 10.0,
        "margin_bottom_mm": 10.0,
        "margin_left_mm": 14.0,
        "margin_right_mm": 14.0,
    }

    res = client.post("/api/cv/render", json=payload)
    assert res.status_code == 200
    html = res.json()["html_content"]
    assert "Sarah Connor" in html
    assert "Lead Cloud Security Engineer" in html
    assert "sarah@cyberdyne.org" in html
    assert "CyberDyne Systems" in html
    assert "ZeroTrust Enforcer" in html
    assert "font-size: 9.2pt;" in html
    assert "line-height: 1.4;" in html
    assert "margin: 10.0mm 14.0mm 10.0mm 14.0mm;" in html


@pytest.mark.asyncio
async def test_compile_custom_pdf_endpoint():
    sample_html = """<!DOCTYPE html>
    <html>
    <head>
        <style>
            @page { size: A4; margin: 8mm 12mm; }
            body { font-family: -apple-system, sans-serif; font-size: 9pt; }
        </style>
    </head>
    <body>
        <h1>Louay Zorai</h1>
        <p>Aperçu identique au PDF exporté.</p>
    </body>
    </html>
    """

    res = client.post(
        "/api/cv/compile-pdf",
        json={"html_content": sample_html, "filename": "CV_Louay_Zorai.pdf"},
    )
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert "CV_Louay_Zorai.pdf" in res.headers.get("content-disposition", "")
    assert res.content.startswith(b"%PDF")
    assert len(res.content) > 1000


def test_cv_draft_and_from_profile_persistence():
    # 1. GET /api/cv/from-profile
    res_prof = client.get("/api/cv/from-profile?lang=fr")
    assert res_prof.status_code == 200
    prof_data = res_prof.json()
    assert "data" in prof_data
    assert "html_content" in prof_data

    # 2. POST /api/cv/save-draft
    custom_cv = prof_data["data"]
    custom_cv["headline"] = "Architecte Cloud Senior (Test Brouillon)"
    res_save = client.post("/api/cv/save-draft", json=custom_cv)
    assert res_save.status_code == 200
    assert res_save.json()["status"] == "saved"

    # 3. GET /api/cv/draft
    res_draft = client.get("/api/cv/draft")
    assert res_draft.status_code == 200
    draft_resp = res_draft.json()
    assert draft_resp["has_draft"] is True
    assert draft_resp["data"]["headline"] == "Architecte Cloud Senior (Test Brouillon)"
    assert "Architecte Cloud Senior" in draft_resp["html_content"]


def test_clean_target_role_and_headline_format():
    from app.domain.cv import clean_target_role
    assert clean_target_role("HBNS offre Stage IT Support", "HBNS") == "IT Support"
    assert clean_target_role("Stage PFE Développeur Python (H/F)", "Google") == "Développeur Python"
    assert clean_target_role("Kubernetes specialist", "Thales") == "Kubernetes specialist"

    # Test format in generate_cv
    with Session(engine) as session:
        job = JobOffer(
            id="job-headline-test",
            platform="linkedin",
            external_id="ext-hl-1",
            title="HBNS offre Stage IT Support",
            company="HBNS",
            description_raw="Poste de support IT avec Docker et Linux.",
            status="DISCOVERED",
        )
        session.add(job)
        profile = session.get(MasterProfile, "default-profile")
        if profile:
            profile.is_complete = True
            profile.headline = "ETUDIANT INGENIEUR CLOUD | DEVOPS | AI"
            profile.headline_fr = "ETUDIANT INGENIEUR CLOUD | DEVOPS | AI"
            session.add(profile)
        session.commit()

        ats_match = ATSMatchingEngine.evaluate_alignment(job, profile)
        cv = CVGeneratorService.generate_cv(job, profile, ats_match, language="fr")
        assert cv.headline == "IT Support"


def test_cv_writer_experiences_projects_order_alignment(monkeypatch):
    from app.domain.cv_agent import _build_cv_context, _parse_cv_rewrite_response, CVRewriteResult

    selected_exps = [
        {"company": "Capgemini", "role": "Stagiaire DevOps", "description": "CI/CD avec Jenkins.", "technologies": ["Jenkins", "Docker"]},
        {"company": "Natilait", "role": "Stagiaire IT", "description": "Support réseaux.", "technologies": ["Linux"]},
    ]
    selected_projs = [
        {"title": "FinOps Agent", "role": "Lead", "description": "Optimisation des coûts AWS.", "technologies": ["AWS", "Python"]},
        {"title": "Skill Sphere", "role": "Dev", "description": "Simulateur d'entretien IA.", "technologies": ["FastAPI", "React"]},
    ]

    ctx = _build_cv_context(
        profile={"full_name": "Test User"},
        recon={},
        job={"title": "DevOps", "company": "TechCorp"},
        ats={},
        lang="fr",
        experiences=selected_exps,
        projects=selected_projs,
    )

    assert "EXP_1 : Stagiaire DevOps chez Capgemini" in ctx
    assert "EXP_2 : Stagiaire IT chez Natilait" in ctx
    assert "PROJ_1 : « FinOps Agent » (Lead)" in ctx
    assert "PROJ_2 : « Skill Sphere » (Dev)" in ctx

    # Test parser
    raw_response = (
        "SUMMARY:\nIngénieur DevOps orienté cloud.\n\n"
        "---EXPERIENCES---\n"
        "EXP_1 (pour Stagiaire DevOps chez Capgemini):\n"
        "Mise en place de pipelines CI/CD résilients sur Jenkins.\n\n"
        "EXP_2 (pour Stagiaire IT chez Natilait):\n"
        "Administration et supervision des infrastructures réseaux.\n\n"
        "---PROJECTS---\n"
        "PROJ_1 (pour FinOps Agent):\n"
        "Développement d'un système multi-agents autonome pour les coûts cloud.\n\n"
        "PROJ_2 (pour Skill Sphere):\n"
        "Conception d'une plateforme d'évaluation IA full-stack.\n"
    )

    parsed = _parse_cv_rewrite_response(raw_response, n_exp=2, n_proj=2)
    assert len(parsed.experiences) == 2
    assert parsed.experiences[0]["index"] == 0
    assert "Jenkins" in parsed.experiences[0]["description"]
    assert parsed.experiences[1]["index"] == 1
    assert "réseaux" in parsed.experiences[1]["description"]

    assert len(parsed.projects) == 2
    assert parsed.projects[0]["index"] == 0
    assert "multi-agents" in parsed.projects[0]["description"]
    assert parsed.projects[1]["index"] == 1
    assert "full-stack" in parsed.projects[1]["description"]



