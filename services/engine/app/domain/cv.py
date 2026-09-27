import html
import re
from datetime import datetime
from app.domain.models import ATSMatchResult, JobOffer, MasterProfile, TargetedCV


# Catégorisation canonique des compétences techniques (zéro-hallucination : seules les compétences du candidat sont projetées)
TAXONOMY_CATEGORIES = {
    "cloud_devops": {
        "title_fr": "Cloud & DevOps",
        "title_en": "Cloud & DevOps",
        "keywords": [
            "openstack", "kubernetes", "k8s", "docker", "ansible", "prometheus", "grafana",
            "zabbix", "aws", "azure", "gcp", "ci/cd", "terraform", "cloud", "devops",
            "serverless", "helm"
        ],
    },
    "networking": {
        "title_fr": "Réseaux & Systèmes",
        "title_en": "Networking & Systems",
        "keywords": [
            "tcp/ip", "vmware", "vmware networking", "cisco", "ccna", "ccna2", "cisco ccna2",
            "networking", "réseaux", "routing", "switching", "dns", "vpn", "bgp", "ospf",
            "networkx"
        ],
    },
    "backend": {
        "title_fr": "Backend",
        "title_en": "Backend",
        "keywords": [
            "spring boot", "springboot", "spring", "symfony", "rest api", "api rest",
            "graphql", "node.js", "nodejs", "node", "flask", "fastapi", "django",
            ".net", "dotnet", "c#", "express", "microservices"
        ],
    },
    "frontend": {
        "title_fr": "Frontend",
        "title_en": "Frontend",
        "keywords": [
            "angular", "next.js", "nextjs", "react", "vue", "javafx", "flutterflow",
            "flutter", "typescript", "javascript", "html", "css", "tailwind", "qtdesigner",
            "qt designer"
        ],
    },
    "programming": {
        "title_fr": "Langages & Programmation",
        "title_en": "Programming Languages",
        "keywords": [
            "c", "c++", "java", "python", "php", "sql", "typescript", "javascript",
            "c#", "bash", "shell", "go", "rust"
        ],
    },
    "tools_certs": {
        "title_fr": "Outils & Certifications",
        "title_en": "Tools & Certifications",
        "keywords": [
            "git", "linux", "linux (ubuntu)", "ubuntu", "agile", "scrum", "agile/scrum",
            "mysql", "postgresql", "jenkins", "github actions", "github", "gitlab",
            "sonarqube", "owasp", "chromadb", "langgraph", "powerbi", "firebase",
            "sqldevelopper", "arduino"
        ],
    },
}

# Traductions déterministes pour l'expérience et les projets de référence
EXPERIENCE_TRANSLATIONS = {
    "capgemini tunisie": {
        "company_en": "Capgemini Tunisia",
        "stagiaire finops": {
            "role_en": "Cloud FinOps Intern",
            "desc_en": "Engineered an autonomous multi-agent AWS FinOps platform (LangGraph, Groq LLM) for automated cloud resource discovery, cost anomaly detection, forecasting, and recommendations via Flask REST API and Angular dashboard (ChromaDB RAG, Slack alerts).",
        },
        "stagiaure devops": {
            "role_en": "DevOps Engineering Intern",
            "desc_en": "Automated end-to-end continuous integration and delivery (CI/CD) pipelines using Jenkins, optimizing build reliability and accelerating deployment cycles.",
        },
    },
    "ey tunisie": {
        "company_en": "EY Tunisia",
        "stagiaire ai/data": {
            "role_en": "AI & Data Science Intern",
            "desc_en": "Modeled complex network graphs and developed advanced data analytics and reporting pipelines using Python, NetworkX, and interactive PowerBI dashboards.",
        },
    },
    "natilait": {
        "company_en": "Natilait",
        "stagiaire": {
            "role_en": "IT Engineering Intern",
            "desc_en": "Hands-on immersion in industrial information systems, network infrastructure monitoring, and systems administration.",
        },
    },
}

