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


@pytest.fixture(autouse=True)
def mock_external_llm_agents(monkeypatch):
    """Mock par défaut des agents LLM externes (Groq) pour garantir l'exécution hors-ligne et éviter d'épuiser le quota quotidien de tokens."""
    from app.domain.cv_agent import CVRewriteResult
    from app.domain.models import CoverLetter

    def fake_execute_writer_agent(job_id, user_id="louay", language="fr", ats_match=None, job_offer=None, master_profile=None):
        company = (job_offer.company if job_offer else "votre entreprise") or "votre entreprise"
        full_name = (master_profile.full_name if master_profile else "Louay Zorai") or "Louay Zorai"
        school = master_profile.educations[0].school if master_profile and master_profile.educations else "INSAT"
        proj = master_profile.projects[0].title if master_profile and master_profile.projects else "Distributed Queue Worker"
        skills = master_profile.skills[0].name if master_profile and master_profile.skills else "Python"
        content = (
            f"Madame, Monsieur,\n\n"
            f"Votre entreprise {company} développe des architectures de pointe.\n\n"
            f"Formé à l'{school}, j'ai développé le projet « {proj} » avec {skills}.\n\n"
            f"En rejoignant vos équipes, je souhaite apporter ma rigueur dès les premières semaines.\n\n"
            f"Je suis disponible pour un stage de fin d'études de six mois et me tiens à votre disposition pour un entretien.\n\n"
            f"Cordialement,\n\n"
            f"{full_name}"
        )
        return CoverLetter(
            job_id=job_id,
            profile_id="default-profile",
            target_role=job_offer.title if job_offer else "Ingénieur",
            company_name=company,
            content_markdown=content,
            cliche_score=0,
            thinking_plan="Plan d'argumentation sur-mesure",
            language=language,
            user_id=user_id,
        )

    def fake_execute_cv_writer_agent(job_id, user_id="louay", language="fr", engine=None, ats_match=None, job_offer=None, master_profile=None, **kwargs):
        bio = (master_profile.bio if master_profile and master_profile.bio else "") if master_profile else ""
        return CVRewriteResult(
            summary=bio or ("Software Engineer." if language == "en" else "Élève-ingénieur en génie logiciel."),
            experiences=[],
            projects=[],
        )

    monkeypatch.setattr("app.domain.letter_agent.execute_writer_agent", fake_execute_writer_agent)
    monkeypatch.setattr("app.domain.cv_agent.execute_cv_writer_agent", fake_execute_cv_writer_agent)


client = TestClient(app)

