from tests.conftest import client



def test_initial_profile_is_incomplete():
    response = client.get("/api/profile/status")
    assert response.status_code == 200
    data = response.json()
    assert data["is_complete"] is False
    assert data["can_generate"] is False
    assert len(data["missing_fields"]) > 0


def test_generation_blocked_when_profile_incomplete():
    # Garde-fou CAP-1 : doit lever une 422
    response = client.post("/api/profile/can-generate")
    assert response.status_code == 422
    data = response.json()
    assert data["detail"]["error_code"] == "PROFILE_INCOMPLETE"
    assert len(data["detail"]["missing_fields"]) > 0


def test_update_profile_complete_allows_generation():
    payload = {
        "full_name": "Alexandre Dupont",
        "email": "alexandre.dupont@insat.u-carthage.tn",
        "phone": "+33 6 12 34 56 78",
        "location": "Paris, France / Tunis, Tunisie",
        "headline": "Élève-ingénieur Logiciel & Cloud en recherche de PFE 2027",
        "bio": "Passionné par l'architecture logicielle, les systèmes distribués et le DevOps.",
        "linkedin_url": "https://linkedin.com/in/alexandre-dupont",
        "github_url": "https://github.com/alexandre-dupont",
        "educations": [
            {
                "school": "INSAT",
                "degree": "Diplôme National d'Ingénieur",
                "field_of_study": "Génie Logiciel",
                "start_date": "2022",
                "end_date": "2027",
                "description": "Spécialisation Systèmes Distribués et Cloud",
            }
        ],
        "experiences": [
            {
                "company": "Tech Innovations",
                "role": "Stagiaire Développeur Backend",
                "location": "Tunis",
                "start_date": "Juin 2025",
                "end_date": "Août 2025",
                "description": "Conception d'APIs microservices haute performance en FastAPI et PostgreSQL.",
                "technologies": ["Python", "FastAPI", "Docker", "PostgreSQL"],
            }
        ],
        "projects": [
            {
                "title": "ArcApply Platform",
                "role": "Lead Architect",
                "description": "Copilote de candidature haute efficacité découplé avec matching ATS.",
                "technologies": ["Python", "Next.js", "SQLite"],
            }
        ],
        "skills": [
            {"name": "Python", "category": "Languages", "level": "advanced"},
            {"name": "FastAPI", "category": "Frameworks", "level": "advanced"},
            {"name": "TypeScript", "category": "Languages", "level": "intermediate"},
            {"name": "Docker", "category": "DevOps", "level": "intermediate"},
        ],
    }

    # Mise à jour du profil complet
    put_response = client.put("/api/profile", json=payload)
    assert put_response.status_code == 200
    profile_data = put_response.json()
    assert profile_data["is_complete"] is True
    assert profile_data["full_name"] == "Alexandre Dupont"
    assert len(profile_data["educations"]) == 1
    assert len(profile_data["skills"]) == 4

    # Vérification du statut
    status_response = client.get("/api/profile/status")
    assert status_response.status_code == 200
    status_data = status_response.json()
    assert status_data["is_complete"] is True
    assert status_data["can_generate"] is True
    assert status_data["completion_percentage"] == 100
    assert len(status_data["missing_fields"]) == 0

    # Garde-fou CAP-1 : maintenant débloqué
    gen_response = client.post("/api/profile/can-generate")
    assert gen_response.status_code == 200
    gen_data = gen_response.json()
    assert gen_data["status"] == "ok"


def test_partial_profile_saves_as_draft():
    # Sauvegarde d'un profil partiel sans compétences ni formation
    payload = {
        "full_name": "Jean Test",
        "email": "jean@test.com",
        "educations": [],
        "experiences": [],
        "projects": [],
        "skills": [],
    }

    put_response = client.put("/api/profile", json=payload)
    assert put_response.status_code == 200
    profile_data = put_response.json()
    assert profile_data["is_complete"] is False

    status_response = client.get("/api/profile/status")
    status_data = status_response.json()
    assert status_data["is_complete"] is False
    assert status_data["can_generate"] is False
    assert any("formation" in f.lower() for f in status_data["missing_fields"])
    assert any("compétences" in f.lower() for f in status_data["missing_fields"])


def test_database_init_on_disk(tmp_path, monkeypatch):
    from app.config import settings
    import app.adapters.database as db_adapter

    monkeypatch.setattr(settings, "data_dir", tmp_path / ".arcapply")
    monkeypatch.setattr(db_adapter, "_engine", None)

    db_adapter.init_db()

    assert settings.db_path.exists()
    assert settings.db_path.is_file()


def test_profile_stages_extracurriculars_languages_and_pdf():
    payload = {
        "full_name": "Test Engineer",
        "email": "engineer@test.com",
        "experiences": [
            {
                "company": "Alpha Tech",
                "role": "Stagiaire Cloud DevOps",
                "location": "Tunis",
                "start_date": "Juin 2025",
                "end_date": "Août 2025",
                "description": "Automatisation CI/CD et déploiement Kubernetes.",
                "technologies": ["Kubernetes", "Docker", "GitLab CI"],
                "experience_type": "stage",
            },
            {
                "company": "Beta Consulting",
                "role": "Consultant Développeur",
                "location": "Paris",
                "start_date": "Septembre 2025",
                "end_date": "Présent",
                "description": "Développement backend FastAPI.",
                "technologies": ["FastAPI", "Python"],
                "experience_type": "job",
            },
        ],
        "extracurriculars": [
            {
                "organization": "Club Robotique ESPRIT",
                "role": "Responsable Technique",
                "date": "2023 - 2024",
                "description": "Direction des projets et ateliers techniques.",
            }
        ],
        "languages": [
            {"name": "Français", "level": "Courant / C2"},
            {"name": "Anglais", "level": "Technique / B2"},
        ],
    }

    put_res = client.put("/api/profile", json=payload)
    assert put_res.status_code == 200
    data = put_res.json()

    assert len(data["experiences"]) == 2
    assert data["experiences"][0]["experience_type"] == "stage"
    assert data["experiences"][1]["experience_type"] == "job"
    assert len(data["extracurriculars"]) == 1
    assert data["extracurriculars"][0]["organization"] == "Club Robotique ESPRIT"
    assert len(data["languages"]) == 2
    assert data["languages"][0]["name"] == "Français"

    # Test PDF download endpoint
    pdf_res = client.get("/api/cv/profile-pdf?lang=fr")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert "attachment;" in pdf_res.headers["content-disposition"]
    assert len(pdf_res.content) > 1000


def test_byok_groq_api_key_profile_update_and_test_endpoint():
    """Vérifie la persistance de la clé Groq personnelle BYOK et l'endpoint de test."""
    # 1. Mise à jour de la clé personnelle
    res = client.put("/api/profile", json={"groq_api_key": "gsk_test_key_123", "groq_model": "qwen/qwen3.8-27b"})
    assert res.status_code == 200
    data = res.json()
    assert data["groq_api_key"] == "gsk_test_key_123"
    assert data["groq_model"] == "qwen/qwen3.8-27b"

    # 2. Re-lecture du profil
    get_res = client.get("/api/profile")
    assert get_res.status_code == 200
    assert get_res.json()["groq_api_key"] == "gsk_test_key_123"

    # 3. Test endpoint avec clé vide (doit renvoyer 400)
    test_empty = client.post("/api/profile/test-groq-key", json={"groq_api_key": ""})
    assert test_empty.status_code == 400


