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


def init_db() -> None:
    engine = get_engine()
    SQLModel.metadata.create_all(engine)

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
