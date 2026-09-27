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


def init_db() -> None:
    engine = get_engine()
    SQLModel.metadata.create_all(engine)
    _migrate_db(engine)

    # Assurer la présence du MasterProfile par défaut
    with Session(engine) as session:
        profile = session.exec(select(MasterProfile).where(MasterProfile.id == "default-profile")).first()
        if not profile:
            profile = MasterProfile(
                id="default-profile",
                full_name="",
                email="",
                headline="",
                is_complete=False,
            )
            session.add(profile)
            session.commit()


def get_session() -> Generator[Session, None, None]:
    engine = get_engine()
    with Session(engine) as session:
        yield session
