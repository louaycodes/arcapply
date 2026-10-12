from __future__ import annotations

from app.adapters.connectors.base_european import BaseEuropeanWebJobConnector


class EuresJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "eures"
    default_country = "Europe"
    base_url = "https://eures.europa.eu"
    search_url_template = "https://eures.europa.eu/eures-services/online-services/find-job_en?keywords={query}"


class ErasmusInternJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "erasmusintern"
    default_country = "Europe"
    base_url = "https://erasmusintern.org"
    search_url_template = "https://erasmusintern.org/traineeships?search={query}"


class EUCareersJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "eu_careers"
    default_country = "Europe"
    base_url = "https://eu-careers.europa.eu"
    search_url_template = "https://eu-careers.europa.eu/en/job-opportunities/open-vacancies?keyword={query}"


class BlueBookJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "blue_book"
    default_country = "Europe"
    base_url = "https://traineeships.ec.europa.eu"
    search_url_template = "https://traineeships.ec.europa.eu/index_en"


class EuropeanJobDaysJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "european_job_days"
    default_country = "Europe"
    base_url = "https://europeanjobdays.eu"
    search_url_template = "https://europeanjobdays.eu/en/jobs?keywords={query}"


class GlassdoorJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "glassdoor"
    default_country = "Europe"
    base_url = "https://www.glassdoor.com"
    search_url_template = "https://www.glassdoor.com/Job/jobs.htm?sc.keyword={query}"


class JoobleJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "jooble"
    default_country = "Europe"
    base_url = "https://jooble.org"
    search_url_template = "https://jooble.org/SearchResult?ukw={query}"


class AdzunaJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "adzuna"
    default_country = "Europe"
    base_url = "https://www.adzuna.com"
    search_url_template = "https://www.adzuna.com/search?q={query}"


class EuroJobsJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "eurojobs"
    default_country = "Europe"
    base_url = "https://eurojobs.com"
    search_url_template = "https://eurojobs.com/search-results-jobs/?search_keywords={query}"


class IAgoraJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "iagora"
    default_country = "Europe"
    base_url = "https://www.iagora.com"
    search_url_template = "https://www.iagora.com/jobs/search?q={query}"


class StudentJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "studentjob"
    default_country = "Europe"
    base_url = "https://www.studentjob.com"
    search_url_template = "https://www.studentjob.com/search?q={query}"


class EuroBrusselsJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "eurobrussels"
    default_country = "Europe"
    base_url = "https://www.eurobrussels.com"
    search_url_template = "https://www.eurobrussels.com/jobs?q={query}"


class EuractivJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "euractiv"
    default_country = "Europe"
    base_url = "https://jobs.euractiv.com"
    search_url_template = "https://jobs.euractiv.com/search?q={query}"


class PiktalentJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "piktalent"
    default_country = "Europe"
    base_url = "https://piktalent.com"
    search_url_template = "https://piktalent.com/en/search-internships?keyword={query}"


class EuroplacementJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "europlacement"
    default_country = "Europe"
    base_url = "https://www.europlacement.com"
    search_url_template = "https://www.europlacement.com/search?keywords={query}"