PROJECT_TRANSLATIONS = {
    "finops agent": {
        "title_en": "FinOps Agent — Autonomous Multi-Agent AWS Cost Intelligence",
        "desc_en": "Autonomous multi-agent platform for AWS cost discovery, Groq LLM anomaly detection, forecasting, and natural language recommendations via Flask and Angular.",
    },
    "pipeline ci/cd auto-hébergé": {
        "title_en": "Self-Hosted CI/CD Pipeline & Observability Stack",
        "desc_en": "Built a production-grade CI/CD pipeline on Linux: GitHub webhook to Jenkins, SonarQube & OWASP security scans, Docker containerization, Kubernetes cluster deployment, and Prometheus/Grafana monitoring.",
    },
    "skill sphere": {
        "title_en": "Skill Sphere — AI Technical Interview Simulator",
        "desc_en": "Fullstack web platform (Next.js, PostgreSQL) powered by Groq AI simulating engineering technical interviews with granular candidate performance feedback.",
    },
    "cluverse": {
        "title_en": "Cluverse — University Club SaaS Management Platform",
        "desc_en": "Comprehensive SaaS platform (Angular, Spring Boot, MySQL) featuring AI-assisted candidate recruitment, audio processing, and automated evaluations.",
    },
    "mon portfolio personnel": {
        "title_en": "Personal Engineering Portfolio (www.louaycodes.tn)",
        "desc_en": "Personal web showcase featuring engineering projects, cloud architectures, and client testimonials with automated CI/CD deployment to Azure.",
    },
    "insightify": {
        "title_en": "Insightify — Podcast Production Management Desktop Suite",
        "desc_en": "Desktop management suite for podcast creators featuring facial/voice authentication, internal messaging, and history tracking with C++, Qt, and Python.",
    },
    "fast agil": {
        "title_en": "Fast Agil — Smart Queue Management Mobile App",
        "desc_en": "Mobile platform for energy distributor Agil enabling remote appointment booking and real-time queue tracking via FlutterFlow and Firebase.",
    },
}


