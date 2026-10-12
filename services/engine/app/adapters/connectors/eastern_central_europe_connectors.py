from __future__ import annotations

from app.adapters.connectors.base_european import BaseEuropeanWebJobConnector


# ============================================================================
# POLOGNE
# ============================================================================

class NoFluffJobsJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "nofluffjobs"
    default_country = "Poland"
    base_url = "https://nofluffjobs.com"
    search_url_template = "https://nofluffjobs.com/pl/jobs?criteria=requirement%3Dinternship&q={query}"


class JustJoinItJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "justjoin_it"
    default_country = "Poland"
    base_url = "https://justjoin.it"
    search_url_template = "https://justjoin.it/all-locations?keyword={query}"


class PracujPlJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "pracuj_pl"
    default_country = "Poland"
    base_url = "https://www.pracuj.pl"
    search_url_template = "https://www.pracuj.pl/praca/{query};kw"


class RocketJobsJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "rocketjobs"
    default_country = "Poland"
    base_url = "https://rocketjobs.pl"
    search_url_template = "https://rocketjobs.pl/all-locations?keyword={query}"


class AbsolventJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "absolvent"
    default_country = "Poland"
    base_url = "https://www.absolvent.pl"
    search_url_template = "https://www.absolvent.pl/praca?q={query}"


class GoWorkPlJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "gowork_pl"
    default_country = "Poland"
    base_url = "https://www.gowork.pl"
    search_url_template = "https://www.gowork.pl/praca?keywords={query}"


# ============================================================================
# ROUMANIE
# ============================================================================

class EJobsRoJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "ejobs_ro"
    default_country = "Romania"
    base_url = "https://www.ejobs.ro"
    search_url_template = "https://www.ejobs.ro/locuri-de-munca?c={query}"


class BestJobsJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "bestjobs_eu"
    default_country = "Romania"
    base_url = "https://www.bestjobs.eu"
    search_url_template = "https://www.bestjobs.eu/ro/locuri-de-munca?keyword={query}"


class HipoJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "hipo"
    default_country = "Romania"
    base_url = "https://www.hipo.ro"
    search_url_template = "https://www.hipo.ro/locuri-de-munca/cautare_locuri_de_munca/{query}"


class StagiiPeBuneJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "stagiipebune"
    default_country = "Romania"
    base_url = "https://stagiipebune.ro"
    search_url_template = "https://stagiipebune.ro/stagii/?q={query}"


class UndelucramJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "undelucram"
    default_country = "Romania"
    base_url = "https://www.undelucram.ro"
    search_url_template = "https://www.undelucram.ro/locuri-de-munca?q={query}"


class OlxRoJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "olx_ro"
    default_country = "Romania"
    base_url = "https://www.olx.ro"
    search_url_template = "https://www.olx.ro/locuri-de-munca/q-{query}/"


# ============================================================================
# HONGRIE
# ============================================================================

class ProfessionHuJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "profession_hu"
    default_country = "Hungary"
    base_url = "https://www.profession.hu"
    search_url_template = "https://www.profession.hu/allasok?keyword={query}"


class ZynternJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "zyntern"
    default_country = "Hungary"
    base_url = "https://zyntern.com"
    search_url_template = "https://zyntern.com/allasok?q={query}"


class DreamJobsJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "dreamjobs_hu"
    default_country = "Hungary"
    base_url = "https://dreamjobs.hu"
    search_url_template = "https://dreamjobs.hu/allasok?q={query}"


class CvOnlineHuJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "cvonline_hu"
    default_country = "Hungary"
    base_url = "https://www.cvonline.hu"
    search_url_template = "https://www.cvonline.hu/allasok?q={query}"


# ============================================================================
# PAYS BALTES (LITUANIE & LETTONIE)
# ============================================================================

class WorkInLithuaniaJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "workinlithuania"
    default_country = "Lithuania"
    base_url = "https://workinlithuania.com"
    search_url_template = "https://workinlithuania.com/jobs/?search={query}"


class CvBankasJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "cvbankas"
    default_country = "Lithuania"
    base_url = "https://www.cvbankas.lt"
    search_url_template = "https://www.cvbankas.lt/?keyw={query}"


class CvOnlineLtJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "cvonline_lt"
    default_country = "Lithuania"
    base_url = "https://www.cvonline.lt"
    search_url_template = "https://www.cvonline.lt/lt/search?q={query}"


class CvMarketLtJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "cvmarket_lt"
    default_country = "Lithuania"
    base_url = "https://www.cvmarket.lt"
    search_url_template = "https://www.cvmarket.lt/darbo-skelbimai?q={query}"


class CvLvJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "cv_lv"
    default_country = "Latvia"
    base_url = "https://www.cv.lv"
    search_url_template = "https://www.cv.lv/en/search?q={query}"


class CvMarketLvJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "cvmarket_lv"
    default_country = "Latvia"
    base_url = "https://www.cvmarket.lv"
    search_url_template = "https://www.cvmarket.lv/darba-sludinajumi?q={query}"


class VisidarbiJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "visidarbi"
    default_country = "Latvia"
    base_url = "https://www.visidarbi.lv"
    search_url_template = "https://www.visidarbi.lv/meklet?q={query}"


class WorkingDayJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "workingday"
    default_country = "Latvia"
    base_url = "https://www.workingday.lv"
    search_url_template = "https://www.workingday.lv/darba-piedavajumi?q={query}"


# ============================================================================
# BALKANS & EUROPE DU SUD-EST
# ============================================================================

class MojPosaoJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "mojposao"
    default_country = "Croatia"
    base_url = "https://www.moj-posao.net"
    search_url_template = "https://www.moj-posao.net/Pretraga-Poslova/?keyword={query}"


class PosaoHrJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "posao_hr"
    default_country = "Croatia"
    base_url = "https://www.posao.hr"
    search_url_template = "https://www.posao.hr/poslovi/?keywords={query}"


class PickJobsJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "pickjobs"
    default_country = "Croatia"
    base_url = "https://pick.jobs"
    search_url_template = "https://pick.jobs/en/jobs?q={query}"


class InfostudJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "infostud"
    default_country = "Serbia"
    base_url = "https://poslovi.infostud.com"
    search_url_template = "https://poslovi.infostud.com/oglasi-za-posao?kandidati_keywords={query}"


class HelloWorldRsJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "helloworld_rs"
    default_country = "Serbia"
    base_url = "https://www.helloworld.rs"
    search_url_template = "https://www.helloworld.rs/oglasi-za-posao?q={query}"


class StartujJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "startuj"
    default_country = "Serbia"
    base_url = "https://startuj.com"
    search_url_template = "https://startuj.com/oglasi-za-posao?q={query}"


class JobertyJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "joberty"
    default_country = "Serbia"
    base_url = "https://www.joberty.rs"
    search_url_template = "https://www.joberty.rs/poslovi?q={query}"


class DuapuneJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "duapune"
    default_country = "Albania"
    base_url = "https://www.duapune.com"
    search_url_template = "https://www.duapune.com/pune-kerko?keyword={query}"


class NjoftimeJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "njoftime"
    default_country = "Albania"
    base_url = "https://www.njoftime.com"
    search_url_template = "https://www.njoftime.com/search?q={query}"


class JobsBgJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "jobs_bg"
    default_country = "Bulgaria"
    base_url = "https://www.jobs.bg"
    search_url_template = "https://www.jobs.bg/front_job_search.php?keyword={query}"


class JobTigerJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "jobtiger_bg"
    default_country = "Bulgaria"
    base_url = "https://www.jobtiger.bg"
    search_url_template = "https://www.jobtiger.bg/search-jobs/?keyword={query}"


class DevBgJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "dev_bg"
    default_country = "Bulgaria"
    base_url = "https://dev.bg"
    search_url_template = "https://dev.bg/company/jobs/?keyword={query}"


class ZaplataBgJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "zaplata_bg"
    default_country = "Bulgaria"
    base_url = "https://www.zaplata.bg"
    search_url_template = "https://www.zaplata.bg/search/?q={query}"


# ============================================================================
# UKRAINE
# ============================================================================

class WorkUaJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "work_ua"
    default_country = "Ukraine"
    base_url = "https://www.work.ua"
    search_url_template = "https://www.work.ua/jobs-{query}/"


class RobotaUaJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "robota_ua"
    default_country = "Ukraine"
    base_url = "https://robota.ua"
    search_url_template = "https://robota.ua/zapros/{query}/ukraine"


class DjinniJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "djinni"
    default_country = "Ukraine"
    base_url = "https://djinni.co"
    search_url_template = "https://djinni.co/jobs/?keywords={query}"


class DouUaJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "dou_ua"
    default_country = "Ukraine"
    base_url = "https://jobs.dou.ua"
    search_url_template = "https://jobs.dou.ua/vacancies/?search={query}"


class HappyMondayJobConnector(BaseEuropeanWebJobConnector):
    platform_slug = "happymonday"
    default_country = "Ukraine"
    base_url = "https://happymonday.ua"
    search_url_template = "https://happymonday.ua/jobs?search={query}"
