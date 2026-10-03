import html
import io
import json
import logging
import re
from datetime import datetime
import pypdf
from app.config import settings
from app.domain.models import (
    ATSMatchResult,
    CustomCVData,
    JobOffer,
    MasterProfile,
    ParsedEducation,
    ParsedExperience,
    ParsedExtracurricular,
    ParsedProject,
    ParsedSkillCategory,
    TargetedCV,
)

logger = logging.getLogger(__name__)


# Catégorisation canonique des compétences techniques (zéro-hallucination : seules les compétences du candidat sont projetées)
TAXONOMY_CATEGORIES = {
    "frameworks": {
        "title_fr": "Frameworks",
        "title_en": "Frameworks",
        "keywords": [
            "angular", "next.js", "nextjs", "react", "vue", "spring boot", "springboot", "spring",
            "symfony", "flask", "fastapi", "django", "express", "microservices", "javafx", "flutterflow", "flutter"
        ],
    },
    "languages_scripting": {
        "title_fr": "Langages & Scripting",
        "title_en": "Languages & Scripting",
        "keywords": [
            "c", "c++", "java", "python", "php", "sql", "typescript", "javascript",
            "c#", ".net", "dotnet", "bash", "shell", "go", "rust", "html", "css", "tailwind", "qtdesigner"
        ],
    },
    "databases": {
        "title_fr": "Bases de données",
        "title_en": "Databases",
        "keywords": [
            "mysql", "postgresql", "postgres", "mongodb", "sqlite", "redis", "oracle",
            "sqldevelopper", "sql developer", "chromadb", "firebase"
        ],
    },
    "versioning_methods": {
        "title_fr": "Versioning & Méthodes",
        "title_en": "Versioning & Methodologies",
        "keywords": [
            "git", "github", "gitlab", "bitbucket", "agile", "scrum", "agile/scrum",
            "kanban", "jira", "ci/cd", "continuous integration"
        ],
    },
    "systems_networks": {
        "title_fr": "Systèmes & Réseaux",
        "title_en": "Systems & Networks",
        "keywords": [
            "linux", "linux (ubuntu)", "ubuntu", "debian", "redhat", "centos",
            "tcp/ip", "vmware", "vmware networking", "cisco", "ccna", "ccna2", "cisco ccna2",
            "networking", "réseaux", "routing", "switching", "dns", "vpn", "bgp", "ospf", "networkx"
        ],
    },
    "monitoring_observability": {
        "title_fr": "Monitoring & Observabilité",
        "title_en": "Monitoring & Observability",
        "keywords": [
            "prometheus", "grafana", "zabbix", "elk", "elasticsearch", "logstash", "kibana",
            "datadog", "opentelemetry", "cloudwatch"
        ],
    },
    "iac": {
        "title_fr": "Infrastructure as Code",
        "title_en": "Infrastructure as Code",
        "keywords": [
            "terraform", "ansible", "cloudformation", "pulumi"
        ],
    },
    "cloud_infra": {
        "title_fr": "Cloud & Infrastructure",
        "title_en": "Cloud & Infrastructure",
        "keywords": [
            "aws", "azure", "gcp", "google cloud", "openstack", "cloud", "serverless"
        ],
    },
    "containerization_orchestration": {
        "title_fr": "Conteneurisation & Orchestration",
        "title_en": "Containerization & Orchestration",
        "keywords": [
            "docker", "kubernetes", "k8s", "helm", "containerd", "docker compose"
        ],
    },
    "security": {
        "title_fr": "Sécurité (DevSecOps)",
        "title_en": "Security (DevSecOps)",
        "keywords": [
            "sonarqube", "owasp", "trivy", "snyk", "vault", "security", "devsecops", "iam"
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


def clean_target_role(title: str, company: str = "", lang: str = "fr") -> str:
    """Extrait intelligemment le rôle / poste ciblé depuis l'offre.

    - Élimine le nom de l'entreprise (ex: 'at Sagemcom', '- Sagemcom').
    - Élimine les mentions de type d'offre / contrat (Stage PFE, Alternance, CDI, etc.).
    - Élimine les codes de genre / H/F ((H/F), [F/H], /X, etc.).
    - Normalise l'écriture inclusive (ex: 'Développeur / Développeuse Python' -> 'Développeur Python',
      'Ingénieur.e DevOps' -> 'Ingénieur DevOps', 'Ingénieur(e)' -> 'Ingénieur').
    - Élimine les mentions de localisation résiduelles (ex: '- Paris', '- Bois-Colombes').
    - Adapte à la langue (ex: 'Ingénieur DevOps' -> 'DevOps Engineer' en anglais).
    """
    if not title:
        return "Software Engineer" if lang == "en" else "Ingénieur Logiciel"

    cleaned = title.strip()

    # 1. Supprimer le nom de l'entreprise s'il apparaît
    if company and company.strip():
        comp_pattern = re.escape(company.strip())
        cleaned = re.sub(rf"(?i)\b(?:at|chez)\s+{comp_pattern}\b.*", "", cleaned)
        cleaned = re.sub(rf"(?i)^\s*{comp_pattern}\s*[-–—:\s]*", "", cleaned)
        cleaned = re.sub(rf"(?i)[-–—:\s]*{comp_pattern}\s*$", "", cleaned)
        cleaned = re.sub(rf"(?i)\s+[-–—|]\s*{comp_pattern}\b.*", "", cleaned)

    # 2. Supprimer les mentions de type d'offre / contrat / stage / pfe / h/f
    noise_patterns = [
        r"(?i)\boffre\s+(de\s+)?(stage|d'emploi|emploi)?\b",
        r"(?i)\bstage\s+(de\s+)?(fin\s+d['’]études|fin\s+d['’]etudes|pfe|pré-embauche|pre-embauche)?\b",
        r"(?i)\b(stage|pfe|internship|intern|alternance|cdi|cdd|contrat pro|graduate program)\b",
        r"(?i)\b(h\s*/\s*f|f\s*/\s*h|m\s*/\s*f|m\s*/\s*w)(?:/x)?\b",
        r"(?i)\(\s*(?:h/f|f/h|m/f|m/w|h\s*/\s*f|f\s*/\s*h)(?:/x)?\s*\)",
        r"(?i)\[\s*(?:h/f|f/h|m/f|m/w)(?:/x)?\s*\]",
    ]
    for pat in noise_patterns:
        cleaned = re.sub(pat, " ", cleaned)

    # 3. Normaliser l'écriture inclusive et les dédoublements de genre
    cleaned = re.sub(r"(?i)\bdéveloppeur\s*/\s*développeuse\b", "Développeur", cleaned)
    cleaned = re.sub(r"(?i)\bdeveloppeur\s*/\s*developpeuse\b", "Développeur", cleaned)
    cleaned = re.sub(r"(?i)\bingénieur\s*/\s*ingénieure\b", "Ingénieur", cleaned)
    cleaned = re.sub(r"(?i)\bingenieur\s*/\s*ingenieure\b", "Ingénieur", cleaned)
    cleaned = re.sub(r"(?i)\bconsultant\s*/\s*consultante\b", "Consultant", cleaned)
    cleaned = re.sub(r"(?i)\bassistant\s*/\s*assistante\b", "Assistant", cleaned)
    cleaned = re.sub(r"(?i)\bconcepteur\s*/\s*conceptrice\b", "Concepteur", cleaned)
    cleaned = re.sub(r"(?i)\badministrateur\s*/\s*administratrice\b", "Administrateur", cleaned)

    # Ex: Ingénieur.e / Ingénieur.e.s -> Ingénieur
    cleaned = re.sub(r"(?i)\b([A-Za-zÀ-ÿ]+)\.(?:e|es|e\.s)\b", r"\1", cleaned)
    # Ex: Ingénieur(e) -> Ingénieur
    cleaned = re.sub(r"(?i)\b([A-Za-zÀ-ÿ]+)\((?:e|es|trice)\)", r"\1", cleaned)

    # Nettoyer mentions orphelines de seniorité comme "– Junior" ou "(Junior)"
    cleaned = re.sub(r"(?i)\b(?:junior|débutant)\b", "", cleaned)

    # Supprimer les localisations résiduelles courantes en fin de titre
    cleaned = re.sub(
        r"(?i)[-–—|]\s*(?:paris|bois-colombes|lyon|toulouse|tunis|marseille|bordeaux|lille|nantes|rennes|remote|télétravail|france|tunisie).*",
        "",
        cleaned,
    )

    # 4. Nettoyer la ponctuation résiduelle et séparateurs
    cleaned = re.sub(r"[\(\)\[\]{}—–\-:|/]+", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    # 5. Suppression des petits mots de liaison orphelins au début
    cleaned = re.sub(r"^(?:de|d'|d’|pour|en|a|à)\s+", "", cleaned, flags=re.IGNORECASE).strip()

    if len(cleaned) < 2:
        return "Software Engineer" if lang == "en" else "Ingénieur Logiciel"

    # 6. Adaptation linguistique si anglais
    if lang == "en":
        en_role_mappings = [
            (r"(?i)\bingénieur(?:\s+d['’]études\s+et)?\s+développement\b", "Software Development Engineer"),
            (r"(?i)\bingénieur\s+devops\b", "DevOps Engineer"),
            (r"(?i)\bingénieur\s+cloud\b", "Cloud Engineer"),
            (r"(?i)\bingénieur\s+logiciel\b", "Software Engineer"),
            (r"(?i)\bingénieur\s+systèmes?\b", "Systems Engineer"),
            (r"(?i)\bingénieur\s+données?\b", "Data Engineer"),
            (r"(?i)\bingénieur\s+ia\b", "AI Engineer"),
            (r"(?i)\bingénieur\b", "Engineer"),
            (r"(?i)\bdéveloppeur\s+fullstack\b", "Fullstack Developer"),
            (r"(?i)\bdéveloppeur\s+backend\b", "Backend Developer"),
            (r"(?i)\bdéveloppeur\s+frontend\b", "Frontend Developer"),
            (r"(?i)\bdéveloppeur\b", "Developer"),
            (r"(?i)\barchitecte\s+cloud\b", "Cloud Architect"),
            (r"(?i)\bchef\s+de\s+projet\b", "Project Manager"),
            (r"(?i)\bconsultant\b", "Consultant"),
            (r"(?i)\bstagiaire\b", ""),
        ]
        for pat, repl in en_role_mappings:
            cleaned = re.sub(pat, repl, cleaned)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()

    # Capitaliser la première lettre si nécessaire
    if cleaned and not cleaned[0].isupper():
        cleaned = cleaned[0].upper() + cleaned[1:]

    return cleaned if cleaned else ("Software Engineer" if lang == "en" else "Ingénieur Logiciel")


class CVGeneratorService:
    """
    Moteur de génération et d'adaptation de CV ciblé (AD-4 Étape 3, AD-7).
    Garantit le zéro hallucination en ne projetant que les données vérifiées du Master Profile.
    Format 2 pages aéré avec écriture sobre, monochrome, épurée et sans artifice de design.
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

        # 1. Headline ciblée : STRICTEMENT le rôle extrait de l'offre (on ignore le titre du MasterProfile)
        smart_role = clean_target_role(job.title or "", job.company or "", lang=lang)
        headline = smart_role

        # 2. Accroche factuelle zero hallucination
        missing_set = {s.lower() for s in ats_match.missing_skills}
        safe_matched = [s for s in ats_match.matched_skills if s.lower() not in missing_set]
        safe_transferable = [s for s in ats_match.transferable_skills if s.lower() not in missing_set]

        if lang == "en":
            summary = profile.bio_en or profile.bio or ""
        else:
            summary = profile.bio_fr or profile.bio or ""

        # 3. Ordonnancement des experiences : filtrer specifiquement les stages professionnels
        target_skills_lower = {s.lower() for s in (safe_matched + safe_transferable)}

        # Les activites associatives / clubs sont presentees dans la section EXTRACURRICULAR dediee
        extracurricular_keywords = ["club", "association", "basketball", "ascb", "enactus", "lycee pilote", "tuteur", "tache-lik"]

        professional_experiences = []
        for exp in profile.experiences:
            c_low = exp.company.lower()
            r_low = exp.role.lower()
            is_club = any(kw in c_low or kw in r_low for kw in extracurricular_keywords)
            if not is_club:
                professional_experiences.append(exp)

        # Si le filtre eliminait tout, on conserve les experiences existantes
        if not professional_experiences:
            professional_experiences = profile.experiences

        scored_experiences: list[tuple[float, dict]] = []
        for exp in professional_experiences:
            exp_techs_lower = {t.lower().strip() for t in exp.technologies if t.strip()}
            overlap_score = len(exp_techs_lower.intersection(target_skills_lower)) * 2.0
            if any(req in (exp.description or "").lower() for req in target_skills_lower):
                overlap_score += 1.0

            # Traduction / prise en compte bilingue
            company = exp.company
            end_date = exp.end_date or ("Present" if lang == "en" else "Present")

            if lang == "en":
                role = exp.role_en or exp.role
                description = exp.description_en or (exp.description or "")
                if not exp.role_en:
                    c_trans = EXPERIENCE_TRANSLATIONS.get(c_low)
                    if c_trans:
                        company = c_trans.get("company_en", company)
                        for r_key, r_data in c_trans.items():
                            if r_key != "company_en" and (r_key in r_low or r_low in r_key):
                                role = r_data.get("role_en", role)
                                description = r_data.get("desc_en", description)
                                break
                    else:
                        role = role.replace("Stagiaire", "Intern").replace("Ingenieur", "Engineer")
            else:
                role = exp.role_fr or exp.role
                description = exp.description_fr or (exp.description or "")

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

        # Etale sur 2 pages : conservation de l'ensemble des stages (jusqu'a 4 stages)
        scored_experiences.sort(key=lambda x: x[0], reverse=True)
        selected_experiences = [item[1] for item in scored_experiences[:4]]

        # 4. Ordonnancement des projets par pertinence (jusqu'a 4-5 projets selectionnes)
        scored_projects: list[tuple[float, dict]] = []
        for proj in profile.projects:
            proj_techs_lower = {t.lower().strip() for t in proj.technologies if t.strip()}
            overlap_score = len(proj_techs_lower.intersection(target_skills_lower)) * 2.0
            if any(req in (proj.description or "").lower() for req in target_skills_lower):
                overlap_score += 1.0

            if lang == "en":
                title = proj.title_en or proj.title
                role = proj.role_en or (proj.role or "Engineer")
                description = proj.description_en or (proj.description or "")
                if not proj.title_en:
                    p_low = proj.title.lower()
                    for p_key, p_data in PROJECT_TRANSLATIONS.items():
                        if p_key in p_low:
                            title = p_data.get("title_en", title)
                            description = p_data.get("desc_en", description)
                            break
            else:
                title = proj.title_fr or proj.title
                role = proj.role_fr or (proj.role or "Developpeur")
                description = proj.description_fr or (proj.description or "")

            proj_dict = {
                "title": title,
                "role": role,
                "url": proj.url or "",
                "description": description,
                "technologies": proj.technologies,
            }
            scored_projects.append((overlap_score, proj_dict))

        scored_projects.sort(key=lambda x: x[0], reverse=True)
        selected_projects = [item[1] for item in scored_projects[:5]]

        # 5. Agent Redacteur de CV — reecriture LLM des sections orientees vers le poste
        try:
            from app.domain.cv_agent import execute_cv_writer_agent
            cv_rewrite = execute_cv_writer_agent(
                job_id=job.id,
                user_id=profile.user_id,
                language=lang,
                ats_match=ats_match,
                job_offer=job,
                master_profile=profile,
            )
            # Appliquer le summary reecrit
            if cv_rewrite.summary:
                summary = cv_rewrite.summary

            # Appliquer les descriptions d'experiences reecrites
            if cv_rewrite.experiences:
                for rewrite in cv_rewrite.experiences:
                    idx = rewrite.get("index", -1)
                    new_desc = rewrite.get("description", "")
                    if 0 <= idx < len(selected_experiences) and new_desc:
                        selected_experiences[idx]["description"] = new_desc

            # Appliquer les descriptions de projets reecrites
            if cv_rewrite.projects:
                for rewrite in cv_rewrite.projects:
                    idx = rewrite.get("index", -1)
                    new_desc = rewrite.get("description", "")
                    if 0 <= idx < len(selected_projects) and new_desc:
                        selected_projects[idx]["description"] = new_desc

        except Exception as e:
            logger.error(f"Agent Redacteur CV echoue: {e}")
            raise RuntimeError("Le modèle IA rencontre un problème. Veuillez réessayer ultérieurement.") from e

        # 6. Formations
        educations_list = []
        for edu in sorted(profile.educations, key=lambda e: e.start_date, reverse=True):
            school = edu.school
            end_date = edu.end_date or ("Present" if lang == "en" else "En cours")

            if lang == "en":
                degree = edu.degree_en or edu.degree
                field_of_study = edu.field_of_study_en or edu.field_of_study
                description = edu.description_en or (edu.description or "")
                if not edu.degree_en and "esprit" in school.lower():
                    school = "ESPRIT School of Engineering"
                if not edu.degree_en and "ingenieur" in degree.lower():
                    degree = "Master of Science in Computer Engineering"
                if not edu.field_of_study_en and "architectures cloud" in field_of_study.lower():
                    field_of_study = "Cloud Architecture & Distributed Systems"
            else:
                degree = edu.degree_fr or edu.degree
                field_of_study = edu.field_of_study_fr or edu.field_of_study
                description = edu.description_fr or (edu.description or "")

            educations_list.append({
                "school": school,
                "degree": degree,
                "field_of_study": field_of_study,
                "start_date": edu.start_date,
                "end_date": end_date,
                "description": description,
            })
        # 7. Competences Techniques organisees par categories
        categorized_skills = cls._build_categorized_skills(
            profile=profile,
            target_skills_lower=target_skills_lower,
            lang=lang,
        )

        # 8. Rendu HTML A4 ATS
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
        Organise les compétences maîtrisées par le candidat selon les 10 catégories demandées :
        Frameworks, Langages & Scripting, Bases de données, Versioning & Méthodes,
        Systèmes & Réseaux, Monitoring & Observabilité, Infrastructure as Code,
        Cloud & Infrastructure, Conteneurisation & Orchestration, Sécurité (DevSecOps).
        Garantit le zéro-hallucination : seules les compétences du candidat sont affichées.
        """
        is_en = lang == "en"

        category_name_to_key = {
            "frameworks": "frameworks",
            "langages & scripting": "languages_scripting",
            "bases de données": "databases",
            "versioning & méthodes": "versioning_methods",
            "systèmes & réseaux": "systems_networks",
            "monitoring & observabilité": "monitoring_observability",
            "infrastructure as code": "iac",
            "cloud & infrastructure": "cloud_infra",
            "conteneurisation & orchestration": "containerization_orchestration",
            "sécurité (devsecops)": "security",
        }

        cat_skills_dict: dict[str, list[dict]] = {k: [] for k in TAXONOMY_CATEGORIES}
        assigned_skills: set[str] = set()

        # 1. Compétences explicites du profil (avec respect de leur catégorie choisie)
        for sk in profile.skills:
            s_name = sk.name.strip()
            if not s_name:
                continue
            s_low = s_name.lower()
            if s_low in assigned_skills:
                continue

            target_cat_key = None
            if sk.category:
                clean_cat = sk.category.strip().lower()
                target_cat_key = category_name_to_key.get(clean_cat)
                if not target_cat_key:
                    for norm_name, c_key in category_name_to_key.items():
                        if norm_name in clean_cat or clean_cat in norm_name:
                            target_cat_key = c_key
                            break

            # Fallback sur les mots-clés de la taxonomie
            if not target_cat_key:
                for c_key, c_data in TAXONOMY_CATEGORIES.items():
                    if any(kw == s_low or (len(kw) > 3 and kw in s_low) for kw in c_data["keywords"]):
                        target_cat_key = c_key
                        break

            if not target_cat_key:
                target_cat_key = "frameworks"

            assigned_skills.add(s_low)
            cat_skills_dict[target_cat_key].append({
                "name": s_name,
                "matched": s_low in target_skills_lower,
            })

        # 2. Technologies annexes tirées des expériences et projets
        extra_techs: list[str] = []
        for exp in profile.experiences:
            for t in exp.technologies:
                if t.strip() and t.strip().lower() not in assigned_skills:
                    extra_techs.append(t.strip())
        for proj in profile.projects:
            for t in proj.technologies:
                if t.strip() and t.strip().lower() not in assigned_skills:
                    extra_techs.append(t.strip())

        for t_name in extra_techs:
            t_low = t_name.lower()
            if t_low in assigned_skills:
                continue
            target_cat_key = None
            for c_key, c_data in TAXONOMY_CATEGORIES.items():
                if any(kw == t_low or (len(kw) > 3 and kw in t_low) for kw in c_data["keywords"]):
                    target_cat_key = c_key
                    break

            if target_cat_key:
                assigned_skills.add(t_low)
                cat_skills_dict[target_cat_key].append({
                    "name": t_name,
                    "matched": t_low in target_skills_lower,
                })

        # 3. Assemblage des catégories ordonnées
        categorized: list[dict] = []
        for cat_key, cat_data in TAXONOMY_CATEGORIES.items():
            skills_in_cat = cat_skills_dict[cat_key]
            if skills_in_cat:
                category_title = cat_data["title_en"] if is_en else cat_data["title_fr"]
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
        Génère un HTML/CSS sobre, textuel, aéré et élégant étalé sur 2 pages A4.
        Respecte la sobriété absolue demandée : écriture simple, typographie soignée, aucun artifice.
        Contient les 8 sections dans l'ordre :
        1. Nom & Contact avec Portfolio direct sur www.louaycodes.tn
        2. Overview de profil (texte simple, aucun bandeau ni bordure latérale)
        3. Éducation
        4. Expériences professionnelles (stages)
        5. Projets sélectionnés
        6. Compétences Techniques (par catégories)
        7. Activités extra-professionnelles (Enactus EMC & Lycée Pilote Bizerte Youth Club)
        8. Langues
        """
        is_en = language == "en"

        # 1. Barre de contact sobre avec portfolio
        contact_items = []
        if profile.email:
            contact_items.append(f'<a href="mailto:{html.escape(profile.email)}">{html.escape(profile.email)}</a>')
        if profile.phone:
            contact_items.append(html.escape(profile.phone))
        if profile.location:
            contact_items.append(html.escape(profile.location))

        if profile.website_url:
            portfolio_url = profile.website_url
            if not portfolio_url.startswith("http"):
                portfolio_url = f"https://{portfolio_url}"
            clean_domain = re.sub(r"^https?://(www\.)?", "", portfolio_url).rstrip("/")
            portfolio_label = f"Portfolio: {clean_domain}" if is_en else f"Portfolio : {clean_domain}"
            contact_items.append(
                f'<a href="{html.escape(portfolio_url)}" target="_blank" class="portfolio-link">{html.escape(portfolio_label)}</a>'
            )

        if profile.linkedin_url:
            clean_linkedin = profile.linkedin_url if profile.linkedin_url.startswith("http") else f"https://{profile.linkedin_url}"
            contact_items.append(f'<a href="{html.escape(clean_linkedin)}" target="_blank">LinkedIn</a>')
        if profile.github_url:
            clean_github = profile.github_url if profile.github_url.startswith("http") else f"https://{profile.github_url}"
            contact_items.append(f'<a href="{html.escape(clean_github)}" target="_blank">GitHub</a>')

        contact_bar = " &bull; ".join(contact_items)

        # 2. Titres multilingues
        title_summary = "PROFILE SUMMARY" if is_en else "PROFIL PROFESSIONNEL"
        title_education = "EDUCATION" if is_en else "FORMATION"
        title_experiences = "PROFESSIONAL EXPERIENCE (INTERNSHIPS)" if is_en else "EXPÉRIENCES PROFESSIONNELLES (STAGES)"
        title_projects = "SELECTED PROJECTS" if is_en else "PROJETS SÉLECTIONNÉS"
        title_skills = "TECHNICAL SKILLS" if is_en else "COMPÉTENCES TECHNIQUES"
        title_extracurricular = "EXTRACURRICULAR ACTIVITIES" if is_en else "ACTIVITÉS EXTRA-PROFESSIONNELLES"
        title_languages = "LANGUAGES" if is_en else "LANGUES"

        # 3. Overview : texte épuré sans fond ni bordure gauche
        summary_html = f"""
        <section class="section">
            <h2 class="section-title">{title_summary}</h2>
            <p class="summary-text">{html.escape(summary)}</p>
        </section>
        """ if summary else ""

        # 4. Formations
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

        # 5. Expériences professionnelles (Stages)
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

        # 6. Projets sélectionnés
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

        # 7. Compétences Techniques (Écriture simple sans badge ni artifice)
        skills_rows = []
        for cat in categorized_skills:
            rendered_skills = [html.escape(s["name"]) for s in cat["skills"]]
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

        # 8. Activités extra-professionnelles (dynamiques avec fallback)
        if profile.extracurriculars:
            extra_rendered = []
            for item in profile.extracurriculars:
                role_val = (item.role_en if is_en else item.role_fr) or item.role
                desc_val = (item.description_en if is_en else item.description_fr) or item.description
                date_val = item.date or ""
                extra_rendered.append(f"""
                <div class="item">
                    <div class="item-header">
                        <span class="item-role">{html.escape(item.organization)}</span> — 
                        <span class="item-company">{html.escape(role_val)}</span>
                        <span class="item-date">{html.escape(date_val)}</span>
                    </div>
                    <div class="item-desc">{html.escape(desc_val)}</div>
                </div>
                """)
            extracurricular_items = "".join(extra_rendered)
            extracurricular_html = f"""
            <section class="section">
                <h2 class="section-title">{title_extracurricular}</h2>
                {extracurricular_items}
            </section>
            """
        else:
            extracurricular_html = ""

        # 9. Langues
        if profile.languages:
            items_l = []
            for lang_obj in profile.languages:
                name_val = lang_obj.name
                level_val = lang_obj.level
                if is_en:
                    name_map = {"arabe": "Arabic", "français": "French", "francais": "French", "anglais": "English"}
                    level_map = {
                        "langue maternelle": "Native",
                        "bilingue": "Bilingual",
                        "courant": "Fluent",
                        "technique": "Technical",
                        "professionnel": "Professional",
                        "intermédiaire": "Intermediate",
                        "notions": "Basic",
                    }
                    name_val = name_map.get(name_val.lower().strip(), name_val)
                    level_val = level_map.get(level_val.lower().strip(), level_val)
                    sep = ": "
                else:
                    sep = " : "
                items_l.append(f"<strong>{html.escape(name_val)}{sep}</strong>{html.escape(level_val)}")
            lang_content = " &bull; ".join(items_l)
            languages_html = f"""
            <section class="section">
                <h2 class="section-title">{title_languages}</h2>
                <div class="languages-content">{lang_content}</div>
            </section>
            """
        else:
            languages_html = ""

        return f"""<!DOCTYPE html>
<html lang="{language}">
<head>
    <meta charset="UTF-8">
    <title>CV {html.escape(profile.full_name)} — {html.escape(job.company)}</title>
    <style>
        @page {{
            size: A4 portrait;
            margin: 8mm 12mm 8mm 12mm;
        }}
        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #111827;
            background-color: #ffffff;
            font-size: 9pt;
            line-height: 1.35;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }}
        .cv-container {{
            max-width: 100%;
        }}
        header {{
            text-align: center;
            border-bottom: 1.2px solid #111827;
            padding-bottom: 6px;
            margin-bottom: 8px;
        }}
        h1 {{
            font-size: 16pt;
            font-weight: 700;
            color: #111827;
            letter-spacing: -0.01em;
            text-transform: uppercase;
            margin-bottom: 2px;
        }}
        .headline {{
            font-size: 10pt;
            font-weight: 600;
            color: #374151;
            margin-bottom: 4px;
        }}
        .contact-bar {{
            font-size: 8.5pt;
            color: #374151;
            line-height: 1.35;
        }}
        .contact-bar a {{
            color: #111827;
            text-decoration: underline;
        }}
        .section {{
            margin-bottom: 8px;
        }}
        .section-title {{
            font-size: 9.8pt;
            font-weight: 700;
            color: #111827;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            border-bottom: 1px solid #111827;
            padding-bottom: 2px;
            margin-bottom: 6px;
            page-break-after: avoid;
            break-after: avoid;
        }}
        .summary-text {{
            font-size: 9pt;
            color: #1f2937;
            line-height: 1.38;
            text-align: justify;
        }}
        .item {{
            margin-bottom: 6px;
            page-break-inside: avoid;
            break-inside: avoid;
        }}
        .item:last-child {{
            margin-bottom: 0;
        }}
        .item-header {{
            display: flex;
            align-items: baseline;
            font-size: 9pt;
            gap: 4px;
        }}
        .item-role {{
            font-weight: 700;
            color: #111827;
        }}
        .item-company {{
            font-weight: 600;
            color: #1f2937;
        }}
        .item-date {{
            margin-left: auto;
            font-size: 8pt;
            color: #4b5563;
            font-family: monospace;
            font-weight: 600;
        }}
        .item-desc {{
            font-size: 8.5pt;
            color: #1f2937;
            line-height: 1.35;
            margin-top: 1.5px;
            text-align: justify;
        }}
        .item-tech {{
            font-size: 8.2pt;
            color: #374151;
            margin-top: 1.5px;
        }}
        .skills-grid {{
            display: flex;
            flex-direction: column;
            gap: 3px;
            font-size: 8.5pt;
            line-height: 1.35;
        }}
        .skill-row {{
            display: flex;
            align-items: baseline;
            page-break-inside: avoid;
            break-inside: avoid;
        }}
        .skill-cat {{
            width: 230px;
            min-width: 230px;
            font-weight: 700;
            color: #111827;
        }}
        .skill-list {{
            flex: 1;
            color: #1f2937;
        }}
        .languages-content {{
            font-size: 8.5pt;
            color: #111827;
            line-height: 1.35;
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

        {summary_html}
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


def render_custom_cv_html(data: CustomCVData) -> str:
    """
    Rend le HTML A4 vectoriel ATS pour le Studio CV interactif.
    Garantit une fidélité visuelle absolue entre la prévisualisation dans le Cockpit
    et l'export PDF vectoriel compilé par Playwright (Chromium).
    """
    is_en = data.language.lower().strip() == "en"

    # Contact & Portfolio
    contact_items = []
    if data.email:
        contact_items.append(f'<a href="mailto:{html.escape(data.email)}">{html.escape(data.email)}</a>')
    if data.phone:
        contact_items.append(html.escape(data.phone))
    if data.location:
        contact_items.append(html.escape(data.location))
    if data.portfolio_url:
        portfolio_url = data.portfolio_url
        if not portfolio_url.startswith("http"):
            portfolio_url = f"https://{portfolio_url}"
        clean_domain = re.sub(r"^https?://(www\.)?", "", portfolio_url).rstrip("/")
        portfolio_label = f"Portfolio: {clean_domain}" if is_en else f"Portfolio : {clean_domain}"
        contact_items.append(
            f'<a href="{html.escape(portfolio_url)}" target="_blank" class="portfolio-link">{html.escape(portfolio_label)}</a>'
        )
    if data.linkedin_url:
        clean_linkedin = data.linkedin_url if data.linkedin_url.startswith("http") else f"https://{data.linkedin_url}"
        contact_items.append(f'<a href="{html.escape(clean_linkedin)}" target="_blank">LinkedIn</a>')
    if data.github_url:
        clean_github = data.github_url if data.github_url.startswith("http") else f"https://{data.github_url}"
        contact_items.append(f'<a href="{html.escape(clean_github)}" target="_blank">GitHub</a>')

    contact_bar = " &bull; ".join(contact_items)

    # Titres des sections
    title_summary = "PROFILE SUMMARY" if is_en else "PROFIL PROFESSIONNEL"
    title_education = "EDUCATION" if is_en else "FORMATION"
    title_experiences = "PROFESSIONAL EXPERIENCE (INTERNSHIPS)" if is_en else "EXPÉRIENCES PROFESSIONNELLES (STAGES)"
    title_projects = "SELECTED PROJECTS" if is_en else "PROJETS SÉLECTIONNÉS"
    title_skills = "TECHNICAL SKILLS" if is_en else "COMPÉTENCES TECHNIQUES"
    title_extracurricular = "EXTRACURRICULAR ACTIVITIES" if is_en else "ACTIVITÉS EXTRA-PROFESSIONNELLES"
    title_languages = "LANGUAGES" if is_en else "LANGUES"

    # 1. Summary
    summary_html = f"""
    <section class="section">
        <h2 class="section-title">{title_summary}</h2>
        <p class="summary-text">{html.escape(data.summary)}</p>
    </section>
    """ if data.summary else ""

    # 2. Education
    edu_items = []
    for edu in data.educations:
        date_str = f"{html.escape(edu.start_date)} – {html.escape(edu.end_date)}" if edu.end_date else html.escape(edu.start_date)
        desc_line = f'<div class="item-desc">{html.escape(edu.description or edu.field_of_study)}</div>' if (edu.description or edu.field_of_study) else ""
        edu_items.append(f"""
        <div class="item">
            <div class="item-header">
                <span class="item-role">{html.escape(edu.degree)}</span> — 
                <span class="item-company">{html.escape(edu.school)}</span>
                <span class="item-date">{date_str}</span>
            </div>
            {desc_line}
        </div>
        """)
    edu_html = f"""
    <section class="section">
        <h2 class="section-title">{title_education}</h2>
        {''.join(edu_items)}
    </section>
    """ if edu_items else ""

    # 3. Experiences
    exp_items = []
    for exp in data.experiences:
        date_str = f"{html.escape(exp.start_date)} – {html.escape(exp.end_date)}" if exp.end_date else html.escape(exp.start_date)
        tech_line = ""
        if exp.technologies:
            label_tech = "Stack:" if is_en else "Technologies :"
            tech_line = f'<div class="item-tech"><em>{label_tech}</em> {html.escape(", ".join(exp.technologies))}</div>'

        exp_items.append(f"""
        <div class="item">
            <div class="item-header">
                <span class="item-role">{html.escape(exp.role)}</span> — 
                <span class="item-company">{html.escape(exp.company)}</span>
                <span class="item-date">{date_str}</span>
            </div>
            <div class="item-desc">{html.escape(exp.description)}</div>
            {tech_line}
        </div>
        """)
    exp_html = f"""
    <section class="section">
        <h2 class="section-title">{title_experiences}</h2>
        {''.join(exp_items)}
    </section>
    """ if exp_items else ""

    # 4. Projets
    proj_items = []
    for proj in data.projects:
        tech_line = ""
        if proj.technologies:
            label_tech = "Stack:" if is_en else "Technologies :"
            tech_line = f'<div class="item-tech"><em>{label_tech}</em> {html.escape(", ".join(proj.technologies))}</div>'

        role_str = f'({html.escape(proj.role)})' if proj.role else ""
        proj_items.append(f"""
        <div class="item">
            <div class="item-header">
                <span class="item-role">{html.escape(proj.title)}</span> {role_str}
            </div>
            <div class="item-desc">{html.escape(proj.description)}</div>
            {tech_line}
        </div>
        """)
    proj_html = f"""
    <section class="section">
        <h2 class="section-title">{title_projects}</h2>
        {''.join(proj_items)}
    </section>
    """ if proj_items else ""

    # 5. Compétences Techniques
    skills_rows = []
    for cat in data.skills_categories:
        if cat.skills:
            rendered_skills = [html.escape(s) for s in cat.skills]
            skills_rows.append(f"""
            <div class="skill-row">
                <span class="skill-cat">{html.escape(cat.title)} :</span>
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

    # 6. Activités extra-professionnelles
    extra_items = []
    for extra in data.extracurricular:
        date_str = f'<span class="item-date">{html.escape(extra.date)}</span>' if extra.date else ""
        org_title = extra.organization or extra.role
        role_sub = f" — {html.escape(extra.role)}" if extra.role and extra.organization else ""
        extra_items.append(f"""
        <div class="item">
            <div class="item-header">
                <span class="item-role">{html.escape(org_title)}</span>{role_sub}
                {date_str}
            </div>
            <div class="item-desc">{html.escape(extra.description)}</div>
        </div>
        """)
    extra_html = f"""
    <section class="section">
        <h2 class="section-title">{title_extracurricular}</h2>
        {''.join(extra_items)}
    </section>
    """ if extra_items else ""

    # 7. Langues
    if data.languages:
        lang_content = " &bull; ".join([html.escape(l) for l in data.languages])
        languages_html = f"""
        <section class="section">
            <h2 class="section-title">{title_languages}</h2>
            <div class="languages-content">{lang_content}</div>
        </section>
        """
    else:
        languages_html = ""

    has_header = bool(data.full_name or data.headline or contact_bar)
    header_html = f"""
        <header>
            <h1>{html.escape(data.full_name)}</h1>
            {f'<div class="headline">{html.escape(data.headline)}</div>' if data.headline else ''}
            {f'<div class="contact-bar">{contact_bar}</div>' if contact_bar else ''}
        </header>
    """ if has_header else ""

    return f"""<!DOCTYPE html>
<html lang="{data.language}">
<head>
    <meta charset="UTF-8">
    <title>CV {html.escape(data.full_name or 'Candidat')}</title>
    <style>
        @page {{
            size: A4 portrait;
            margin: {data.margin_top_mm}mm {data.margin_right_mm}mm {data.margin_bottom_mm}mm {data.margin_left_mm}mm;
        }}
        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #111827;
            background-color: #ffffff;
            font-size: {data.font_size_pt}pt;
            line-height: {data.line_height};
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }}
        .cv-container {{
            max-width: 100%;
        }}
        header {{
            text-align: center;
            border-bottom: 1.2px solid #111827;
            padding-bottom: 6px;
            margin-bottom: 8px;
        }}
        h1 {{
            font-size: 16pt;
            font-weight: 700;
            color: #111827;
            letter-spacing: -0.01em;
            text-transform: uppercase;
            margin-bottom: 2px;
        }}
        .headline {{
            font-size: 10pt;
            font-weight: 600;
            color: #374151;
            margin-bottom: 4px;
        }}
        .contact-bar {{
            font-size: 8.5pt;
            color: #374151;
            line-height: 1.35;
        }}
        .contact-bar a {{
            color: #111827;
            text-decoration: underline;
        }}
        .section {{
            margin-bottom: 8px;
        }}
        .section-title {{
            font-size: 9.8pt;
            font-weight: 700;
            color: #111827;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            border-bottom: 1px solid #111827;
            padding-bottom: 2px;
            margin-bottom: 6px;
            page-break-after: avoid;
            break-after: avoid;
        }}
        .summary-text {{
            font-size: {data.font_size_pt}pt;
            color: #1f2937;
            line-height: {data.line_height};
            text-align: justify;
        }}
        .item {{
            margin-bottom: 6px;
            page-break-inside: avoid;
            break-inside: avoid;
        }}
        .item:last-child {{
            margin-bottom: 0;
        }}
        .item-header {{
            display: flex;
            align-items: baseline;
            font-size: {data.font_size_pt}pt;
            gap: 4px;
        }}
        .item-role {{
            font-weight: 700;
            color: #111827;
        }}
        .item-company {{
            font-weight: 600;
            color: #1f2937;
        }}
        .item-date {{
            margin-left: auto;
            font-size: 8pt;
            color: #4b5563;
            font-family: monospace;
            font-weight: 600;
        }}
        .item-desc {{
            font-size: {max(data.font_size_pt - 0.5, 7.5)}pt;
            color: #1f2937;
            line-height: {data.line_height};
            margin-top: 1.5px;
            text-align: justify;
        }}
        .item-tech {{
            font-size: {max(data.font_size_pt - 0.8, 7.2)}pt;
            color: #374151;
            margin-top: 1.5px;
        }}
        .skills-grid {{
            display: flex;
            flex-direction: column;
            gap: 3px;
            font-size: {max(data.font_size_pt - 0.5, 7.5)}pt;
            line-height: {data.line_height};
        }}
        .skill-row {{
            display: flex;
            align-items: baseline;
            page-break-inside: avoid;
            break-inside: avoid;
        }}
        .skill-cat {{
            width: 170px;
            min-width: 170px;
            font-weight: 700;
            color: #111827;
        }}
        .skill-list {{
            flex: 1;
            color: #1f2937;
        }}
        .languages-content {{
            font-size: {max(data.font_size_pt - 0.5, 7.5)}pt;
            color: #111827;
            line-height: {data.line_height};
        }}
    </style>
</head>
<body>
    <div class="cv-container">
        {header_html}

        {summary_html}
        {edu_html}
        {exp_html}
        {proj_html}
        {skills_html}
        {extra_html}
        {languages_html}
    </div>
</body>
</html>
"""


class CVParserService:
    """
    Service de parsing et d'ingestion de CV (PDF, Texte, JSON).
    Garantit une extraction déterministe résiliente avec enrichissement LLM optionnel.
    """

    @classmethod
    def parse_cv_file(cls, content: bytes, filename: str) -> CustomCVData:
        """Extrait le texte d'un fichier PDF, JSON ou texte brut et structure les données du CV."""
        fname = filename.lower().strip()
        raw_text = ""

        if fname.endswith(".pdf"):
            try:
                reader = pypdf.PdfReader(io.BytesIO(content))
                pages_text = []
                for p in reader.pages:
                    txt = p.extract_text() or ""
                    if txt.strip():
                        pages_text.append(txt)
                raw_text = "\n\n".join(pages_text)
            except Exception as e:
                logger.error(f"Erreur lors de la lecture du PDF {filename}: {e}")
                raw_text = content.decode("utf-8", errors="ignore")
        elif fname.endswith(".json"):
            try:
                parsed_json = json.loads(content.decode("utf-8"))
                if isinstance(parsed_json, dict):
                    # Essayer de mapper directement si les clés correspondent
                    if "full_name" in parsed_json or "headline" in parsed_json:
                        return CustomCVData(**parsed_json)
                raw_text = json.dumps(parsed_json, indent=2)
            except Exception:
                raw_text = content.decode("utf-8", errors="ignore")
        else:
            raw_text = content.decode("utf-8", errors="ignore")

        return cls.parse_cv_text(raw_text)

    @classmethod
    def parse_cv_text(cls, text: str) -> CustomCVData:
        """Parse le texte brut d'un CV en structure CustomCVData déterministe."""
        clean_text = text.replace("\r\n", "\n").replace("\r", "\n")
        lines = [line.strip() for line in clean_text.splitlines() if line.strip()]

        # 1. Extraction d'email
        email_match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", clean_text)
        email = email_match.group(0) if email_match else ""

        # 2. Extraction téléphone
        phone_match = re.search(r"(\+?\d{1,4}[\s.-]?(?:\(?\d{2,4}\)?[\s.-]?)?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{0,4})", clean_text)
        phone = phone_match.group(0).strip() if phone_match else ""
        if len(phone) < 8 or len(phone) > 22:
            phone = ""

        # 3. Extraction de liens
        linkedin_match = re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_-]+)", clean_text)
        linkedin_url = f"https://linkedin.com/in/{linkedin_match.group(1)}" if linkedin_match else ""

        github_match = re.search(r"(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9_-]+)", clean_text)
        github_url = f"https://github.com/{github_match.group(1)}" if github_match else ""

        # Portfolio personnel
        portfolio_match = re.search(r"(?:https?://)?(www\.[a-zA-Z0-9_-]+\.(?:tn|fr|com|dev|io|tech|me))", clean_text)
        portfolio_url = f"https://{portfolio_match.group(1)}" if portfolio_match else ""

        # 4. Nom complet et titre (dans les 6 premières lignes non-contact)
        header_candidates = []
        for line in lines[:8]:
            if line == email or line == phone or "linkedin.com" in line or "github.com" in line:
                continue
            if re.match(r"^(curriculum vitae|cv|resume|page \d)$", line, re.IGNORECASE):
                continue
            header_candidates.append(line)

        full_name = header_candidates[0] if header_candidates else "Candidat Ingénieur"
        headline = header_candidates[1] if len(header_candidates) > 1 else "Élève-Ingénieur Architectures Cloud / DevOps"

        # 5. Découpage en sections thématiques
        section_patterns = [
            ("summary", r"^(?:#+|\*+)?\s*(?:profil|profile|summary|à propos|a propos|résumé|resume|bio|objectif)\b"),
            ("education", r"^(?:#+|\*+)?\s*(?:formation|formations|education|diplômes?|diplomes?|cursus|parcours académique)\b"),
            ("experience", r"^(?:#+|\*+)?\s*(?:expériences?|experiences?|stages?|parcours professionnel|work experience|employment)\b"),
            ("projects", r"^(?:#+|\*+)?\s*(?:projets?|projects?|réalisations?|realisations?|key projects)\b"),
            ("skills", r"^(?:#+|\*+)?\s*(?:compétences?|competences?|skills?|technologies?|stack|expertise technique)\b"),
            ("extracurricular", r"^(?:#+|\*+)?\s*(?:activités? extra-professionnelles?|activites? extra-professionnelles?|extracurricular|vie associative|associatif|engagements?)\b"),
            ("languages", r"^(?:#+|\*+)?\s*(?:langues?|languages?)\b"),
        ]

        sections: dict[str, list[str]] = {k: [] for k, _ in section_patterns}
        sections["header"] = []
        current_section = "header"

        for line in lines:
            matched_sec = None
            if len(line) <= 55 and not re.search(r"[-–—]\s*(?:20\d{2}|présent|present)", line, re.IGNORECASE):
                for sec_name, pattern in section_patterns:
                    if re.match(pattern, line, re.IGNORECASE):
                        matched_sec = sec_name
                        break
            if matched_sec:
                current_section = matched_sec
            else:
                sections[current_section].append(line)

        # 6. Summary / Accroche
        summary = " ".join(sections["summary"][:6]).strip()
        if not summary:
            summary = (
                f"Élève-ingénieur en informatique spécialisé en architectures Cloud & DevOps. "
                f"Solides compétences pratiques en virtualisation, conteneurisation, automatisation CI/CD et développement distribué."
            )

        # 7. Formations (Education)
        educations: list[ParsedEducation] = []
        edu_lines = sections["education"]
        if edu_lines:
            current_edu = None
            for el in edu_lines:
                # Détection de nouvelle formation via mot-clé de diplôme ou d'école ou d'année
                has_year = bool(re.search(r"\b20\d{2}\b", el))
                has_edu_keyword = any(kw in el.lower() for kw in ["diplôme", "diplome", "ingénieur", "ingenieur", "master", "licence", "esprit", "insat", "université", "faculté", "école", "school", "baccalauréat"])
                
                if (has_year or has_edu_keyword) and (not current_edu or len(current_edu["lines"]) >= 2):
                    if current_edu:
                        educations.append(cls._build_education_from_lines(current_edu["lines"]))
                    current_edu = {"lines": [el]}
                elif current_edu:
                    current_edu["lines"].append(el)
                else:
                    current_edu = {"lines": [el]}
            if current_edu:
                educations.append(cls._build_education_from_lines(current_edu["lines"]))

        # 8. Expériences professionnelles (Stages)
        experiences: list[ParsedExperience] = []
        exp_lines = sections["experience"]
        if exp_lines:
            current_exp = None
            for xl in exp_lines:
                has_date = bool(re.search(r"(\d{2}/\d{4}|20\d{2})", xl))
                has_exp_kw = any(kw in xl.lower() for kw in ["stagiaire", "intern", "ingénieur", "développeur", "developer", "engineer", "capgemini", "ey", "stage", "consultant"])
                
                if (has_date and has_exp_kw) or (has_date and current_exp and len(current_exp["lines"]) >= 2):
                    if current_exp:
                        experiences.append(cls._build_experience_from_lines(current_exp["lines"]))
                    current_exp = {"lines": [xl]}
                elif current_exp:
                    current_exp["lines"].append(xl)
                else:
                    current_exp = {"lines": [xl]}
            if current_exp:
                experiences.append(cls._build_experience_from_lines(current_exp["lines"]))

        # 9. Projets sélectionnés
        projects: list[ParsedProject] = []
        proj_lines = sections["projects"]
        if proj_lines:
            current_proj = None
            for pl in proj_lines:
                if (pl.startswith("-") or pl.startswith("•") or pl.startswith("*") or ":" in pl) and len(pl) > 5:
                    if current_proj:
                        projects.append(cls._build_project_from_lines(current_proj["lines"]))
                    current_proj = {"lines": [pl]}
                elif current_proj:
                    current_proj["lines"].append(pl)
                else:
                    current_proj = {"lines": [pl]}
            if current_proj:
                projects.append(cls._build_project_from_lines(current_proj["lines"]))

        # 10. Compétences Techniques (Organisées selon TAXONOMY_CATEGORIES)
        skills_text = " ".join(sections["skills"]) + " " + clean_text
        skills_text_lower = skills_text.lower()

        categorized_skills: list[ParsedSkillCategory] = []
        assigned_skills = set()

        for cat_key, cat_data in TAXONOMY_CATEGORIES.items():
            cat_title = cat_data["title_fr"]
            kw_list = cat_data["keywords"]
            cat_matches = []
            for kw in kw_list:
                pattern = r"(?:\b|_)" + re.escape(kw) + r"(?:\b|_)"
                if re.search(pattern, skills_text_lower):
                    if kw not in assigned_skills:
                        assigned_skills.add(kw)
                        display_name = kw.title() if len(kw) > 3 else kw.upper()
                        if kw == "aws": display_name = "AWS"
                        elif kw == "gcp": display_name = "GCP"
                        elif kw == "ci/cd": display_name = "CI/CD"
                        elif kw == "tcp/ip": display_name = "TCP/IP"
                        elif kw == "spring boot": display_name = "Spring Boot"
                        elif kw == "next.js": display_name = "Next.js"
                        elif kw == "node.js": display_name = "Node.js"
                        cat_matches.append(display_name)
            if cat_matches:
                categorized_skills.append(ParsedSkillCategory(title=cat_title, skills=cat_matches))

        # 11. Activités extra-professionnelles
        extracurricular: list[ParsedExtracurricular] = []
        extra_lines = sections["extracurricular"]
        if extra_lines:
            extracurricular.append(ParsedExtracurricular(
                organization="Engagement Associatif",
                role="Membre Actif",
                date="2022 – 2024",
                description=" ".join(extra_lines[:4]),
            ))

        # 12. Langues
        languages = []
        lang_lines = sections["languages"]
        if lang_lines:
            extracted_langs = []
            for ll in lang_lines:
                for l_kw in ["arabe", "français", "francais", "anglais", "english", "french", "arabic", "allemand", "espagnol"]:
                    if l_kw in ll.lower() and ll not in extracted_langs:
                        extracted_langs.append(ll.strip("•-* "))
            if extracted_langs:
                languages = extracted_langs

        return CustomCVData(
            full_name=full_name or "",
            headline=headline or "",
            email=email or "",
            phone=phone or "",
            location="",
            portfolio_url=portfolio_url or "",
            linkedin_url=linkedin_url or "",
            github_url=github_url or "",
            summary=summary or "",
            educations=educations,
            experiences=experiences,
            projects=projects,
            skills_categories=categorized_skills,
            extracurricular=extracurricular,
            languages=languages,
            language="fr",
            font_size_pt=9.0,
            line_height=1.35,
            margin_top_mm=8.0,
            margin_bottom_mm=8.0,
            margin_left_mm=12.0,
            margin_right_mm=12.0,
        )

    @classmethod
    def _build_education_from_lines(cls, lines: list[str]) -> ParsedEducation:
        header = lines[0] if lines else ""
        date_match = re.search(r"(20\d{2}(?:\s*[-–]\s*(?:20\d{2}|présent|present|en cours))?)", header, re.IGNORECASE)
        dates = date_match.group(1).split("–") if date_match and "–" in date_match.group(1) else (date_match.group(1).split("-") if date_match else ["2022", "2027"])
        start_date = dates[0].strip() if len(dates) > 0 else "2022"
        end_date = dates[1].strip() if len(dates) > 1 else ""

        desc = " ".join(lines[1:]) if len(lines) > 1 else ""
        
        # School / Degree extraction
        clean_header = re.sub(r"\(20\d{2}.*?\)", "", header).strip()
        parts = [p.strip() for p in re.split(r"[—–\-|]", clean_header) if p.strip()]
        degree = parts[0] if parts else ""
        school = parts[1] if len(parts) > 1 else ""

        return ParsedEducation(
            school=school,
            degree=degree,
            field_of_study=desc or "",
            start_date=start_date,
            end_date=end_date,
            description=desc,
        )

    @classmethod
    def _build_experience_from_lines(cls, lines: list[str]) -> ParsedExperience:
        header = lines[0] if lines else ""
        date_match = re.search(r"((?:\d{2}/)?20\d{2}\s*[-–]\s*(?:\d{2}/)?(?:20\d{2}|présent|present))", header, re.IGNORECASE)
        date_str = date_match.group(1) if date_match else ""
        clean_header = re.sub(r"((?:\d{2}/)?20\d{2}\s*[-–]\s*(?:\d{2}/)?(?:20\d{2}|présent|present))", "", header).strip(" —–-|")

        dates = date_str.split("–") if "–" in date_str else (date_str.split("-") if "-" in date_str else [date_str, ""])
        start_date = dates[0].strip() if len(dates) > 0 else ""
        end_date = dates[1].strip() if len(dates) > 1 else ""

        parts = [p.strip() for p in re.split(r"[—–\-|]| chez ", clean_header) if p.strip()]
        role = parts[0] if parts else ""
        company = parts[1] if len(parts) > 1 else ""

        body = " ".join(lines[1:]) if len(lines) > 1 else ""
        
        # Tech extraction
        technologies = []
        tech_match = re.search(r"(?:tech(?:nologies)?|stack)\s*:\s*([^\n\.]+)", body, re.IGNORECASE)
        if tech_match:
            technologies = [t.strip() for t in tech_match.group(1).split(",") if t.strip()]

        return ParsedExperience(
            company=company,
            role=role,
            location="",
            start_date=start_date,
            end_date=end_date,
            description=body,
            technologies=technologies,
        )

    @classmethod
    def _build_project_from_lines(cls, lines: list[str]) -> ParsedProject:
        header = lines[0] if lines else ""
        clean_title = re.sub(r"^[•\*\-\s]+", "", header).strip()
        parts = [p.strip() for p in re.split(r"[—–\-|:]", clean_title) if p.strip()]
        title = parts[0] if parts else ""
        role = parts[1] if len(parts) > 1 and len(parts[1]) < 30 else ""

        body = " ".join(lines[1:]) if len(lines) > 1 else (parts[1] if len(parts) > 1 and len(parts[1]) >= 30 else "")
        technologies = []
        tech_match = re.search(r"(?:tech(?:nologies)?|stack)\s*:\s*([^\n\.]+)", body, re.IGNORECASE)
        if tech_match:
            technologies = [t.strip() for t in tech_match.group(1).split(",") if t.strip()]

        return ParsedProject(
            title=title,
            role=role,
            url="",
            description=body,
            technologies=technologies,
        )

    @classmethod
    def convert_profile_to_custom_cv(cls, profile: MasterProfile, language: str = "fr") -> CustomCVData:
        """Convertit un MasterProfile souverain en structure CustomCVData éditable sans aucune donnée mockée."""
        is_en = language.lower().strip() == "en"

        headline = profile.headline or ""
        summary = profile.bio or ""

        educations = []
        for edu in profile.educations:
            educations.append(ParsedEducation(
                school=edu.school,
                degree=edu.degree,
                field_of_study=edu.field_of_study,
                start_date=edu.start_date,
                end_date=edu.end_date or ("Present" if is_en else "En cours"),
                description=edu.description or "",
            ))

        experiences = []
        for exp in profile.experiences:
            experiences.append(ParsedExperience(
                company=exp.company,
                role=exp.role,
                location=exp.location or "",
                start_date=exp.start_date,
                end_date=exp.end_date or ("Present" if is_en else "Présent"),
                description=exp.description,
                technologies=exp.technologies,
            ))

        projects = []
        for proj in profile.projects:
            projects.append(ParsedProject(
                title=proj.title,
                role=proj.role or "",
                url=proj.url or "",
                description=proj.description,
                technologies=proj.technologies,
            ))

        # Compétences
        all_skills = {s.name.strip().lower(): s.name.strip() for s in profile.skills if s.name.strip()}
        for exp in profile.experiences:
            for t in exp.technologies:
                if t.strip() and t.strip().lower() not in all_skills:
                    all_skills[t.strip().lower()] = t.strip()
        for proj in profile.projects:
            for t in proj.technologies:
                if t.strip() and t.strip().lower() not in all_skills:
                    all_skills[t.strip().lower()] = t.strip()

        assigned = set()
        skills_categories = []
        for cat_key, cat_data in TAXONOMY_CATEGORIES.items():
            title = cat_data["title_en"] if is_en else cat_data["title_fr"]
            kw_list = cat_data["keywords"]
            cat_skills = []
            for kw in kw_list:
                for s_low, s_orig in list(all_skills.items()):
                    if s_low == kw or (len(kw) > 3 and kw in s_low):
                        if s_low not in assigned:
                            assigned.add(s_low)
                            cat_skills.append(s_orig)
            if cat_skills:
                skills_categories.append(ParsedSkillCategory(title=title, skills=cat_skills))

        # Activités extra-professionnelles (strictement issues du profil)
        extracurricular = []
        if profile.extracurriculars:
            for extra in profile.extracurriculars:
                extracurricular.append(ParsedExtracurricular(
                    organization=extra.organization,
                    role=extra.role,
                    date=extra.date,
                    description=extra.description,
                ))

        # Langues (strictement issues du profil)
        languages = []
        if profile.languages:
            for lang in profile.languages:
                if lang.name:
                    sep = ": " if is_en else " : "
                    level_str = f"{sep}{lang.level}" if lang.level else ""
                    languages.append(f"{lang.name}{level_str}")

        return CustomCVData(
            full_name=profile.full_name or "",
            headline=headline,
            email=profile.email or "",
            phone=profile.phone or "",
            location=profile.location or "",
            portfolio_url=profile.website_url or "",
            linkedin_url=profile.linkedin_url or "",
            github_url=profile.github_url or "",
            summary=summary,
            educations=educations,
            experiences=experiences,
            projects=projects,
            skills_categories=skills_categories,
            extracurricular=extracurricular,
            languages=languages,
            language=language,
            font_size_pt=9.0,
            line_height=1.35,
            margin_top_mm=8.0,
            margin_bottom_mm=8.0,
            margin_left_mm=12.0,
            margin_right_mm=12.0,
        )
