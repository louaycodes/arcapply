from __future__ import annotations

from app.adapters.connectors.base_european import BaseEuropeanWebJobConnector


# ============================================================================
# BELGIQUE
# ============================================================================

class StudentBeJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "student_be"
    default_country = "Belgium"
    base_url = "https://www.student.be"
    search_url_template = "https://www.student.be/fr/stages/?query={query}"


class VDABJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "vdab"
    default_country = "Belgium"
    base_url = "https://www.vdab.be"
    search_url_template = "https://www.vdab.be/vindeenjob/vacatures?trefwoord={query}"


class ActirisJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "actiris"
    default_country = "Belgium"
    base_url = "https://www.actiris.brussels"
    search_url_template = "https://www.actiris.brussels/fr/citoyens/recherche-d-emploi/?q={query}"


class LeForemJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "leforem"
    default_country = "Belgium"
    base_url = "https://www.leforem.be"
    search_url_template = "https://www.leforem.be/recherche-offres/?motsCles={query}"


class JobatJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "jobat"
    default_country = "Belgium"
    base_url = "https://www.jobat.be"
    search_url_template = "https://www.jobat.be/fr/emplois/recherche?keywords={query}"


class StepStoneBeJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "stepstone_be"
    default_country = "Belgium"
    base_url = "https://www.stepstone.be"
    search_url_template = "https://www.stepstone.be/en/jobs--{query}.html"


class TravaillerPourBeJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "travaillerpour_be"
    default_country = "Belgium"
    base_url = "https://travaillerpour.be"
    search_url_template = "https://travaillerpour.be/fr/jobs?search={query}"


class MonPremierJobJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "monpremierjob"
    default_country = "Belgium"
    base_url = "https://monpremierjob.be"
    search_url_template = "https://monpremierjob.be/offres-emploi?q={query}"


# ============================================================================
# PAYS-BAS
# ============================================================================

class MagnetMeJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "magnet_me"
    default_country = "Netherlands"
    base_url = "https://magnet.me"
    search_url_template = "https://magnet.me/en/internships?query={query}"


class StageNlJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "stage_nl"
    default_country = "Netherlands"
    base_url = "https://www.stage.nl"
    search_url_template = "https://www.stage.nl/stages?q={query}"


class YoungCapitalJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "youngcapital"
    default_country = "Netherlands"
    base_url = "https://www.youngcapital.nl"
    search_url_template = "https://www.youngcapital.nl/vacatures?keywords={query}"


class NationaleVacaturebankJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "nationalevacaturebank"
    default_country = "Netherlands"
    base_url = "https://www.nationalevacaturebank.nl"
    search_url_template = "https://www.nationalevacaturebank.nl/vacature/zoeken?query={query}"


class IntermediairJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "intermediair"
    default_country = "Netherlands"
    base_url = "https://www.intermediair.nl"
    search_url_template = "https://www.intermediair.nl/vacatures/zoeken?query={query}"


class AcademicTransferJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "academic_transfer"
    default_country = "Netherlands"
    base_url = "https://www.academictransfer.com"
    search_url_template = "https://www.academictransfer.com/en/jobs/?q={query}"


class IamExpatJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "iamexpat_nl"
    default_country = "Netherlands"
    base_url = "https://www.iamexpat.nl"
    search_url_template = "https://www.iamexpat.nl/career/jobs-netherlands?keyword={query}"


# ============================================================================
# LUXEMBOURG
# ============================================================================

class JobsLuJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "jobs_lu"
    default_country = "Luxembourg"
    base_url = "https://www.jobs.lu"
    search_url_template = "https://www.jobs.lu/en/jobs--{query}.html"


class JobfinderLuJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "jobfinder_lu"
    default_country = "Luxembourg"
    base_url = "https://www.jobfinder.lu"
    search_url_template = "https://www.jobfinder.lu/search?q={query}"


class AdemJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "adem"
    default_country = "Luxembourg"
    base_url = "https://adem.public.lu"
    search_url_template = "https://adem.public.lu/fr/actualites.html?query={query}"


class IctjobLuJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "ictjob_lu"
    default_country = "Luxembourg"
    base_url = "https://www.ictjob.lu"
    search_url_template = "https://www.ictjob.lu/fr/emploi-informatique-recherche?keywords={query}"
