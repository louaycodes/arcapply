from __future__ import annotations

from app.adapters.connectors.base_european import BaseEuropeanWebJobConnector


# ============================================================================
# ALLEMAGNE
# ============================================================================

class PraktikumInfoJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "praktikum_info"
    default_country = "Germany"
    base_url = "https://www.praktikum.info"
    search_url_template = "https://www.praktikum.info/stellenangebote?q={query}"


class MeinPraktikumJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "meinpraktikum"
    default_country = "Germany"
    base_url = "https://www.meinpraktikum.de"
    search_url_template = "https://www.meinpraktikum.de/suche?q={query}"


class PraktikaDeJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "praktika_de"
    default_country = "Germany"
    base_url = "https://www.praktika.de"
    search_url_template = "https://www.praktika.de/stellenmarkt?q={query}"


class ArbeitsagenturJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "arbeitsagentur"
    default_country = "Germany"
    base_url = "https://www.arbeitsagentur.de"
    search_url_template = "https://www.arbeitsagentur.de/jobsuche/suche?angebotsart=4&was={query}"


class MakeItInGermanyJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "make_it_in_germany"
    default_country = "Germany"
    base_url = "https://www.make-it-in-germany.com"
    search_url_template = "https://www.make-it-in-germany.com/en/working-in-germany/job-listings?tx_solr%5Bq%5D={query}"


class StepStoneDeJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "stepstone_de"
    default_country = "Germany"
    base_url = "https://www.stepstone.de"
    search_url_template = "https://www.stepstone.de/en/jobs--{query}.html"


class XingJobsJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "xing_jobs"
    default_country = "Germany"
    base_url = "https://www.xing.com"
    search_url_template = "https://www.xing.com/jobs/search?keywords={query}"


# ============================================================================
# SUISSE
# ============================================================================

class JobScout24JobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "jobscout24_ch"
    default_country = "Switzerland"
    base_url = "https://www.jobscout24.ch"
    search_url_template = "https://www.jobscout24.ch/en/jobs?term={query}"


class JobupJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "jobup_ch"
    default_country = "Switzerland"
    base_url = "https://www.jobup.ch"
    search_url_template = "https://www.jobup.ch/fr/emplois/?term={query}"


class SwissDevJobsConnector(BaseEuropeanWebJobConnector):
    platform_slug = "swissdevjobs"
    default_country = "Switzerland"
    base_url = "https://swissdevjobs.ch"
    search_url_template = "https://swissdevjobs.ch/jobs/{query}"


class IctjobsChJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "ictjobs_ch"
    default_country = "Switzerland"
    base_url = "https://ictjobs.ch"
    search_url_template = "https://ictjobs.ch/search?q={query}"


class EthZurichJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "ethz_jobs"
    default_country = "Switzerland"
    base_url = "https://jobs.ethz.ch"
    search_url_template = "https://jobs.ethz.ch/site/index?q={query}"


class EpflJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "epfl_jobs"
    default_country = "Switzerland"
    base_url = "https://www.epfl.ch"
    search_url_template = "https://www.epfl.ch/about/working/fr/rejoignez-nous/postes-ouverts/?q={query}"
