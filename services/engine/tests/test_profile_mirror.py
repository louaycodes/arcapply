from unittest.mock import patch
import pytest
from sqlmodel import Session
from tests.conftest import client, engine
from app.config import settings
from app.domain.models import Education, Experience, MasterProfile, Project
from app.domain.profile_mirror import ProfileMirrorService


def test_sync_mirror_translations_without_api_key_raises_runtime_error(monkeypatch):
    with Session(engine) as session:
        profile = MasterProfile(
            id="test-no-key",
            user_id="testuser",
            full_name="Jean Dupont",
            groq_api_key="",
        )
        monkeypatch.setattr(settings, "groq_api_key", "")
        with pytest.raises(RuntimeError, match="Clé d'API Groq non configurée"):
            ProfileMirrorService.sync_mirror_translations(profile, session)


def test_sync_mirror_translations_success():
    with Session(engine) as session:
        profile = MasterProfile(
            id="test-mirror",
            user_id="testuser",
            full_name="Alex Dupont",
            headline="Élève-ingénieur Logiciel",
            bio="Passionné par le Cloud et le DevOps.",
            groq_api_key="gsk_dummy",
        )
        edu = Education(
            profile_id="test-mirror",
            school="INSAT",
            degree="Diplôme National d'Ingénieur",
            field_of_study="Génie Logiciel",
            description="Spécialisation Systèmes Distribués",
        )
        exp = Experience(
            profile_id="test-mirror",
            company="Tech Corp",
            role="Stagiaire Développeur",
            description="Développement de microservices en FastAPI et Docker.",
        )
        proj = Project(
            profile_id="test-mirror",
            title="Plateforme Cloud",
            role="Lead Développeur",
            description="Automatisation des déploiements Kubernetes.",
        )
        profile.educations = [edu]
        profile.experiences = [exp]
        profile.projects = [proj]

        session.add(profile)
        session.commit()
        session.refresh(profile)

        fake_response = {
            "profile": {
                "headline": "Software Engineering Student",
                "bio": "Passionate about Cloud and DevOps.",
            },
            "educations": [
                {
                    "index": 0,
                    "degree": "National Engineering Degree",
                    "field_of_study": "Software Engineering",
                    "description": "Specialization in Distributed Systems",
                }
            ],
            "experiences": [
                {
                    "index": 0,
                    "role": "Software Developer Intern",
                    "description": "Built microservices using FastAPI and Docker.",
                }
            ],
            "projects": [
                {
                    "index": 0,
                    "title": "Cloud Platform",
                    "role": "Lead Developer",
                    "description": "Automated Kubernetes deployments.",
                }
            ],
        }

        with patch.object(ProfileMirrorService, "_execute_translation_llm", return_value=fake_response):
            updated = ProfileMirrorService.sync_mirror_translations(profile, session)

            assert updated.headline_en == "Software Engineering Student"
            assert updated.bio_en == "Passionate about Cloud and DevOps."
            assert updated.educations[0].degree_en == "National Engineering Degree"
            assert updated.educations[0].field_of_study_en == "Software Engineering"
            assert updated.experiences[0].role_en == "Software Developer Intern"
            assert updated.experiences[0].description_en == "Built microservices using FastAPI and Docker."
            assert updated.projects[0].title_en == "Cloud Platform"
            assert updated.projects[0].role_en == "Lead Developer"


def test_api_mirror_sync_endpoint(monkeypatch):
    # D'abord mettre à jour le profil avec un headline
    client.put("/api/profile", json={"headline": "Élève-ingénieur Logiciel", "search_mode": "PFE"})

    fake_response = {
        "profile": {"headline": "Engineering Student", "bio": "Bio translated"},
        "educations": [],
        "experiences": [],
        "projects": [],
    }
    monkeypatch.setattr(settings, "groq_api_key", "gsk_dummy")
    with patch.object(ProfileMirrorService, "_execute_translation_llm", return_value=fake_response):
        response = client.post("/api/profile/mirror-sync")
        assert response.status_code == 200
        data = response.json()
        assert data["headline_en"] == "Engineering Student"
