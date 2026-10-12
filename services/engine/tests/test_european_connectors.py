import pytest
from app.adapters.connectors.finn_no import FinnNoJobConnector
from app.adapters.connectors.jobtech_sweden import JobTechSwedenJobConnector
from app.adapters.connectors.jobs_ch import JobsChJobConnector
from app.adapters.connectors.linkedin import LinkedInJobConnector
from app.adapters.connectors.nav_norway import NAVNorwayJobConnector
from app.adapters.connectors.top100_enterprises import Top100EnterprisesJobConnector
from app.domain.country_resolver import (
    get_country_iso_code,
    get_default_keywords_for_location,
    resolve_country_name,
)
from app.domain.pfe_validator import is_pfe_offer


def test_country_resolver_mappings():
    assert resolve_country_name("Oslo, Norway") == "Norway"
    assert resolve_country_name("Bergen") == "Norway"
    assert resolve_country_name("Stockholm, Sweden") == "Sweden"
    assert resolve_country_name("Zürich, Schweiz") == "Switzerland"
    assert resolve_country_name("Genève") == "Switzerland"
    assert resolve_country_name("Berlin, Germany") == "Germany"
    assert resolve_country_name("Bruxelles, Belgique") == "Belgium"
    assert resolve_country_name("Paris, France") == "France"
    assert resolve_country_name("Tunis, Tunisie") == "Tunisie"

    assert get_country_iso_code("Norway") == "NO"
    assert get_country_iso_code("Sweden") == "SE"
    assert get_country_iso_code("Switzerland") == "CH"
    assert get_country_iso_code("Germany") == "DE"
    assert get_country_iso_code("France") == "FR"
    assert get_country_iso_code("Tunisie") == "TN"

    kw_no = get_default_keywords_for_location("Norway")
    assert any("internship" in k.lower() for k in kw_no)


def test_multilingual_pfe_validator():
    # Norvège & Danemark
    assert is_pfe_offer("Summer Internship 2027", "Software engineering in Oslo")
    assert is_pfe_offer("Masteroppgave innen Data Science", "Equinor master thesis")
    assert is_pfe_offer("Sommerjobb 2026", "Utvikler hos Schibsted")

    # Suède
    assert is_pfe_offer("Exjobb Machine Learning", "Examensarbete i Stockholm")
    assert is_pfe_offer("Praktik mjukvaruutveckling", "Ericsson praktikant")

    # Suisse & Allemagne
    assert is_pfe_offer("Internship Regulatory", "Zürich internship contract")
    assert is_pfe_offer("Praktikum Softwareentwicklung", "München Werkstudent")
    assert is_pfe_offer("Masterarbeit GenAI", "Thesis project")

    # Rejet postes permanents sans mention de stage
    assert not is_pfe_offer("Senior Full-time Software Engineer", "No intern keyword anywhere")


@pytest.mark.asyncio
async def test_nav_norway_connector():
    c = NAVNorwayJobConnector()
    jobs = await c.search_jobs(keywords=["internship"], locations=["Norway"], limit=2)
    assert isinstance(jobs, list)
    assert len(jobs) > 0
    first = jobs[0]
    assert first["platform"] == "nav_norway"
    assert first["country"] == "Norway"
    assert "nav-" in first["external_id"]
    assert first["url"].startswith("http")
    assert len(first["title"]) > 0


@pytest.mark.asyncio
async def test_jobtech_sweden_connector():
    c = JobTechSwedenJobConnector()
    jobs = await c.search_jobs(keywords=["developer"], locations=["Sweden"], limit=2)
    assert isinstance(jobs, list)
    assert len(jobs) > 0
    first = jobs[0]
    assert first["platform"] == "jobtech_sweden"
    assert first["country"] == "Sweden"
    assert first["url"].startswith("http")


@pytest.mark.asyncio
async def test_finn_no_connector():
    c = FinnNoJobConnector()
    jobs = await c.search_jobs(keywords=["internship"], locations=["Norway"], limit=2)
    assert isinstance(jobs, list)
    assert len(jobs) > 0
    first = jobs[0]
    assert first["platform"] == "finn_no"
    assert first["country"] == "Norway"
    assert first["url"].startswith("https://www.finn.no/job/ad/")


@pytest.mark.asyncio
async def test_jobs_ch_connector():
    c = JobsChJobConnector()
    jobs = await c.search_jobs(keywords=["internship"], locations=["Switzerland"], limit=2)
    assert isinstance(jobs, list)
    assert len(jobs) > 0
    first = jobs[0]
    assert first["platform"] == "jobs_ch"
    assert first["country"] == "Switzerland"
    assert first["url"].startswith("https://www.jobs.ch")


@pytest.mark.asyncio
async def test_linkedin_international_norway():
    c = LinkedInJobConnector()
    jobs = await c.search_jobs(keywords=["internship"], locations=["Norway"], limit=2)
    assert isinstance(jobs, list)
    assert len(jobs) > 0
    first = jobs[0]
    assert first["platform"] == "linkedin"
    assert first["country"] == "Norway"
    assert first["url"].startswith("https://")


@pytest.mark.asyncio
async def test_top100_enterprises_european_expansion():
    c = Top100EnterprisesJobConnector()
    jobs = await c.search_jobs(keywords=["engineer"], locations=["Sweden"], limit=2)
    assert isinstance(jobs, list)
    assert len(jobs) > 0
    first = jobs[0]
    assert first["platform"] == "top100_enterprises"
    assert first["country"] in ["Sweden", "Norway", "Switzerland", "France"]
