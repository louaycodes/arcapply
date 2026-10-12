from __future__ import annotations

from app.adapters.connectors.base_european import BaseEuropeanWebJobConnector


# ============================================================================
# ITALIE
# ============================================================================

class AlmaLaureaJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "almalaurea"
    default_country = "Italy"
    base_url = "https://www.almalaurea.it"
    search_url_template = "https://www.almalaurea.it/annunci?q={query}"


class CliclavoroJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "cliclavoro"
    default_country = "Italy"
    base_url = "https://www.cliclavoro.gov.it"
    search_url_template = "https://www.cliclavoro.gov.it/Pagine/Dettaglio-Offerta.aspx?q={query}"


class InfoJobsItJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "infojobs_it"
    default_country = "Italy"
    base_url = "https://www.infojobs.it"
    search_url_template = "https://www.infojobs.it/offerte-lavoro?keyword={query}"


class MonsterItJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "monster_it"
    default_country = "Italy"
    base_url = "https://www.monster.it"
    search_url_template = "https://www.monster.it/lavoro/cerca?q={query}"



# ============================================================================
# ESPAGNE
# ============================================================================

class InfoJobsEsJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "infojobs_es"
    default_country = "Spain"
    base_url = "https://www.infojobs.net"
    search_url_template = "https://www.infojobs.net/jobsearch/search-results/list.xhtml?keyword={query}"


class PrimerEmpleoJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "primerempleo"
    default_country = "Spain"
    base_url = "https://www.primerempleo.com"
    search_url_template = "https://www.primerempleo.com/empleo/buscar.php?q={query}"


class StudentJobEsJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "studentjob_es"
    default_country = "Spain"
    base_url = "https://www.studentjob.es"
    search_url_template = "https://www.studentjob.es/trabajo?query={query}"


class TecnoempleoJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "tecnoempleo"
    default_country = "Spain"
    base_url = "https://www.tecnoempleo.com"
    search_url_template = "https://www.tecnoempleo.com/busqueda-empleo.php?te={query}"


class EmpleateJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "empleate"
    default_country = "Spain"
    base_url = "https://www.empleate.gob.es"
    search_url_template = "https://www.empleate.gob.es/empleo/#/ofertas?textoLibre={query}"


# ============================================================================
# GRÈCE
# ============================================================================

class KarieraGrJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "kariera_gr"
    default_country = "Greece"
    base_url = "https://www.kariera.gr"
    search_url_template = "https://www.kariera.gr/en/jobs?keywords={query}"


class SkywalkerGrJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "skywalker_gr"
    default_country = "Greece"
    base_url = "https://www.skywalker.gr"
    search_url_template = "https://www.skywalker.gr/el/search?q={query}"


class JobfindGrJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "jobfind_gr"
    default_country = "Greece"
    base_url = "https://www.jobfind.gr"
    search_url_template = "https://www.jobfind.gr/JobSearch?keywords={query}"


class WorkathlonJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "workathlon"
    default_country = "Greece"
    base_url = "https://www.workathlon.com"
    search_url_template = "https://www.workathlon.com/jobs?q={query}"


# ============================================================================
# ANDORRE & MONACO
# ============================================================================

class ServeiOcupacioAndorraJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "treball_ad"
    default_country = "Andorra"
    base_url = "https://www.treball.ad"
    search_url_template = "https://www.treball.ad/ofertes-de-treball?q={query}"


class FeinaActivaJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "feinaactiva"
    default_country = "Andorra"
    base_url = "https://feinaactiva.gencat.cat"
    search_url_template = "https://feinaactiva.gencat.cat/ofertes-de-treball?cerca={query}"


class MonacoEmploiJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "monaco_emploi"
    default_country = "Monaco"
    base_url = "https://monaco-emploi.mc"
    search_url_template = "https://monaco-emploi.mc/offres?q={query}"


class JobsMcJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "jobs_mc"
    default_country = "Monaco"
    base_url = "https://www.jobs.mc"
    search_url_template = "https://www.jobs.mc/jobs?q={query}"
