from typing import Generator
from sqlmodel import Session, SQLModel, create_engine, select
from app.config import settings
from app.domain.models import MasterProfile

_engine = None


def get_engine():
    global _engine
    if _engine is None:
        settings.ensure_data_dir()
        _engine = create_engine(
            settings.database_url,
            echo=False,
            connect_args={"check_same_thread": False},
        )
    return _engine


def _migrate_db(engine) -> None:
    """Migrations additives idempotentes pour SQLite."""
    from sqlalchemy import text
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE master_profiles ADD COLUMN search_mode VARCHAR DEFAULT 'PFE'"))
            conn.commit()
        except Exception:
            pass

        try:
            conn.execute(text("ALTER TABLE job_offers ADD COLUMN offer_type VARCHAR DEFAULT 'PFE'"))
            conn.commit()
        except Exception:
            pass

        try:
            conn.execute(text("ALTER TABLE targeted_cvs ADD COLUMN language VARCHAR DEFAULT 'fr'"))
            conn.commit()
        except Exception:
            pass

        try:
            conn.execute(text("ALTER TABLE experiences ADD COLUMN experience_type VARCHAR DEFAULT 'stage'"))
            conn.commit()
        except Exception:
            pass

        try:
            conn.execute(text("ALTER TABLE master_profiles ADD COLUMN languages_raw TEXT DEFAULT '[]'"))
            conn.commit()
        except Exception:
            pass

        try:
            conn.execute(text("ALTER TABLE master_profiles ADD COLUMN extracurriculars_raw TEXT DEFAULT '[]'"))
            conn.commit()
        except Exception:
            pass

        try:
            conn.execute(text("ALTER TABLE master_profiles ADD COLUMN groq_api_key VARCHAR DEFAULT ''"))
            conn.commit()
        except Exception:
            pass

        try:
            conn.execute(text("ALTER TABLE master_profiles ADD COLUMN groq_model VARCHAR DEFAULT ''"))
            conn.commit()
        except Exception:
            pass


        # Migrations additives pour le Deep Scraping & Filtrage Temporel
        additive_columns = [
            ("published_at", "TIMESTAMP"),
            ("skills_required", "TEXT DEFAULT '[]'"),
            ("contract_duration", "VARCHAR DEFAULT ''"),
            ("work_mode", "VARCHAR DEFAULT ''"),
            ("salary_stipend", "VARCHAR DEFAULT ''"),
            ("department", "VARCHAR DEFAULT ''"),
            ("is_direct_career_site", "BOOLEAN DEFAULT 0"),
            ("apply_url", "VARCHAR DEFAULT ''"),
        ]
        for col_name, col_type in additive_columns:
            try:
                conn.execute(text(f"ALTER TABLE job_offers ADD COLUMN {col_name} {col_type}"))
                conn.commit()
            except Exception:
                pass

        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS custom_cv_drafts (
                    id VARCHAR PRIMARY KEY,
                    title VARCHAR DEFAULT 'Mon CV',
                    data_json TEXT DEFAULT '{}',
                    html_content TEXT DEFAULT '',
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP
                )
            """))
            conn.commit()
        except Exception:
            pass

        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS recon_dossiers (
                    id VARCHAR PRIMARY KEY,
                    job_id VARCHAR NOT NULL,
                    user_id VARCHAR DEFAULT 'louay',
                    external_url VARCHAR,
                    full_description TEXT DEFAULT '',
                    company_name VARCHAR DEFAULT '',
                    company_website VARCHAR,
                    company_mission TEXT,
                    company_culture TEXT,
                    tech_stack_detected_raw TEXT DEFAULT '[]',
                    investigation_notes TEXT,
                    status VARCHAR DEFAULT 'PENDING',
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP
                )
            """))
            conn.commit()
        except Exception:
            pass

        for tbl in ["master_profiles", "job_offers", "targeted_cvs", "cover_letters", "email_interactions", "custom_cv_drafts", "recon_dossiers"]:
            try:
                conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN user_id VARCHAR DEFAULT 'louay'"))
                conn.commit()
            except Exception:
                pass
            try:
                conn.execute(text(f"CREATE INDEX IF NOT EXISTS ix_{tbl}_user_id ON {tbl} (user_id)"))
                conn.commit()
            except Exception:
                pass

        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR PRIMARY KEY,
                    username VARCHAR UNIQUE NOT NULL,
                    full_name VARCHAR DEFAULT '',
                    role VARCHAR DEFAULT 'user',
                    password_hash VARCHAR DEFAULT '',
                    created_at TIMESTAMP
                )
            """))
            conn.commit()
        except Exception:
            pass

        # Migrations bilingues et langue
        bilingual_columns = [
            ("master_profiles", "headline_fr", "VARCHAR DEFAULT ''"),
            ("master_profiles", "headline_en", "VARCHAR DEFAULT ''"),
            ("master_profiles", "bio_fr", "TEXT DEFAULT ''"),
            ("master_profiles", "bio_en", "TEXT DEFAULT ''"),
            ("educations", "degree_fr", "VARCHAR DEFAULT ''"),
            ("educations", "degree_en", "VARCHAR DEFAULT ''"),
            ("educations", "field_of_study_fr", "VARCHAR DEFAULT ''"),
            ("educations", "field_of_study_en", "VARCHAR DEFAULT ''"),
            ("educations", "description_fr", "TEXT DEFAULT ''"),
            ("educations", "description_en", "TEXT DEFAULT ''"),
            ("experiences", "role_fr", "VARCHAR DEFAULT ''"),
            ("experiences", "role_en", "VARCHAR DEFAULT ''"),
            ("experiences", "description_fr", "TEXT DEFAULT ''"),
            ("experiences", "description_en", "TEXT DEFAULT ''"),
            ("projects", "title_fr", "VARCHAR DEFAULT ''"),
            ("projects", "title_en", "VARCHAR DEFAULT ''"),
            ("projects", "role_fr", "VARCHAR DEFAULT ''"),
            ("projects", "role_en", "VARCHAR DEFAULT ''"),
            ("projects", "description_fr", "TEXT DEFAULT ''"),
            ("projects", "description_en", "TEXT DEFAULT ''"),
            ("cover_letters", "language", "VARCHAR DEFAULT 'fr'"),
        ]
        for tbl_name, col_name, col_type in bilingual_columns:
            try:
                conn.execute(text(f"ALTER TABLE {tbl_name} ADD COLUMN {col_name} {col_type}"))
                conn.commit()
            except Exception:
                pass

        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_cover_letters_language ON cover_letters (language)"))
            conn.commit()
        except Exception:
            pass

        # Migrations anti-rescrape & offres déjà postulées ou archivées
        applied_columns = [
            ("job_offers", "is_applied", "BOOLEAN DEFAULT 0"),
            ("job_offers", "applied_at", "TIMESTAMP"),
            ("users", "onboarding_completed", "BOOLEAN DEFAULT 0"),
            ("users", "playbook_initialized", "BOOLEAN DEFAULT 0"),
            ("master_profiles", "onboarding_completed", "BOOLEAN DEFAULT 0"),
        ]
        for tbl_name, col_name, col_type in applied_columns:
            try:
                conn.execute(text(f"ALTER TABLE {tbl_name} ADD COLUMN {col_name} {col_type}"))
                conn.commit()
            except Exception:
                pass

        # Pour les utilisateurs pré-existants en production, marquer playbook_initialized = 1
        # afin de préserver définitivement les suppressions de directives
        try:
            conn.execute(text("UPDATE users SET playbook_initialized = 1 WHERE playbook_initialized = 0"))
            conn.commit()
        except Exception:
            pass

        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_job_offers_is_applied ON job_offers (is_applied)"))
            conn.commit()
        except Exception:
            pass

        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS applied_job_signatures (
                    id VARCHAR PRIMARY KEY,
                    user_id VARCHAR NOT NULL DEFAULT 'louay',
                    job_id VARCHAR,
                    platform VARCHAR,
                    external_id VARCHAR,
                    company_clean VARCHAR NOT NULL,
                    title_clean VARCHAR NOT NULL,
                    url_normalized VARCHAR,
                    applied_at TIMESTAMP
                )
            """))
            conn.commit()
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_applied_signatures_user ON applied_job_signatures (user_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_applied_signatures_company ON applied_job_signatures (user_id, company_clean)"))
            conn.commit()
        except Exception:
            pass

        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS archived_job_signatures (
                    id VARCHAR PRIMARY KEY,
                    user_id VARCHAR NOT NULL DEFAULT 'louay',
                    job_id VARCHAR,
                    platform VARCHAR,
                    external_id VARCHAR,
                    company_clean VARCHAR NOT NULL,
                    title_clean VARCHAR NOT NULL,
                    url_normalized VARCHAR,
                    archived_at TIMESTAMP
                )
            """))
            conn.commit()
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_archived_signatures_user ON archived_job_signatures (user_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_archived_signatures_company ON archived_job_signatures (user_id, company_clean)"))
            conn.commit()
        except Exception:
            pass

        # Tables pour l'architecture agentique (Playbook & Recon Dossier)
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS agent_playbook_rules (
                    id VARCHAR PRIMARY KEY,
                    user_id VARCHAR DEFAULT 'louay',
                    title VARCHAR NOT NULL,
                    condition_trigger TEXT NOT NULL,
                    action_instruction TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    category VARCHAR DEFAULT 'custom',
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP
                )
            """))
            conn.commit()
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_agent_playbook_rules_user_id ON agent_playbook_rules (user_id)"))
            conn.commit()
        except Exception:
            pass

        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS recon_dossiers (
                    id VARCHAR PRIMARY KEY,
                    job_id VARCHAR NOT NULL,
                    user_id VARCHAR DEFAULT 'louay',
                    external_url VARCHAR,
                    full_description TEXT DEFAULT '',
                    company_name VARCHAR DEFAULT '',
                    company_website VARCHAR,
                    company_mission TEXT,
                    company_culture TEXT,
                    tech_stack_detected_raw TEXT DEFAULT '[]',
                    investigation_notes TEXT,
                    status VARCHAR DEFAULT 'PENDING',
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP
                )
            """))
            conn.commit()
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_recon_dossiers_job_id ON recon_dossiers (job_id)"))
            conn.commit()
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_recon_dossiers_user_id ON recon_dossiers (user_id)"))
            conn.commit()
        except Exception:
            pass

        try:
            conn.execute(text("ALTER TABLE cover_letters ADD COLUMN thinking_plan TEXT"))
            conn.commit()
        except Exception:
            pass

        # Purge sélective et idempotente des offres existantes pour l'architecture Deep Recon (profils et users 100% préservés)
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS _schema_migrations (
                    version VARCHAR PRIMARY KEY,
                    applied_at TIMESTAMP
                )
            """))
            conn.commit()
            res = conn.execute(text("SELECT version FROM _schema_migrations WHERE version = 'purge_legacy_jobs_for_deep_recon'")).fetchone()
            if not res:
                conn.execute(text("DELETE FROM targeted_cvs"))
                conn.execute(text("DELETE FROM cover_letters"))
                conn.execute(text("DELETE FROM job_offers"))
                conn.execute(text("INSERT INTO _schema_migrations (version, applied_at) VALUES ('purge_legacy_jobs_for_deep_recon', CURRENT_TIMESTAMP)"))
                conn.commit()
        except Exception:
            pass

    # Déduplication et nettoyage idempotent des offres pour prod et dev
    try:
        from app.domain.deduplication import deduplicate_all_jobs_in_db
        deduplicate_all_jobs_in_db(engine)
    except Exception as exc:
        import logging
        logging.getLogger(__name__).warning(f"[_migrate_db] Erreur déduplication automatique : {exc}")