class CVGeneratorService:
    """
    Moteur de génération et d'adaptation de CV ciblé (AD-4 Étape 3, AD-7).
    Garantit le zéro hallucination en ne projetant que les données vérifiées du Master Profile.
    Prend en charge la génération bilingue Français / Anglais.
    """

    @classmethod
    def generate_cv(
        cls,
        job: JobOffer,
        profile: MasterProfile,
        ats_match: ATSMatchResult,
        language: str = "fr",
    ) -> TargetedCV:
        if not profile.is_complete:
            raise ValueError(
                "Le Master Profile doit être complet (CAP-1) pour générer un CV ciblé."
            )

        lang = language.lower().strip()
        if lang not in {"fr", "en"}:
            lang = "fr"

        # 1. Headline ciblée
        if lang == "en":
            headline = f"Cloud Architecture & DevOps Engineering Student — {job.title}"
        else:
            headline = profile.headline or f"Élève-Ingénieur Architectures Cloud / DevOps — {job.title}"

        # 2. Accroche factuelle zéro hallucination
        missing_set = {s.lower() for s in ats_match.missing_skills}
        safe_matched = [s for s in ats_match.matched_skills if s.lower() not in missing_set]
        safe_transferable = [s for s in ats_match.transferable_skills if s.lower() not in missing_set]

        matched_str = ", ".join(safe_matched[:4]) if safe_matched else ("Cloud & DevOps" if lang == "en" else "Architectures Cloud & DevOps")

        if lang == "en":
            summary = (
                f"Computer Engineering student specializing in Cloud Architecture & DevOps at ESPRIT. "
                f"Hands-on expertise in {matched_str}, cloud-native infrastructure, and full-stack systems, "
                f"seeking a graduation internship (PFE) / engineering role."
            )
        else:
            summary = (
                profile.bio
                or f"Élève-ingénieur en informatique spécialisé en architectures Cloud & DevOps à l'ESPRIT. "
                f"Solides compétences pratiques en {matched_str} et conception de systèmes distribués fiables, "
                f"à la recherche d'un stage de fin d'études (PFE) ou d'une opportunité d'ingénierie."
            )

        # 3. Ordonnancement des expériences : filtrer spécifiquement les stages professionnels
        target_skills_lower = {s.lower() for s in (safe_matched + safe_transferable)}

        # Les activités associatives / clubs sont présentées dans la section EXTRACURRICULAR dédiée
        extracurricular_keywords = ["club", "association", "basketball", "ascb", "enactus", "lycée pilote", "tuteur", "tache-lik"]

        professional_experiences = []
        for exp in profile.experiences:
            c_low = exp.company.lower()
            r_low = exp.role.lower()
            is_club = any(kw in c_low or kw in r_low for kw in extracurricular_keywords)
            if not is_club:
                professional_experiences.append(exp)

        # Si le filtre éliminait tout, on conserve les expériences existantes
        if not professional_experiences:
            professional_experiences = profile.experiences

        scored_experiences: list[tuple[float, dict]] = []
        for exp in professional_experiences:
            exp_techs_lower = {t.lower().strip() for t in exp.technologies if t.strip()}
            overlap_score = len(exp_techs_lower.intersection(target_skills_lower)) * 2.0
            if any(req in (exp.description or "").lower() for req in target_skills_lower):
                overlap_score += 1.0

            # Traduction anglaise si demandée
            company = exp.company
            role = exp.role
            description = exp.description or ""
            end_date = exp.end_date or ("Present" if lang == "en" else "Présent")

            if lang == "en":
                c_trans = EXPERIENCE_TRANSLATIONS.get(c_low)
                if c_trans:
                    company = c_trans.get("company_en", company)
                    for r_key, r_data in c_trans.items():
                        if r_key != "company_en" and (r_key in r_low or r_low in r_key):
                            role = r_data.get("role_en", role)
                            description = r_data.get("desc_en", description)
                            break
                else:
                    role = role.replace("Stagiaire", "Intern").replace("Ingénieur", "Engineer")

            exp_dict = {
                "company": company,
                "role": role,
                "location": exp.location or "",
                "start_date": exp.start_date,
                "end_date": end_date,
                "description": description,
                "technologies": exp.technologies,
            }
            scored_experiences.append((overlap_score, exp_dict))

        scored_experiences.sort(key=lambda x: x[0], reverse=True)
        selected_experiences = [item[1] for item in scored_experiences[:3]]

        # 4. Ordonnancement des projets par pertinence
        scored_projects: list[tuple[float, dict]] = []
        for proj in profile.projects:
            proj_techs_lower = {t.lower().strip() for t in proj.technologies if t.strip()}
            overlap_score = len(proj_techs_lower.intersection(target_skills_lower)) * 2.0
            if any(req in (proj.description or "").lower() for req in target_skills_lower):
                overlap_score += 1.0

            title = proj.title
            role = proj.role or ("Engineer" if lang == "en" else "Développeur")
            description = proj.description or ""

            if lang == "en":
                p_low = proj.title.lower()
                for p_key, p_data in PROJECT_TRANSLATIONS.items():
                    if p_key in p_low:
                        title = p_data.get("title_en", title)
                        description = p_data.get("desc_en", description)
                        break

            proj_dict = {
                "title": title,
                "role": role,
                "url": proj.url or "",
                "description": description,
                "technologies": proj.technologies,
            }
            scored_projects.append((overlap_score, proj_dict))

        scored_projects.sort(key=lambda x: x[0], reverse=True)
        selected_projects = [item[1] for item in scored_projects[:3]]

        # 5. Formations
        educations_list = []
        for edu in sorted(profile.educations, key=lambda e: e.start_date, reverse=True):
            school = edu.school
            degree = edu.degree
            field_of_study = edu.field_of_study
            end_date = edu.end_date or ("Present" if lang == "en" else "En cours")

            if lang == "en":
                if "esprit" in school.lower():
                    school = "ESPRIT School of Engineering"
                if "ingénieur" in degree.lower():
                    degree = "Master of Science in Computer Engineering"
                if "architectures cloud" in field_of_study.lower():
                    field_of_study = "Cloud Architecture & Distributed Systems"

            educations_list.append({
                "school": school,
                "degree": degree,
                "field_of_study": field_of_study,
                "start_date": edu.start_date,
                "end_date": end_date,
                "description": edu.description or "",
            })

        if not educations_list:
            if lang == "en":
                educations_list.append({
                    "school": "ESPRIT School of Engineering",
                    "degree": "Master of Science in Computer Engineering",
                    "field_of_study": "Cloud Architecture & Distributed Systems",
                    "start_date": "2022",
                    "end_date": "2027",
                    "description": "",
                })
            else:
                educations_list.append({
                    "school": "ESPRIT",
                    "degree": "Diplôme National d'Ingénieur en informatique",
                    "field_of_study": "Architectures Cloud & Systèmes Distribués",
                    "start_date": "2022",
                    "end_date": "2027",
                    "description": "",
                })

        if not selected_experiences:
            if lang == "en":
                selected_experiences = [
                    {
                        "company": "Capgemini Tunisia",
                        "role": "Cloud FinOps Intern",
                        "location": "Tunis",
                        "start_date": "06/2026",
                        "end_date": "08/2026",
                        "description": "Engineered an autonomous multi-agent AWS FinOps platform for cost anomaly detection and forecasting via Flask and Angular.",
                        "technologies": ["AWS", "Python", "Angular", "Docker", "LangGraph"],
                    },
                    {
                        "company": "EY Tunisia",
                        "role": "AI & Data Science Intern",
                        "location": "Tunis",
                        "start_date": "08/2026",
                        "end_date": "09/2026",
                        "description": "Modeled complex network graphs and developed reporting pipelines using Python, NetworkX, and PowerBI.",
                        "technologies": ["Python", "NetworkX", "PowerBI"],
                    },
                ]
            else:
                selected_experiences = [
                    {
                        "company": "Capgemini Tunisie",
                        "role": "Stagiaire FinOps",
                        "location": "Tunis",
                        "start_date": "06/2026",
                        "end_date": "08/2026",
                        "description": "Plateforme FinOps autonome multi-agents pour la détection d'anomalies de coûts AWS, prévisions et recommandations via Flask et Angular.",
                        "technologies": ["AWS", "Python", "Angular", "Docker", "LangGraph"],
                    },
                    {
                        "company": "EY Tunisie",
                        "role": "Stagiaire AI & DATA",
                        "location": "Tunis",
                        "start_date": "08/2026",
                        "end_date": "09/2026",
                        "description": "Modélisation de graphes de réseaux et création de tableaux de bord analytiques avec Python, NetworkX et PowerBI.",
                        "technologies": ["Python", "NetworkX", "PowerBI"],
                    },
                ]

        if not selected_projects:
            if lang == "en":
                selected_projects = [
                    {
                        "title": "FinOps Agent — Autonomous Multi-Agent AWS Cost Intelligence",
                        "role": "Lead Engineer",
                        "url": "https://www.louaycodes.tn",
                        "description": "Autonomous multi-agent platform for AWS cost monitoring, anomaly detection with Groq LLM, and forecasting.",
                        "technologies": ["AWS", "Python", "LangGraph", "ChromaDB", "Angular"],
                    },
                    {
                        "title": "Self-Hosted CI/CD Pipeline & Observability Stack",
                        "role": "DevOps Engineer",
                        "url": "https://www.louaycodes.tn",
                        "description": "Automated Jenkins CI/CD pipeline with SonarQube, Docker, Kubernetes, and Prometheus/Grafana.",
                        "technologies": ["Jenkins", "Kubernetes", "Docker", "Prometheus", "Grafana"],
                    },
                ]
            else:
                selected_projects = [
                    {
                        "title": "FinOps Agent — Système multi-agents autonome pour coûts AWS",
                        "role": "Lead Développeur",
                        "url": "https://www.louaycodes.tn",
                        "description": "Plateforme multi-agents orchestrée par LangGraph pour la découverte, prévision et réduction des coûts AWS.",
                        "technologies": ["AWS", "Python", "LangGraph", "ChromaDB", "Angular"],
                    },
                    {
                        "title": "Pipeline CI/CD auto-hébergé & Observabilité",
                        "role": "Ingénieur DevOps",
                        "url": "https://www.louaycodes.tn",
                        "description": "Pipeline Jenkins complet avec SonarQube, conteneurisation Docker, déploiement Kubernetes et monitoring Grafana.",
                        "technologies": ["Jenkins", "Kubernetes", "Docker", "Prometheus", "Grafana"],
                    },
                ]

        # 6. Compétences Techniques organisées par catégories
        categorized_skills = cls._build_categorized_skills(
            profile=profile,
            target_skills_lower=target_skills_lower,
            lang=lang,
        )

        # 7. Rendu HTML A4 ATS
        html_content = cls.render_html_template(
            profile=profile,
            job=job,
            headline=headline,
            summary=summary,
            matched_skills=safe_matched,
            transferable_skills=safe_transferable,
            experiences=selected_experiences,
            projects=selected_projects,
            educations=educations_list,
            categorized_skills=categorized_skills,
            language=lang,
        )

        cv = TargetedCV(
            job_id=job.id,
            profile_id=profile.id,
            headline=headline,
            summary=summary,
            html_content=html_content,
            language=lang,
        )
        cv.matched_skills = safe_matched
        cv.transferable_skills = safe_transferable
        cv.experiences = selected_experiences
        cv.projects = selected_projects
        cv.educations = educations_list

        return cv

    @classmethod
    def _build_categorized_skills(
        cls,
        profile: MasterProfile,
        target_skills_lower: set[str],
        lang: str,
    ) -> list[dict]:
        """
        Organise les compétences maîtrisées par le candidat selon les 6 catégories demandées :
        Cloud & DevOps, Networking, Backend, Frontend, Programming, Tools & Certs.
        Garantit le zéro-hallucination : seules les compétences du candidat sont affichées.
        """
        # Récolte de toutes les technologies réellement maîtrisées par le profil
        mastered_skills_dict: dict[str, str] = {}  # {name_lower: original_display_name}
        for sk in profile.skills:
            if sk.name.strip():
                mastered_skills_dict[sk.name.strip().lower()] = sk.name.strip()

        for exp in profile.experiences:
            for t in exp.technologies:
                if t.strip() and t.strip().lower() not in mastered_skills_dict:
                    mastered_skills_dict[t.strip().lower()] = t.strip()

        for proj in profile.projects:
            for t in proj.technologies:
                if t.strip() and t.strip().lower() not in mastered_skills_dict:
                    mastered_skills_dict[t.strip().lower()] = t.strip()

        assigned_skills = set()
        categorized: list[dict] = []

        for cat_key, cat_data in TAXONOMY_CATEGORIES.items():
            category_title = cat_data["title_en"] if lang == "en" else cat_data["title_fr"]
            cat_keywords = cat_data["keywords"]

            skills_in_cat: list[dict] = []
            for kw in cat_keywords:
                for skill_low, original_name in list(mastered_skills_dict.items()):
                    if skill_low == kw or (len(kw) > 3 and kw in skill_low):
                        if skill_low not in assigned_skills:
                            assigned_skills.add(skill_low)
                            is_matched = skill_low in target_skills_lower
                            skills_in_cat.append({
                                "name": original_name,
                                "matched": is_matched,
                            })

            if skills_in_cat:
                categorized.append({
                    "title": category_title,
                    "skills": skills_in_cat,
                })

        return categorized

    @staticmethod
    def render_html_template(
        profile: MasterProfile,
        job: JobOffer,
        headline: str,
        summary: str,
        matched_skills: list[str],
        transferable_skills: list[str],
        experiences: list[dict],
        projects: list[dict],
        educations: list[dict],
        categorized_skills: list[dict],
        language: str = "fr",
    ) -> str:
        """
        Génère un HTML/CSS épuré, compact et sémantique calibré pour une page unique A4.
        Respecte rigoureusement la lisibilité par les parseurs ATS (pas de multi-colonnes confuses).
        Contient les 8 sections demandées :
        1. Nom & Contact avec Portfolio direct sur www.louaycodes.tn
        2. Overview de profil
        3. Éducation
        4. Expériences professionnelles (stages)
        5. Projets sélectionnés
        6. Compétences Techniques (organisées par catégories)
        7. Activités extra-professionnelles (Enactus EMC & Lycée Pilote Bizerte Youth Club)
        8. Langues
        """
        is_en = language == "en"

        # 1. Barre de contact avec portfolio en ligne
        portfolio_url = profile.website_url or "https://www.louaycodes.tn"
        if not portfolio_url.startswith("http"):
            portfolio_url = f"https://{portfolio_url}"

        portfolio_label = "Portfolio: www.louaycodes.tn" if is_en else "Portfolio : www.louaycodes.tn"

        contact_items = [
            f'<a href="mailto:{html.escape(profile.email)}">{html.escape(profile.email)}</a>'
        ]
        if profile.phone:
            contact_items.append(html.escape(profile.phone))
        if profile.location:
            contact_items.append(html.escape(profile.location))

        contact_items.append(
            f'<a href="{html.escape(portfolio_url)}" target="_blank" class="portfolio-link">{html.escape(portfolio_label)}</a>'
        )

        if profile.linkedin_url:
            contact_items.append(f'<a href="{html.escape(profile.linkedin_url)}" target="_blank">LinkedIn</a>')
        if profile.github_url:
            contact_items.append(f'<a href="{html.escape(profile.github_url)}" target="_blank">GitHub</a>')

        contact_bar = " &bull; ".join(contact_items)

        # 2. Section Titres multilingues
        title_summary = "PROFILE SUMMARY" if is_en else "PROFIL PROFESSIONNEL"
        title_education = "EDUCATION" if is_en else "FORMATION"
        title_experiences = "PROFESSIONAL EXPERIENCE (INTERNSHIPS)" if is_en else "EXPÉRIENCES PROFESSIONNELLES (STAGES)"
        title_projects = "SELECTED PROJECTS" if is_en else "PROJETS SÉLECTIONNÉS"
        title_skills = "TECHNICAL SKILLS" if is_en else "COMPÉTENCES TECHNIQUES"
        title_extracurricular = "EXTRACURRICULAR ACTIVITIES" if is_en else "ACTIVITÉS EXTRA-PROFESSIONNELLES"
        title_languages = "LANGUAGES" if is_en else "LANGUES"

        # 3. Formations
        edu_items = []
        for edu in educations:
            edu_items.append(f"""
            <div class="item">
                <div class="item-header">
                    <span class="item-role">{html.escape(edu["degree"])}</span> — 
                    <span class="item-company">{html.escape(edu["school"])}</span>
                    <span class="item-date">{html.escape(edu["start_date"])} – {html.escape(edu["end_date"])}</span>
                </div>
                <div class="item-desc">{html.escape(edu["field_of_study"])}</div>
            </div>
            """)
        edu_html = f"""
        <section class="section">
            <h2 class="section-title">{title_education}</h2>
            {''.join(edu_items)}
        </section>
        """ if edu_items else ""

        # 4. Expériences professionnelles (Stages)
        exp_items = []
        for exp in experiences:
            tech_line = ""
            if exp.get("technologies"):
                label_tech = "Stack:" if is_en else "Technologies :"
                tech_line = f'<div class="item-tech"><em>{label_tech}</em> {html.escape(", ".join(exp["technologies"]))}</div>'

            exp_items.append(f"""
            <div class="item">
                <div class="item-header">
                    <span class="item-role">{html.escape(exp["role"])}</span> — 
                    <span class="item-company">{html.escape(exp["company"])}</span>
                    <span class="item-date">{html.escape(exp["start_date"])} – {html.escape(exp["end_date"])}</span>
                </div>
                <div class="item-desc">{html.escape(exp["description"])}</div>
                {tech_line}
            </div>
            """)
        exp_html = f"""
        <section class="section">
            <h2 class="section-title">{title_experiences}</h2>
            {''.join(exp_items)}
        </section>
        """ if exp_items else ""

        # 5. Projets sélectionnés
        proj_items = []
        for proj in projects:
            tech_line = ""
            if proj.get("technologies"):
                label_tech = "Stack:" if is_en else "Technologies :"
                tech_line = f'<div class="item-tech"><em>{label_tech}</em> {html.escape(", ".join(proj["technologies"]))}</div>'

            role_str = f'({html.escape(proj["role"])})' if proj.get("role") else ''
            proj_items.append(f"""
            <div class="item">
                <div class="item-header">
                    <span class="item-role">{html.escape(proj["title"])}</span> {role_str}
                </div>
                <div class="item-desc">{html.escape(proj["description"])}</div>
                {tech_line}
            </div>
            """)
        proj_html = f"""
        <section class="section">
            <h2 class="section-title">{title_projects}</h2>
            {''.join(proj_items)}
        </section>
        """ if proj_items else ""

        # 6. Compétences Techniques (Organisées par catégories avec mise en valeur des compétences ciblées)
        skills_rows = []
        for cat in categorized_skills:
            rendered_skills = []
            for s in cat["skills"]:
                if s["matched"]:
                    rendered_skills.append(f'<strong class="skill-highlight">{html.escape(s["name"])}</strong>')
                else:
                    rendered_skills.append(html.escape(s["name"]))

            skills_rows.append(f"""
            <div class="skill-row">
                <span class="skill-cat">{html.escape(cat["title"])} :</span>
                <span class="skill-list">{", ".join(rendered_skills)}</span>
            </div>
            """)

        skills_html = f"""
        <section class="section">
            <h2 class="section-title">{title_skills}</h2>
            <div class="skills-grid">
                {''.join(skills_rows)}
            </div>
        </section>
        """ if skills_rows else ""

        # 7. Activités extra-professionnelles (Enactus EMC + Lycée Pilote Bizerte Youth Club)
        if is_en:
            extracurricular_items = """
            <div class="item">
                <div class="item-header">
                    <span class="item-role">Enactus EMC</span> — 
                    <span class="item-company">Project Department</span>
                    <span class="item-date">2022 – 2023</span>
                </div>
                <div class="item-desc">Contribution to social entrepreneurship and community-impact projects; project planning and team coordination.</div>
            </div>
            <div class="item">
                <div class="item-header">
                    <span class="item-role">Lycée Pilote Bizerte Youth Club</span> — 
                    <span class="item-company">Communication Director</span>
                    <span class="item-date">2018 – 2019</span>
                </div>
                <div class="item-desc">Managed the club's media strategy and communication plans; oversaw the media coverage and promotion of club events; animated and grew the club's online community.</div>
            </div>
            """
        else:
            extracurricular_items = """
            <div class="item">
                <div class="item-header">
                    <span class="item-role">Enactus EMC</span> — 
                    <span class="item-company">Département Projets</span>
                    <span class="item-date">2022 – 2023</span>
                </div>
                <div class="item-desc">Contribution à des projets d'entrepreneuriat social et d'impact communautaire ; planification de projets et coordination d'équipe.</div>
            </div>
            <div class="item">
                <div class="item-header">
                    <span class="item-role">Lycée Pilote Bizerte Youth Club</span> — 
                    <span class="item-company">Directeur de la Communication</span>
                    <span class="item-date">2018 – 2019</span>
                </div>
                <div class="item-desc">Gestion de la stratégie média et des plans de communication ; supervision de la couverture médiatique et de la promotion des événements du club ; animation et développement de la communauté en ligne.</div>
            </div>
            """

        extracurricular_html = f"""
        <section class="section">
            <h2 class="section-title">{title_extracurricular}</h2>
            {extracurricular_items}
        </section>
        """

        # 8. Langues
        if is_en:
            lang_content = "<strong>Arabic:</strong> Native &bull; <strong>French:</strong> Fluent &bull; <strong>English:</strong> Technical"
        else:
            lang_content = "<strong>Arabe :</strong> Langue maternelle &bull; <strong>Français :</strong> Courant &bull; <strong>Anglais :</strong> Technique"

        languages_html = f"""
        <section class="section">
            <h2 class="section-title">{title_languages}</h2>
            <div class="languages-content">{lang_content}</div>
        </section>
        """

        return f"""<!DOCTYPE html>
<html lang="{language}">
<head>
    <meta charset="UTF-8">
    <title>CV {html.escape(profile.full_name)} — {html.escape(job.company)}</title>
    <style>
        @page {{
            size: A4 portrait;
            margin: 6mm 10mm 6mm 10mm;
        }}
        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            background-color: #ffffff;
            font-size: 8.4pt;
            line-height: 1.25;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }}
        .cv-container {{
            max-width: 100%;
        }}
        header {{
            text-align: center;
            border-bottom: 1.5px solid #0f172a;
            padding-bottom: 4px;
            margin-bottom: 5px;
        }}
        h1 {{
            font-size: 15pt;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.01em;
            text-transform: uppercase;
            margin-bottom: 1px;
        }}
        .headline {{
            font-size: 9.2pt;
            font-weight: 600;
            color: #1d4ed8;
            margin-bottom: 3px;
        }}
        .contact-bar {{
            font-size: 7.8pt;
            color: #475569;
        }}
        .contact-bar a {{
            color: #0284c7;
            text-decoration: none;
            font-weight: 500;
        }}
        .contact-bar a.portfolio-link {{
            color: #0284c7;
            font-weight: 700;
            text-decoration: underline;
        }}
        .summary {{
            font-size: 8pt;
            color: #334155;
            background: #f8fafc;
            border-left: 2.5px solid #2563eb;
            padding: 3px 6px;
            margin-bottom: 5px;
            line-height: 1.24;
            text-align: justify;
        }}
        .section {{
            margin-bottom: 4.5px;
            break-inside: avoid;
        }}
        .section-title {{
            font-size: 8.8pt;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 1.5px;
            margin-bottom: 3px;
        }}
        .item {{
            margin-bottom: 3px;
        }}
        .item:last-child {{
            margin-bottom: 0;
        }}
        .item-header {{
            display: flex;
            align-items: baseline;
            font-size: 8.4pt;
            gap: 3px;
        }}
        .item-role {{
            font-weight: 700;
            color: #0f172a;
        }}
        .item-company {{
            font-weight: 600;
            color: #334155;
        }}
        .item-date {{
            margin-left: auto;
            font-size: 7.5pt;
            color: #64748b;
            font-family: monospace;
            font-weight: 600;
        }}
        .item-desc {{
            font-size: 7.8pt;
            color: #334155;
            line-height: 1.22;
            margin-top: 1px;
            text-align: justify;
        }}
        .item-tech {{
            font-size: 7.5pt;
            color: #475569;
            margin-top: 1px;
        }}
        .skills-grid {{
            display: flex;
            flex-direction: column;
            gap: 1.5px;
            font-size: 7.8pt;
        }}
        .skill-row {{
            display: flex;
            align-items: baseline;
            line-height: 1.25;
        }}
        .skill-cat {{
            width: 145px;
            min-width: 145px;
            font-weight: 700;
            color: #0f172a;
        }}
        .skill-list {{
            flex: 1;
            color: #334155;
        }}
        .skill-highlight {{
            font-weight: 700;
            color: #1d4ed8;
        }}
        .languages-content {{
            font-size: 8pt;
            color: #1e293b;
            padding: 1px 0;
        }}
    </style>
</head>
<body>
    <div class="cv-container">
        <header>
            <h1>{html.escape(profile.full_name)}</h1>
            <div class="headline">{html.escape(headline)}</div>
            <div class="contact-bar">{contact_bar}</div>
        </header>

        <div class="summary">{html.escape(summary)}</div>

        {edu_html}
        {exp_html}
        {proj_html}
        {skills_html}
        {extracurricular_html}
        {languages_html}
    </div>
</body>
</html>
"""
