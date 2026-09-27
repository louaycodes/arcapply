import pytest
from app.adapters.connectors.aneti import AnetiJobConnector
from app.adapters.connectors.apec import ApecJobConnector
from app.adapters.connectors.cadremploi import CadremploiJobConnector
from app.adapters.connectors.capdigital import CapDigitalJobConnector
from app.adapters.connectors.chooseyourboss import ChooseYourBossJobConnector
from app.adapters.connectors.emploitunisie import EmploiTunisieJobConnector
from app.adapters.connectors.esndirect import ESNDirectJobConnector
from app.adapters.connectors.hellowork import HelloWorkJobConnector
from app.adapters.connectors.indeed import IndeedJobConnector
from app.adapters.connectors.jobteaser import JobteaserJobConnector
from app.adapters.connectors.keejob import KeejobJobConnector
from app.adapters.connectors.letudiant import LEtudiantJobConnector
from app.adapters.connectors.linkedin import LinkedInJobConnector
from app.adapters.connectors.meteojob import MeteojobJobConnector
from app.adapters.connectors.monster import MonsterJobConnector
from app.adapters.connectors.moovijob import MoovijobJobConnector
from app.adapters.connectors.numeum import NumeumJobConnector
from app.adapters.connectors.offreemploitn import OffreEmploiTnJobConnector
from app.adapters.connectors.optioncarriere import OptionCarriereJobConnector
from app.adapters.connectors.stagetunisie import StageTunisieJobConnector
from app.adapters.connectors.stagiairesfr import StagiairesFrJobConnector
from app.adapters.connectors.stackoverflowjobs import StackOverflowJobsJobConnector
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

    # 2. TunisieTravail
    tt = TunisieTravailJobConnector()
    tt_jobs = await tt.search_jobs(keywords=["pfe"], locations=["Tunisie"], limit=3)
    assert isinstance(tt_jobs, list)
    assert len(tt_jobs) > 0
    assert tt_jobs[0]["platform"] == "tunisietravail"

    # 3. Tanitjobs
    tanit = TanitjobsJobConnector()
    tanit_jobs = await tanit.search_jobs(keywords=["pfe"], locations=["Tunisie"], limit=3)
    assert isinstance(tanit_jobs, list)
    assert len(tanit_jobs) > 0
    assert tanit_jobs[0]["platform"] == "tanitjobs"

    # 4. EmploiTunisie
    et = EmploiTunisieJobConnector()
    et_jobs = await et.search_jobs(keywords=["pfe"], locations=["Tunisie"], limit=2)
    assert isinstance(et_jobs, list)
    assert len(et_jobs) > 0
    assert et_jobs[0]["platform"] == "emploitunisie"

    # 5. StageTunisie
    st = StageTunisieJobConnector()
    st_jobs = await st.search_jobs(keywords=["pfe"], locations=["Tunisie"], limit=2)
    assert isinstance(st_jobs, list)
    assert len(st_jobs) > 0
    assert st_jobs[0]["platform"] == "stagetunisie"

    # 6. OptionCarriere Tunisie
    oc = OptionCarriereJobConnector()
    oc_jobs = await oc.search_jobs(keywords=["pfe"], locations=["Tunisie"], limit=2)
    assert isinstance(oc_jobs, list)
    assert len(oc_jobs) > 0
    assert oc_jobs[0]["platform"] == "optioncarriere"

    # 7. ANETI
    an = AnetiJobConnector()
    an_jobs = await an.search_jobs(keywords=["pfe"], locations=["Tunisie"], limit=2)
    assert isinstance(an_jobs, list)
    assert len(an_jobs) > 0
    assert an_jobs[0]["platform"] == "aneti"

    # 8. Offre-Emploi.tn
    oet = OffreEmploiTnJobConnector()
    oet_jobs = await oet.search_jobs(keywords=["pfe"], locations=["Tunisie"], limit=2)
    assert isinstance(oet_jobs, list)
    assert len(oet_jobs) > 0
    assert oet_jobs[0]["platform"] == "offre_emploi_tn"


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

    # 3. 1jeune1solution
    ujs = UnJeuneUneSolutionJobConnector()
    ujs_jobs = await ujs.search_jobs(keywords=["pfe"], locations=["France"], limit=3)
    assert isinstance(ujs_jobs, list)
    assert len(ujs_jobs) > 0
    assert ujs_jobs[0]["platform"] == "1jeune1solution"

    # 4. HelloWork
    hw = HelloWorkJobConnector()
    hw_jobs = await hw.search_jobs(keywords=["stage", "pfe"], locations=["France"], limit=2)
    assert isinstance(hw_jobs, list)
    assert len(hw_jobs) > 0
    assert hw_jobs[0]["platform"] == "hellowork"

    # 5. Indeed
    ind = IndeedJobConnector()
    ind_jobs = await ind.search_jobs(keywords=["stage", "pfe"], locations=["France"], limit=2)
    assert isinstance(ind_jobs, list)
    assert len(ind_jobs) > 0
    assert ind_jobs[0]["platform"] == "indeed"

    # 6. Apec
    ap = ApecJobConnector()
    ap_jobs = await ap.search_jobs(keywords=["stage", "pfe"], locations=["France"], limit=2)
    assert isinstance(ap_jobs, list)
    assert len(ap_jobs) > 0
    assert ap_jobs[0]["platform"] == "apec"

    # 7. Moovijob
    moov = MoovijobJobConnector()
    moov_jobs = await moov.search_jobs(keywords=["stage", "pfe"], locations=["France"], limit=2)
    assert isinstance(moov_jobs, list)
    assert len(moov_jobs) > 0
    assert moov_jobs[0]["platform"] == "moovijob"

    # 8. ESN Direct
    esn = ESNDirectJobConnector()
    esn_jobs = await esn.search_jobs(keywords=["stage", "pfe"], locations=["France"], limit=2)
    assert isinstance(esn_jobs, list)
    assert len(esn_jobs) > 0
    assert esn_jobs[0]["platform"] == "esn_direct"

    # 9. Monster
    mon = MonsterJobConnector()
    mon_jobs = await mon.search_jobs(keywords=["stage", "pfe"], locations=["France"], limit=2)
    assert len(mon_jobs) > 0
    assert mon_jobs[0]["platform"] == "monster"

    # 10. Stagiaires.fr
    stg = StagiairesFrJobConnector()
    stg_jobs = await stg.search_jobs(keywords=["stage", "pfe"], locations=["France"], limit=2)
    assert len(stg_jobs) > 0
    assert stg_jobs[0]["platform"] == "stagiaires_fr"

    # 11. Cadremploi
    cad = CadremploiJobConnector()
    cad_jobs = await cad.search_jobs(keywords=["stage", "pfe"], locations=["France"], limit=2)
    assert len(cad_jobs) > 0
    assert cad_jobs[0]["platform"] == "cadremploi"

    # 12. Meteojob
    met = MeteojobJobConnector()
    met_jobs = await met.search_jobs(keywords=["stage", "pfe"], locations=["France"], limit=2)
    assert len(met_jobs) > 0
    assert met_jobs[0]["platform"] == "meteojob"

    # 13. L'Etudiant
    let = LEtudiantJobConnector()
    let_jobs = await let.search_jobs(keywords=["stage", "pfe"], locations=["France"], limit=2)
    assert len(let_jobs) > 0
    assert let_jobs[0]["platform"] == "letudiant"

    # 14. ChooseYourBoss
    cyb = ChooseYourBossJobConnector()
    cyb_jobs = await cyb.search_jobs(keywords=["stage", "pfe"], locations=["France"], limit=2)
    assert len(cyb_jobs) > 0
    assert cyb_jobs[0]["platform"] == "chooseyourboss"

    # 15. StackOverflow Jobs
    so = StackOverflowJobsJobConnector()
    so_jobs = await so.search_jobs(keywords=["stage", "pfe"], locations=["Global"], limit=2)
    assert len(so_jobs) > 0
    assert so_jobs[0]["platform"] == "stackoverflow_jobs"

    # 16. Numeum
    num = NumeumJobConnector()
    num_jobs = await num.search_jobs(keywords=["stage", "pfe"], locations=["France"], limit=2)
    assert len(num_jobs) > 0
    assert num_jobs[0]["platform"] == "numeum"

    # 17. Cap Digital
    cap = CapDigitalJobConnector()
    cap_jobs = await cap.search_jobs(keywords=["stage", "pfe"], locations=["France"], limit=2)
    assert len(cap_jobs) > 0
    assert cap_jobs[0]["platform"] == "capdigital"


def test_sources_status_endpoint():
    res = client.get("/api/jobs/sources")
    assert res.status_code == 200
    data = res.json()
    assert "registered_connectors" in data
    connectors = data["registered_connectors"]
    # Vérification des plateformes majeures
    assert "linkedin" in connectors
    assert "keejob" in connectors
    assert "tunisietravail" in connectors
    assert "tanitjobs" in connectors
    assert "emploitunisie" in connectors
    assert "stagetunisie" in connectors
    assert "optioncarriere" in connectors
    assert "aneti" in connectors
    assert "offre_emploi_tn" in connectors
    assert "wttj" in connectors
    assert "1jeune1solution" in connectors
    assert "hellowork" in connectors
    assert "indeed" in connectors
    assert "apec" in connectors
    assert "moovijob" in connectors
    assert "monster" in connectors
    assert "stagiaires_fr" in connectors
    assert "cadremploi" in connectors
    assert "meteojob" in connectors
    assert "letudiant" in connectors
    assert "chooseyourboss" in connectors
    assert "stackoverflow_jobs" in connectors
    assert "esn_direct" in connectors
    assert "numeum" in connectors
    assert "capdigital" in connectors
    assert data["total_connectors"] >= 26


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
