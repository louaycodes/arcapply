import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy.pool import StaticPool
from app.adapters.database import get_session, seed_initial_users
from app.domain.models import MasterProfile, JobOffer, User  # Assure le chargement dans metadata
from app.main import app

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


def get_test_session():
    with Session(engine) as session:
        yield session


app.dependency_overrides[get_session] = get_test_session


@pytest.fixture(autouse=True)
def setup_db():
    SQLModel.metadata.create_all(engine)
    seed_initial_users(engine)
    with Session(engine) as session:
        default_p = MasterProfile(
            id="default-profile",
            full_name="",
            email="",
            is_complete=False,
        )
        session.add(default_p)
        session.commit()
    yield
    SQLModel.metadata.drop_all(engine)



client = TestClient(app)
