from __future__ import annotations

from app.adapters.connectors.base_european import BaseEuropeanWebJobConnector


# ============================================================================
# ROYAUME-UNI & ÉCOSSE
# ============================================================================

class GradcrackerJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "gradcracker"
    default_country = "United Kingdom"
    base_url = "https://www.gradcracker.com"
    search_url_template = "https://www.gradcracker.com/search/all-disciplines/work-placements-internships?keyword={query}"


class RateMyPlacementJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "ratemyplacement"
    default_country = "United Kingdom"
    base_url = "https://www.ratemyplacement.co.uk"
    search_url_template = "https://www.ratemyplacement.co.uk/search?q={query}"


class BrightNetworkJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "bright_network"
    default_country = "United Kingdom"
    base_url = "https://www.brightnetwork.co.uk"
    search_url_template = "https://www.brightnetwork.co.uk/search/?q={query}"


class ProspectsJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "prospects"
    default_country = "United Kingdom"
    base_url = "https://www.prospects.ac.uk"
    search_url_template = "https://www.prospects.ac.uk/graduate-jobs?keyword={query}"


class StudentCircusJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "student_circus"
    default_country = "United Kingdom"
    base_url = "https://www.studentcircus.com"
    search_url_template = "https://www.studentcircus.com/jobs?q={query}"


class MyJobScotlandJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "myjobscotland"
    default_country = "United Kingdom"
    base_url = "https://www.myjobscotland.gov.uk"
    search_url_template = "https://www.myjobscotland.gov.uk/search?keyword={query}"


class S1jobsJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "s1jobs"
    default_country = "United Kingdom"
    base_url = "https://www.s1jobs.com"
    search_url_template = "https://www.s1jobs.com/jobs/search?keywords={query}"


class GovUkJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "gov_uk"
    default_country = "United Kingdom"
    base_url = "https://www.gov.uk"
    search_url_template = "https://www.gov.uk/find-a-job?q={query}"


# ============================================================================
# IRLANDE
# ============================================================================

class GradIrelandJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "gradireland"
    default_country = "Ireland"
    base_url = "https://gradireland.com"
    search_url_template = "https://gradireland.com/graduate-jobs/search?keywords={query}"


class IrishJobsJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "irishjobs"
    default_country = "Ireland"
    base_url = "https://www.irishjobs.ie"
    search_url_template = "https://www.irishjobs.ie/en/jobs--{query}.html"


class JobsIeJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "jobs_ie"
    default_country = "Ireland"
    base_url = "https://www.jobs.ie"
    search_url_template = "https://www.jobs.ie/jobs?keywords={query}"


class JobsIrelandJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "jobsireland"
    default_country = "Ireland"
    base_url = "https://jobsireland.ie"
    search_url_template = "https://jobsireland.ie/en-US/SearchJobs?keyword={query}"
