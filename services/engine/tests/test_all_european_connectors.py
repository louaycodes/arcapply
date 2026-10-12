import pytest
from app.adapters.scheduler import ALL_CONNECTORS
from app.adapters.connectors.base_european import BaseEuropeanWebJobConnector
from app.domain.pfe_validator import is_pfe_offer

SAMPLE_JOB_HTML = """
<!DOCTYPE html>
<html>
<body>
    <div class="jobs-list">
        <article class="job-card">
            <h2 class="job-title"><a href="/jobs/pfe-data-science-123">Stage PFE Data Science & IA</a></h2>
            <div class="company-name">Tech Corp Europe</div>
            <span class="location">Brussels, Belgium</span>
            <p class="description">Stage ingénieur fin d'études 6 mois sur des modèles de deep learning.</p>
        </article>
        <article class="job-card">
            <h2 class="job-title"><a href="/jobs/intern-swe-456">Software Engineering Trainee</a></h2>
            <div class="company-name">Nordic Digital</div>
            <span class="location">Oslo, Norway</span>
            <p class="description">Master thesis internship in backend systems.</p>
        </article>
    </div>
</body>
</html>
"""

def test_all_expected_platforms_registered():
    """Vérifie que toutes les plateformes européennes demandées sont présentes dans ALL_CONNECTORS."""
    expected_slugs = [
        # Portails Européens
        "eures", "erasmusintern", "eu_careers", "blue_book", "european_job_days",
        "glassdoor", "jooble", "adzuna", "eurojobs", "iagora", "studentjob",
        "eurobrussels", "euractiv", "piktalent", "europlacement",
        # Luxembourg
        "jobs_lu", "jobfinder_lu", "adem", "ictjob_lu",
        # Belgique
        "student_be", "vdab", "actiris", "leforem", "jobat", "stepstone_be",
        "travaillerpour_be", "monpremierjob",
        # Italie
        "almalaurea", "cliclavoro", "infojobs_it", "monster_it",
        # Espagne
        "infojobs_es", "primerempleo", "studentjob_es", "tecnoempleo", "empleate",
        # Allemagne
        "praktikum_info", "meinpraktikum", "praktika_de", "arbeitsagentur",
        "make_it_in_germany", "stepstone_de", "xing_jobs",
        # Irlande
        "gradireland", "irishjobs", "jobs_ie", "jobsireland", "prospects", "bright_network",
        # UK / Ecosse
        "gradcracker", "ratemyplacement", "student_circus", "myjobscotland", "s1jobs", "gov_uk",
        # Pays-Bas
        "magnet_me", "stage_nl", "youngcapital", "nationalevacaturebank", "intermediair",
        "academic_transfer", "iamexpat_nl",
        # Suisse
        "jobscout24_ch", "jobup_ch", "swissdevjobs", "ictjobs_ch", "ethz_jobs", "epfl_jobs",
        # Danemark
        "jobindex", "workindenmark", "jobnet", "thehub", "graduateland",
        # Norvège
        "jobbnorge", "finn_no", "nav_norway",
        # Suède
        "jobbsafari", "academic_work", "jobtech_sweden",
        # Finlande
        "duunitori", "jobmarket_finland", "jobly_finland", "academic_positions",
        # Pologne
        "pracuj_pl", "nofluffjobs", "justjoin_it", "rocketjobs", "absolvent", "gowork_pl",
        # Roumanie
        "ejobs_ro", "bestjobs_eu", "hipo", "stagiipebune", "undelucram", "olx_ro",
        # Hongrie
        "profession_hu", "zyntern", "dreamjobs_hu", "cvonline_hu",
        # Lituanie & Lettonie
        "cvbankas", "cvonline_lt", "cvmarket_lt", "workinlithuania",
        "cv_lv", "cvmarket_lv", "visidarbi", "workingday",
        # Croatie & Serbie
        "mojposao", "posao_hr", "pickjobs", "infostud", "helloworld_rs", "startuj", "joberty",
        # Grèce & Albanie
        "kariera_gr", "skywalker_gr", "jobfind_gr", "workathlon", "duapune", "njoftime",
        # Bulgarie & Ukraine
        "jobs_bg", "jobtiger_bg", "dev_bg", "zaplata_bg", "work_ua", "robota_ua", "djinni", "dou_ua", "happymonday",
        # Andorre & Monaco
        "treball_ad", "feinaactiva", "monaco_emploi", "jobs_mc"
    ]

    for slug in expected_slugs:
        assert slug in ALL_CONNECTORS, f"Connecteur manquant dans ALL_CONNECTORS: {slug}"
        connector_cls = ALL_CONNECTORS[slug]
        instance = connector_cls()
        assert instance.platform_name is not None
        assert len(instance.platform_name) > 0


def test_base_european_card_parser():
    """Vérifie l'algorithme d'extraction de cartes d'offres HTML sans régression."""
    connector = BaseEuropeanWebJobConnector()
    seen_ids = set()
    items = connector.parse_html_cards(
        html_text=SAMPLE_JOB_HTML,
        current_url="https://example.com/search",
        max_items=10,
        seen_ids=seen_ids,
    )

    assert len(items) == 2
    first = items[0]
    assert first["title"] == "Stage PFE Data Science & IA"
    assert first["company"] == "Tech Corp Europe"
    assert first["country"] == "Belgium"
    assert first["url"] == "https://example.com/jobs/pfe-data-science-123"

    second = items[1]
    assert second["title"] == "Software Engineering Trainee"
    assert second["company"] == "Nordic Digital"
    assert second["country"] == "Norway"
    assert second["url"] == "https://example.com/jobs/intern-swe-456"


def test_multilingual_pfe_validation_eastern_and_southern():
    """Valide les détections PFE pour l'Europe du Sud et de l'Est."""
    # Espagne
    assert is_pfe_offer("Prácticas Desarrollo Web", "Empresa en Madrid busca becario")
    # Italie
    assert is_pfe_offer("Tirocinio Ingegneria Informatica", "Stage 6 mesi a Milano")
    # Pologne
    assert is_pfe_offer("Praktyki Java Developer", "Płatny staż w Warszawie")
    # Roumanie
    assert is_pfe_offer("Stagiu de practica Python", "Internship Cluj-Napoca")
