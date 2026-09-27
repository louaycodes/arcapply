import pytest
from app.adapters.connectors.jobteaser import JobteaserJobConnector
from app.adapters.connectors.keejob import KeejobJobConnector
from app.adapters.connectors.linkedin import LinkedInJobConnector
from app.adapters.connectors.tanitjobs import TanitjobsJobConnector
from app.adapters.connectors.tunisietravail import TunisieTravailJobConnector
from app.adapters.connectors.unjeuneunesolution import UnJeuneUneSolutionJobConnector
from app.adapters.connectors.wttj import WTTJJobConnector
from tests.conftest import client


@pytest.mark.asyncio
async def test_tunisia_connectors_output_structure():
    # 1. Keejob
    kee = KeejobJobConnector()
    kee_jobs = await kee.search_jobs(keywords=["pfe"], locations=["Tunisie"], limit=3)
    assert isinstance(kee_jobs, list)
    assert len(kee_jobs) > 0
    assert kee_jobs[0]["platform"] == "keejob"
    assert kee_jobs[0]["country"] == "Tunisie"
    assert "title" in kee_jobs[0]
    assert "company" in kee_jobs[0]

    # 2. TunisieTravail
    tt = TunisieTravailJobConnector()
    tt_jobs = await tt.search_jobs(keywords=["pfe"], locations=["Tunisie"], limit=3)
    assert isinstance(tt_jobs, list)
    assert len(tt_jobs) > 0
    assert tt_jobs[0]["platform"] == "tunisietravail"
    assert tt_jobs[0]["country"] == "Tunisie"

    # 3. Tanitjobs
    tanit = TanitjobsJobConnector()
    tanit_jobs = await tanit.search_jobs(keywords=["pfe"], locations=["Tunisie"], limit=3)
    assert isinstance(tanit_jobs, list)
    assert len(tanit_jobs) > 0
    assert tanit_jobs[0]["platform"] == "tanitjobs"
    assert tanit_jobs[0]["country"] == "Tunisie"


@pytest.mark.asyncio
async def test_france_connectors_output_structure():
    # 1. LinkedIn
    li = LinkedInJobConnector()
    li_jobs = await li.search_jobs(keywords=["stage", "pfe"], locations=["France"], limit=3)
    assert isinstance(li_jobs, list)
    assert len(li_jobs) > 0
    assert li_jobs[0]["platform"] == "linkedin"

    # 2. WTTJ
    wttj = WTTJJobConnector()
    wttj_jobs = await wttj.search_jobs(keywords=["pfe"], locations=["France"], limit=3)
    assert isinstance(wttj_jobs, list)
    assert len(wttj_jobs) > 0
    assert wttj_jobs[0]["platform"] == "wttj"
    assert wttj_jobs[0]["country"] == "France"

    # 3. 1jeune1solution
    ujs = UnJeuneUneSolutionJobConnector()
    ujs_jobs = await ujs.search_jobs(keywords=["pfe"], locations=["France"], limit=3)
    assert isinstance(ujs_jobs, list)
    assert len(ujs_jobs) > 0
    assert ujs_jobs[0]["platform"] == "1jeune1solution"


def test_sources_status_endpoint():
    res = client.get("/api/jobs/sources")
    assert res.status_code == 200
    data = res.json()
    assert "registered_connectors" in data
    connectors = data["registered_connectors"]
    assert "linkedin" in connectors
    assert "keejob" in connectors
    assert "tunisietravail" in connectors
    assert "tanitjobs" in connectors
    assert "wttj" in connectors
    assert "1jeune1solution" in connectors
    assert data["total_connectors"] >= 7


def test_crawl_all_endpoint_deduplication():
    # Premier crawl avec 2 plateformes rapides
    payload = {
        "keywords": ["PFE"],
        "locations": ["Tunisie", "France"],
        "platforms": ["wttj", "tanitjobs"],
    }
    res1 = client.post("/api/jobs/crawl-all", json=payload)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["status"] == "completed"
    assert data1["new_count"] > 0
    new_first = data1["new_count"]

    # Deuxième crawl immédiat : toutes doivent être détectées comme doublons
    res2 = client.post("/api/jobs/crawl-all", json=payload)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["new_count"] == 0
    assert data2["duplicate_count"] >= new_first
