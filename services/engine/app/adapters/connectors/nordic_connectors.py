from __future__ import annotations

from app.adapters.connectors.base_european import BaseEuropeanWebJobConnector


class TheHubJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "thehub"
    default_country = "Norway"
    base_url = "https://thehub.io"
    search_url_template = "https://thehub.io/jobs?roles=software-engineering&query={query}"


class JobbnorgeJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "jobbnorge"
    default_country = "Norway"
    base_url = "https://www.jobbnorge.no"
    search_url_template = "https://www.jobbnorge.no/ledige-stillinger?q={query}"


class WorkInDenmarkJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "workindenmark"
    default_country = "Denmark"
    base_url = "https://www.workindenmark.dk"
    search_url_template = "https://workindenmark.jobnet.dk/find-job?q={query}"


class JobindexJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "jobindex"
    default_country = "Denmark"
    base_url = "https://www.jobindex.dk"
    search_url_template = "https://www.jobindex.dk/jobsoegning?q={query}"


class JobnetJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "jobnet"
    default_country = "Denmark"
    base_url = "https://jobnet.dk"
    search_url_template = "https://jobnet.dk/CV/FindJob/Search?q={query}"


class GraduatelandJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "graduateland"
    default_country = "Denmark"
    base_url = "https://graduateland.com"
    search_url_template = "https://graduateland.com/jobs?q={query}"


class JobMarketFinlandJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "jobmarket_finland"
    default_country = "Finland"
    base_url = "https://tyomarkkinatori.fi"
    search_url_template = "https://tyomarkkinatori.fi/en/personal-customers/vacancies?q={query}"


class DuunitoriJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "duunitori"
    default_country = "Finland"
    base_url = "https://duunitori.fi"
    search_url_template = "https://duunitori.fi/tyopaikat?haku={query}"


class JoblyFinlandJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "jobly_finland"
    default_country = "Finland"
    base_url = "https://www.jobly.fi"
    search_url_template = "https://www.jobly.fi/tyopaikat?q={query}"


class AcademicPositionsJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "academic_positions"
    default_country = "Finland"
    base_url = "https://academicpositions.com"
    search_url_template = "https://academicpositions.com/jobs?q={query}"


class AcademicWorkJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "academic_work"
    default_country = "Sweden"
    base_url = "https://www.academicwork.se"
    search_url_template = "https://www.academicwork.se/lediga-jobb?q={query}"


class JobbsafariJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "jobbsafari"
    default_country = "Sweden"
    base_url = "https://www.jobbsafari.se"
    search_url_template = "https://www.jobbsafari.se/jobbannonser?q={query}"