def seed_initial_users(engine) -> None:
    from app.domain.models import User
    from app.domain.auth import hash_password

    with Session(engine) as session:
        default_users = [
            ("louay", "louay", "Louay", "admin"),
            ("chaima", "chaima", "Chaima", "admin"),
        ]
        for uname, pwd, fname, role in default_users:
            user = session.exec(select(User).where(User.username == uname)).first()
            if not user:
                user = User(
                    username=uname,
                    full_name=fname,
                    role=role,
                    password_hash=hash_password(pwd),
                )
                session.add(user)
            else:
                user.password_hash = hash_password(pwd)
                user.full_name = fname
                session.add(user)
        session.commit()


def seed_initial_profiles(engine) -> None:
    from app.domain.models import (
        Education,
        Experience,
        Project,
        Skill,
        utc_now,
    )
    from app.domain.validation import evaluate_profile_completeness

    with Session(engine) as session:
        # 1. Profil Louay
        louay_profile = session.exec(select(MasterProfile).where(MasterProfile.id == "default-profile")).first()
        if not louay_profile:
            louay_profile = MasterProfile(
                id="default-profile",
                user_id="louay",
                full_name="Louay Zorai",
                email="contact@louaycodes.tn",
                phone="+21698202263",
                location="Tunis, Tunisia",
                website_url="https://www.louaycodes.tn/",
                headline="Étudiant ingénieur en Architectures Cloud / DevOps",
                headline_fr="Étudiant ingénieur en Architectures Cloud / DevOps",
                headline_en="Cloud Architecture & DevOps Engineering Student",
                bio="Étudiant en ingénierie informatique spécialisé en architecture cloud à l'ESPRIT, Tunis.",
                bio_fr="Étudiant en ingénierie informatique spécialisé en architecture cloud à l'ESPRIT, Tunis.",
                bio_en="Computer engineering student specializing in cloud architecture at ESPRIT, Tunis.",
                search_mode="PFE",
                is_complete=True,
            )
            session.add(louay_profile)
            session.commit()
            session.refresh(louay_profile)
        else:
            louay_profile.user_id = "louay"
            if not louay_profile.headline_fr:
                louay_profile.headline_fr = louay_profile.headline or "Étudiant ingénieur en Architectures Cloud / DevOps"
            if not louay_profile.headline_en:
                louay_profile.headline_en = "Cloud Architecture & DevOps Engineering Student"
            if not louay_profile.bio_fr:
                louay_profile.bio_fr = louay_profile.bio or ""
            if not louay_profile.bio_en:
                louay_profile.bio_en = "Computer engineering student specializing in cloud architecture at ESPRIT, Tunis."
            session.add(louay_profile)

        # 2. Profil Chaima
        chaima_profile = session.exec(select(MasterProfile).where(MasterProfile.user_id == "chaima")).first()
        if not chaima_profile:
            chaima_profile = MasterProfile(
                id="profile-chaima",
                user_id="chaima",
                full_name="Chaima",
                email="chaima@arcapply.com",
                phone="+216 98 000 001",
                location="Tunis, Tunisie",
                website_url="https://github.com/chaima",
                headline="Élève Ingénieure en Cloud & DevOps",
                headline_fr="Élève Ingénieure en Cloud & DevOps",
                headline_en="Cloud & DevOps Engineering Student",
                bio="Élève ingénieure à ESPRIT spécialisée dans les architectures cloud, conteneurisation et observabilité.",
                bio_fr="Élève ingénieure à ESPRIT spécialisée dans les architectures cloud, conteneurisation et observabilité.",
                bio_en="Computer engineering student at ESPRIT specializing in cloud architectures, containerization and observability.",
                search_mode="PFE",
                is_complete=True,
            )
            session.add(chaima_profile)
            session.commit()
            session.refresh(chaima_profile)
        else:
            if not chaima_profile.full_name or chaima_profile.full_name == "Chaima":
                chaima_profile.full_name = "Chaima"
            if not chaima_profile.email:
                chaima_profile.email = "chaima@arcapply.com"
            if not chaima_profile.phone:
                chaima_profile.phone = "+216 98 000 001"
            if not chaima_profile.location:
                chaima_profile.location = "Tunis, Tunisie"
            if not chaima_profile.headline:
                chaima_profile.headline = "Élève Ingénieure en Cloud & DevOps"
            if not chaima_profile.headline_fr:
                chaima_profile.headline_fr = chaima_profile.headline
            if not chaima_profile.headline_en:
                chaima_profile.headline_en = "Cloud & DevOps Engineering Student"
            if not chaima_profile.bio_fr:
                chaima_profile.bio_fr = chaima_profile.bio or "Élève ingénieure à ESPRIT spécialisée dans les architectures cloud."
            if not chaima_profile.bio_en:
                chaima_profile.bio_en = "Computer engineering student at ESPRIT specializing in cloud architectures."
            session.add(chaima_profile)
            session.commit()
            session.refresh(chaima_profile)

        # Assurer les sous-entités minimales pour Chaima si incomplètes
        chaima_edus = session.exec(select(Education).where(Education.profile_id == chaima_profile.id)).all()
        if not chaima_edus:
            session.add(
                Education(
                    profile_id=chaima_profile.id,
                    school="ESPRIT",
                    degree="Diplôme National d'Ingénieur en Informatique",
                    degree_fr="Diplôme National d'Ingénieur en Informatique",
                    degree_en="Master of Science in Computer Engineering",
                    field_of_study="Architectures Cloud & DevOps",
                    field_of_study_fr="Architectures Cloud & DevOps",
                    field_of_study_en="Cloud Architectures & DevOps",
                    start_date="2022",
                    end_date="2027",
                    description="Formation d'ingénieur d'excellence axée sur les systèmes distribués, le cloud et la sécurité.",
                    description_fr="Formation d'ingénieur d'excellence axée sur les systèmes distribués, le cloud et la sécurité.",
                    description_en="Engineering degree focused on distributed systems, cloud computing, and security.",
                )
            )

        chaima_exps = session.exec(select(Experience).where(Experience.profile_id == chaima_profile.id)).all()
        if not chaima_exps:
            session.add(
                Experience(
                    profile_id=chaima_profile.id,
                    company="Capgemini Tunisie",
                    role="Stagiaire Cloud / DevOps",
                    role_fr="Stagiaire Cloud / DevOps",
                    role_en="Cloud & DevOps Engineering Intern",
                    location="Tunis",
                    start_date="06/2026",
                    end_date="08/2026",
                    experience_type="stage",
                    description="Automatisation de pipelines CI/CD et déploiement de microservices sur conteneurs Docker et Kubernetes.",
                    description_fr="Automatisation de pipelines CI/CD et déploiement de microservices sur conteneurs Docker et Kubernetes.",
                    description_en="Automation of CI/CD pipelines and deployment of microservices on Docker containers and Kubernetes.",
                    technologies_raw="Docker, Kubernetes, Jenkins, Git, AWS",
                )
            )

        chaima_projs = session.exec(select(Project).where(Project.profile_id == chaima_profile.id)).all()
        if not chaima_projs:
            session.add(
                Project(
                    profile_id=chaima_profile.id,
                    title="Plateforme Cloud & Observabilité",
                    title_fr="Plateforme Cloud & Observabilité",
                    title_en="Cloud Platform & Observability Stack",
                    role="DevOps Engineer",
                    role_fr="Ingénieure DevOps",
                    role_en="DevOps Engineer",
                    description="Déploiement d'une stack de monitoring Prometheus et Grafana avec alerting Slack et automatisation Ansible.",
                    description_fr="Déploiement d'une stack de monitoring Prometheus et Grafana avec alerting Slack et automatisation Ansible.",
                    description_en="Deployed a Prometheus and Grafana monitoring stack with Slack alerting and Ansible automation.",
                    technologies_raw="Prometheus, Grafana, Ansible, Linux, Python",
                )
            )

        chaima_skills = session.exec(select(Skill).where(Skill.profile_id == chaima_profile.id)).all()
        if len(chaima_skills) < 5:
            default_chaima_skills = [
                ("Angular", "Frameworks"),
                ("FastAPI", "Frameworks"),
                ("Spring Boot", "Frameworks"),
                ("Python", "Langages & Scripting"),
                ("Java", "Langages & Scripting"),
                ("Bash", "Langages & Scripting"),
                ("PostgreSQL", "Bases de données"),
                ("MySQL", "Bases de données"),
                ("Git", "Versioning & Méthodes"),
                ("GitHub Actions", "Versioning & Méthodes"),
                ("Linux (Ubuntu)", "Systèmes & Réseaux"),
                ("TCP/IP", "Systèmes & Réseaux"),
                ("Prometheus", "Monitoring & Observabilité"),
                ("Grafana", "Monitoring & Observabilité"),
                ("Ansible", "Infrastructure as Code"),
                ("Terraform", "Infrastructure as Code"),
                ("AWS", "Cloud & Infrastructure"),
                ("OpenStack", "Cloud & Infrastructure"),
                ("Docker", "Conteneurisation & Orchestration"),
                ("Kubernetes", "Conteneurisation & Orchestration"),
                ("SonarQube", "Sécurité (DevSecOps)"),
                ("OWASP", "Sécurité (DevSecOps)"),
            ]
            for sname, scat in default_chaima_skills:
                session.add(Skill(profile_id=chaima_profile.id, name=sname, category=scat, proficiency_level="avancé"))

        # Mettre à jour les compétences existantes vers les 10 catégories normalisées si elles ont d'anciennes catégories
        category_remapping = {
            "Cloud & DevOps": "Cloud & Infrastructure",
            "Réseaux & Systèmes": "Systèmes & Réseaux",
            "Backend": "Frameworks",
            "Frontend": "Frameworks",
            "Langages": "Langages & Scripting",
            "Outils & Méthodes": "Versioning & Méthodes",
        }
        all_skills = session.exec(select(Skill)).all()
        for sk in all_skills:
            if sk.category in category_remapping:
                sn = sk.name.lower()
                if sn in ["docker", "kubernetes", "k8s", "helm"]:
                    sk.category = "Conteneurisation & Orchestration"
                elif sn in ["ansible", "terraform"]:
                    sk.category = "Infrastructure as Code"
                elif sn in ["prometheus", "grafana", "zabbix"]:
                    sk.category = "Monitoring & Observabilité"
                elif sn in ["sonarqube", "owasp", "trivy"]:
                    sk.category = "Sécurité (DevSecOps)"
                elif sn in ["postgresql", "mysql", "sqlite", "mongodb", "chromadb", "firebase"]:
                    sk.category = "Bases de données"
                elif sn in ["python", "java", "c", "c++", "php", "sql", "typescript", "javascript", "bash"]:
                    sk.category = "Langages & Scripting"
                else:
                    sk.category = category_remapping[sk.category]
                session.add(sk)

        session.commit()

        # Recalcul de complétude
        for prof in [louay_profile, chaima_profile]:
            session.refresh(prof)
            stat = evaluate_profile_completeness(prof)
            prof.is_complete = stat.is_complete
            session.add(prof)
        session.commit()


def init_db(engine=None) -> None:
    if engine is None:
        engine = get_engine()
    SQLModel.metadata.create_all(engine)
    _migrate_db(engine)


def get_session() -> Generator[Session, None, None]:
    engine = get_engine()
    with Session(engine) as session:
        yield session

