import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.adapters.database import get_engine
from app.domain.deduplication import (
    JobDeduplicationIndex,
    are_jobs_duplicate,
    deduplicate_all_jobs_in_db,
    deduplicate_jobs_for_user,
)
from app.domain.models import CoverLetter, JobOffer, TargetedCV
from app.main import app
from app.ports.connectors import BaseJobConnector


@pytest.fixture
def session():
    engine = get_engine()
    with Session(engine) as s:
        yield s


def test_base_connector_generate_stable_id():
    """Vérifie que generate_stable_id est 100% déterministe entre deux appels."""
    url = "https://www.linkedin.com/jobs/view/stage-devops-12345"
    id1 = BaseJobConnector.generate_stable_id("li", url)
    id2 = BaseJobConnector.generate_stable_id("li", url)
    assert id1 == id2
    assert id1.startswith("li-")
    assert len(id1) > 5


def test_are_jobs_duplicate_rules():
    """Vérifie la détection de doublons selon les trois règles (ID, URL, Titre/Entreprise)."""
    # 1. Même platform et external_id
    j1 = {"platform": "linkedin", "external_id": "li-123", "company": "A", "title": "X"}
    j2 = {"platform": "linkedin", "external_id": "li-123", "company": "B", "title": "Y"}
    assert are_jobs_duplicate(j1, j2) is True

    # 2. Même URL après normalisation (sans paramètres UTM)
    j3 = {"platform": "indeed", "external_id": "ind-1", "url": "https://company.com/job/42?utm_source=indeed", "company": "C", "title": "Z"}
    j4 = {"platform": "hellowork", "external_id": "hw-2", "url": "https://company.com/job/42", "company": "D", "title": "W"}
    assert are_jobs_duplicate(j3, j4) is True

    # 3. Même entreprise et titre équivalent
    j5 = {"platform": "linkedin", "external_id": "li-456", "company": "Capgemini", "title": "Ingénieur DevOps - Stage", "country": "France"}
    j6 = {"platform": "jobteaser", "external_id": "jt-789", "company": "Capgemini", "title": "Stage Ingénieur DevOps", "country": "France"}
    assert are_jobs_duplicate(j5, j6) is True

    # 4. Offres différentes (titres distincts)
    j7 = {"platform": "linkedin", "external_id": "li-111", "company": "Thales", "title": "Stage Cybersécurité", "country": "France"}
    j8 = {"platform": "linkedin", "external_id": "li-222", "company": "Thales", "title": "Stage Data Science", "country": "France"}
    assert are_jobs_duplicate(j7, j8) is False

    # 5. Pays différents (France vs Tunisie pour la même multinationale)
    j9 = {"platform": "linkedin", "external_id": "li-333", "company": "Orange", "title": "Stage DevOps", "country": "France"}
    j10 = {"platform": "keejob", "external_id": "kee-444", "company": "Orange", "title": "Stage DevOps", "country": "Tunisie"}
    assert are_jobs_duplicate(j9, j10) is False


def test_job_deduplication_index():
    """Vérifie l'index en mémoire pour la détection temps réel dans le CrawlerScheduler."""
    existing_jobs = [
        JobOffer(
            platform="linkedin",
            external_id="li-999",
            title="Stage Ingénieur Cloud",
            company="Dassault Systèmes",
            url="https://3ds.com/jobs/cloud-intern",
            user_id="test_user",
        )
    ]
    index = JobDeduplicationIndex(existing_jobs)

    # Doublon par external_id
    dup1 = {"platform": "linkedin", "external_id": "li-999", "title": "Autre", "company": "Autre"}
    is_dup, _ = index.is_duplicate(dup1)
    assert is_dup is True

    # Doublon par URL avec query param
    dup2 = {"platform": "wttj", "external_id": "wttj-1", "url": "https://3ds.com/jobs/cloud-intern?ref=share", "title": "Autre", "company": "Autre"}
    is_dup, _ = index.is_duplicate(dup2)
    assert is_dup is True

    # Doublon par Entreprise + Titre
    dup3 = {"platform": "indeed", "external_id": "ind-77", "title": "PFE Ingénieur Cloud", "company": "Dassault Systèmes", "country": "France"}
    is_dup, _ = index.is_duplicate(dup3)
    assert is_dup is True

    # Offre non-doublon
    new_offer = {"platform": "indeed", "external_id": "ind-88", "title": "Stage Développeur C++", "company": "Dassault Systèmes", "country": "France"}
    is_dup, _ = index.is_duplicate(new_offer)
    assert is_dup is False


def test_deduplicate_jobs_for_user_with_document_reassignment(session: Session):
    """Vérifie la fusion des doublons en base et la réassignation des documents rattachés."""
    user = "test_dedup_user"

    # Nettoyage préalable pour l'utilisateur de test
    session.exec(select(JobOffer).where(JobOffer.user_id == user))
    for j in session.exec(select(JobOffer).where(JobOffer.user_id == user)).all():
        session.delete(j)
    session.commit()

    # Création d'une offre 1 (DISCOVERED)
    job1 = JobOffer(
        platform="jobteaser",
        external_id="jt-dup-1",
        title="Stage Ingénieur DevOps PFE",
        company="Société Test Corp",
        url="https://testcorp.com/stage1",
        status="DISCOVERED",
        user_id=user,
    )
    # Création d'un doublon 2 (READY, statut plus avancé)
    job2 = JobOffer(
        platform="linkedin",
        external_id="li-dup-2",
        title="Stage PFE Ingénieur DevOps",
        company="Société Test Corp",
        url="https://testcorp.com/stage1",
        status="READY",
        user_id=user,
    )
    session.add(job1)
    session.add(job2)
    session.commit()
    session.refresh(job1)
    session.refresh(job2)

    # Attacher une lettre de motivation à job1 (qui est moins avancé en statut)
    cover_letter = CoverLetter(
        job_id=job1.id,
        profile_id="default-profile",
        user_id=user,
        content_markdown="Lettre de motivation test",
    )
    session.add(cover_letter)
    session.commit()
    session.refresh(cover_letter)

    # Exécution de la déduplication
    removed_count = deduplicate_jobs_for_user(session, user)
    assert removed_count == 1

    # Vérification : job2 a été conservé car statut READY > DISCOVERED
    remaining_jobs = session.exec(select(JobOffer).where(JobOffer.user_id == user)).all()
    assert len(remaining_jobs) == 1
    canonical_job = remaining_jobs[0]
    assert canonical_job.id == job2.id
    assert canonical_job.status == "READY"

    # Vérification : la lettre de motivation a été réassignée à l'offre canonique job2
    session.refresh(cover_letter)
    assert cover_letter.job_id == job2.id

    # Nettoyage du test
    session.delete(cover_letter)
    session.delete(canonical_job)
    session.commit()


def test_api_deduplicate_endpoint():
    """Vérifie la route POST /api/jobs/deduplicate."""
    from app.api.auth import get_current_username
    from app.domain.models import User

    client = TestClient(app)
    # Override de l'authentification
    app.dependency_overrides[get_current_username] = lambda: "louay"

    try:
        response = client.post("/api/jobs/deduplicate")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "duplicates_removed" in data
        assert isinstance(data["duplicates_removed"], int)
    finally:
        app.dependency_overrides.pop(get_current_username, None)
