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

        for tbl in ["master_profiles", "job_offers", "targeted_cvs", "cover_letters"]:
            try:
                conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN user_id VARCHAR DEFAULT 'louay'"))
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


def init_db(engine=None) -> None:
    if engine is None:
        engine = get_engine()
    SQLModel.metadata.create_all(engine)
    _migrate_db(engine)
    seed_initial_users(engine)

    # Assurer la présence et l'affectation du profil existant à Louay
    with Session(engine) as session:
        louay_profile = session.exec(select(MasterProfile).where(MasterProfile.id == "default-profile")).first()
        if not louay_profile:
            louay_profile = MasterProfile(
                id="default-profile",
                user_id="louay",
                full_name="Louay",
                email="",
                headline="",
                is_complete=False,
            )
            session.add(louay_profile)
        else:
            louay_profile.user_id = "louay"
            session.add(louay_profile)

        # Assurer la présence du profil dédié à Chaima
        chaima_profile = session.exec(select(MasterProfile).where(MasterProfile.user_id == "chaima")).first()
        if not chaima_profile:
            chaima_profile = MasterProfile(
                id="profile-chaima",
                user_id="chaima",
                full_name="Chaima",
                email="",
                headline="Élève Ingénieur",
                is_complete=False,
            )
            session.add(chaima_profile)
        session.commit()


def get_session() -> Generator[Session, None, None]:
    engine = get_engine()
    with Session(engine) as session:
        yield session

