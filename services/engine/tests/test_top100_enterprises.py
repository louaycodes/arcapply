import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.adapters.connectors.top100_enterprises import Top100EnterprisesJobConnector
from app.domain.top100_companies import (
    TOP_100_COMPANIES,
    get_top_companies_by_country,
    get_top_companies_by_ats,
)


def test_top100_companies_catalogue_structure():
    assert len(TOP_100_COMPANIES) >= 40

    # Présence obligatoire de France et Tunisie
    companies_tn = get_top_companies_by_country("Tunisie")
    companies_fr = get_top_companies_by_country("France")
    assert len(companies_tn) >= 10
    assert len(companies_fr) >= 20

    # Vérification des firmes emblématiques
    names = [c["name"] for c in TOP_100_COMPANIES]
    assert any("EY" in n for n in names)
    assert any("InstaDeep" in n for n in names)
    assert any("Vermeg" in n for n in names)
    assert any("Capgemini" in n for n in names)
    assert any("Google" in n for n in names)
    assert any("Talan" in n for n in names)
    assert any("Thales" in n for n in names)


def test_top100_enterprises_connector_properties():
    connector = Top100EnterprisesJobConnector()
    assert connector.platform_name == "top100_enterprises"


@pytest.mark.asyncio
async def test_top100_enterprises_greenhouse_crawling():
    connector = Top100EnterprisesJobConnector()

    mock_greenhouse_response = {
        "jobs": [
            {
                "id": 12345,
                "title": "Stage PFE - Deep Learning & Reinforcement Learning",
                "content": "<p>Rejoignez notre équipe R&D pour un stage de 6 mois sur l'apprentissage par renforcement. Stack: Python, PyTorch.</p>",
                "location": {"name": "Tunis, Tunisia"},
                "updated_at": "2026-03-25T10:00:00Z",
                "absolute_url": "https://boards.greenhouse.io/instadeep/jobs/12345",
                "departments": [{"name": "AI Research"}],
            },
            {
                "id": 67890,
                "title": "Senior Sales Executive (Irrelevant)",
                "content": "<p>Experience in sales needed.</p>",
                "location": {"name": "London, UK"},
                "updated_at": "2026-03-20T10:00:00Z",
                "absolute_url": "https://boards.greenhouse.io/instadeep/jobs/67890",
            },
        ]
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_greenhouse_response

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp

    company_mock = {
        "id": "instadeep",
        "name": "InstaDeep (BioNTech)",
        "country": "Tunisie",
        "portal_id": "instadeep",
        "careers_url": "https://instadeep.com/careers",
    }

    jobs = await connector._crawl_greenhouse_board(
        client=mock_client,
        company=company_mock,
        keywords=["pfe", "stage", "deep learning"],
        max_items=5,
    )

    assert len(jobs) == 1
    job = jobs[0]
    assert job["external_id"] == "gh-instadeep-12345"
    assert "Deep Learning" in job["title"]
    assert job["company"] == "InstaDeep (BioNTech)"
    assert job["country"] == "Tunisie"
    assert job["is_direct_career_site"] is True
    assert "Python, PyTorch" in job["description_raw"]
    assert job["apply_url"] == "https://boards.greenhouse.io/instadeep/jobs/12345"


@pytest.mark.asyncio
async def test_top100_enterprises_lever_crawling():
    connector = Top100EnterprisesJobConnector()

    mock_lever_response = [
        {
            "id": "lev-999",
            "text": "Internship - Software Engineer Backend (PFE)",
            "descriptionPlain": "We are seeking a backend intern to work on Cloud microservices.",
            "categories": {"location": "Paris, France", "team": "Engineering"},
            "createdAt": 1774500000000,
            "hostedUrl": "https://jobs.lever.co/expensya/lev-999",
            "applyUrl": "https://jobs.lever.co/expensya/lev-999/apply",
        }
    ]

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_lever_response

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp

    company_mock = {
        "id": "expensya",
        "name": "Expensya (Medius)",
        "country": "France",
        "portal_id": "expensya",
    }

    jobs = await connector._crawl_lever_board(
        client=mock_client,
        company=company_mock,
        keywords=["internship", "pfe"],
        max_items=5,
    )

    assert len(jobs) == 1
    job = jobs[0]
    assert job["external_id"] == "lev-expensya-lev-999"
    assert job["company"] == "Expensya (Medius)"
    assert job["is_direct_career_site"] is True
    assert job["country"] == "France"
    assert "Cloud microservices" in job["description_raw"]
