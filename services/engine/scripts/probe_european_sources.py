import asyncio
import json
import re
import time
from typing import Any
import httpx

SOURCES = [
    # 1. Sources européennes communes
    {"id": "eures", "name": "EURES", "country": "Europe", "url": "https://eures.europa.eu/"},
    {"id": "erasmusintern", "name": "ErasmusIntern", "country": "Europe", "url": "https://erasmusintern.org/"},
    {"id": "eu_careers", "name": "EU Careers (EPSO)", "country": "Europe", "url": "https://eu-careers.europa.eu/"},
    {"id": "blue_book", "name": "Blue Book Traineeships", "country": "Europe", "url": "https://traineeships.ec.europa.eu/"},
    {"id": "european_job_days", "name": "European Job Days", "country": "Europe", "url": "https://europeanjobdays.eu/"},
    {"id": "linkedin_jobs", "name": "LinkedIn Jobs", "country": "Global", "url": "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=internship&location=Norway"},
    {"id": "indeed_global", "name": "Indeed Global", "country": "Global", "url": "https://www.indeed.com/"},
    {"id": "glassdoor", "name": "Glassdoor", "country": "Global", "url": "https://www.glassdoor.com/"},
    {"id": "jooble_global", "name": "Jooble", "country": "Global", "url": "https://jooble.org/"},
    {"id": "adzuna_global", "name": "Adzuna", "country": "Global", "url": "https://www.adzuna.com/"},
    {"id": "eurojobs", "name": "EuroJobs", "country": "Europe", "url": "https://eurojobs.com/"},
    {"id": "iagora", "name": "iAgora", "country": "Europe", "url": "https://www.iagora.com/"},
    {"id": "studentjob", "name": "StudentJob", "country": "Europe", "url": "https://www.studentjob.com/"},
    {"id": "jobteaser", "name": "JobTeaser", "country": "Europe", "url": "https://www.jobteaser.com/"},
    {"id": "wttj", "name": "Welcome to the Jungle", "country": "Europe", "url": "https://www.welcometothejungle.com/fr/jobs?query=internship"},

    # Luxembourg
    {"id": "moovijob", "name": "Moovijob", "country": "Luxembourg", "url": "https://www.moovijob.com/"},
    {"id": "jobs_lu", "name": "Jobs.lu", "country": "Luxembourg", "url": "https://www.jobs.lu/"},
    {"id": "jobfinder_lu", "name": "Jobfinder.lu", "country": "Luxembourg", "url": "https://www.jobfinder.lu/"},
    {"id": "adem", "name": "ADEM", "country": "Luxembourg", "url": "https://adem.public.lu/"},
    {"id": "ictjob_lu", "name": "ICTjob.lu", "country": "Luxembourg", "url": "https://www.ictjob.lu/"},
    {"id": "indeed_lu", "name": "Indeed Luxembourg", "country": "Luxembourg", "url": "https://lu.indeed.com/"},

    # Belgique
    {"id": "student_be", "name": "Student.be", "country": "Belgique", "url": "https://www.student.be/fr/stages/"},
    {"id": "vdab", "name": "VDAB", "country": "Belgique", "url": "https://www.vdab.be/vindeenjob/jobs/stagiair"},
    {"id": "actiris", "name": "Actiris", "country": "Belgique", "url": "https://www.actiris.brussels/"},
    {"id": "leforem", "name": "Le Forem", "country": "Belgique", "url": "https://www.leforem.be/"},
    {"id": "jobat", "name": "Jobat", "country": "Belgique", "url": "https://www.jobat.be/"},
    {"id": "stepstone_be", "name": "StepStone Belgique", "country": "Belgique", "url": "https://www.stepstone.be/"},
    {"id": "indeed_be", "name": "Indeed Belgique", "country": "Belgique", "url": "https://be.indeed.com/"},
    {"id": "travaillerpour_be", "name": "Travaillerpour.be", "country": "Belgique", "url": "https://travaillerpour.be/"},
    {"id": "monpremierjob", "name": "MonPremierJob", "country": "Belgique", "url": "https://monpremierjob.be/"},

    # Italie
    {"id": "almalaurea", "name": "AlmaLaurea", "country": "Italie", "url": "https://www.almalaurea.it/"},
    {"id": "cliclavoro", "name": "Cliclavoro", "country": "Italie", "url": "https://www.cliclavoro.gov.it/focus-on/formazione/tirocini-e-stage"},
    {"id": "infojobs_it", "name": "InfoJobs Italia", "country": "Italie", "url": "https://www.infojobs.it/"},
    {"id": "indeed_it", "name": "Indeed Italie", "country": "Italie", "url": "https://it.indeed.com/"},
    {"id": "monster_it", "name": "Monster Italie", "country": "Italie", "url": "https://www.monster.it/"},
    {"id": "jooble_it", "name": "Jooble Italie", "country": "Italie", "url": "https://it.jooble.org/"},

    # Espagne
    {"id": "infojobs_es", "name": "InfoJobs España", "country": "Espagne", "url": "https://www.infojobs.net/"},
    {"id": "primerempleo", "name": "Primer Empleo", "country": "Espagne", "url": "https://www.primerempleo.com/"},
    {"id": "studentjob_es", "name": "StudentJob Espagne", "country": "Espagne", "url": "https://www.studentjob.es/"},
    {"id": "tecnoempleo", "name": "Tecnoempleo", "country": "Espagne", "url": "https://www.tecnoempleo.com/"},
    {"id": "empleate", "name": "Empléate", "country": "Espagne", "url": "https://www.empleate.gob.es/"},
    {"id": "indeed_es", "name": "Indeed Espagne", "country": "Espagne", "url": "https://es.indeed.com/"},

    # Allemagne
    {"id": "praktikum_info", "name": "Praktikum.info", "country": "Allemagne", "url": "https://www.praktikum.info/"},
    {"id": "meinpraktikum", "name": "MeinPraktikum.de", "country": "Allemagne", "url": "https://www.meinpraktikum.de/"},
    {"id": "praktika_de", "name": "Praktika.de", "country": "Allemagne", "url": "https://www.praktika.de/"},
    {"id": "arbeitsagentur", "name": "Bundesagentur für Arbeit", "country": "Allemagne", "url": "https://www.arbeitsagentur.de/jobsuche/"},
    {"id": "make_it_in_germany", "name": "Make it in Germany", "country": "Allemagne", "url": "https://www.make-it-in-germany.com/"},
    {"id": "stepstone_de", "name": "StepStone Allemagne", "country": "Allemagne", "url": "https://www.stepstone.de/"},
    {"id": "xing_jobs", "name": "XING Jobs", "country": "Allemagne", "url": "https://www.xing.com/jobs"},
    {"id": "indeed_de", "name": "Indeed Allemagne", "country": "Allemagne", "url": "https://de.indeed.com/"},

    # Irlande
    {"id": "gradireland", "name": "GradIreland", "country": "Irlande", "url": "https://gradireland.com/"},
    {"id": "irishjobs", "name": "IrishJobs", "country": "Irlande", "url": "https://www.irishjobs.ie/"},
    {"id": "jobs_ie", "name": "Jobs.ie", "country": "Irlande", "url": "https://www.jobs.ie/"},
    {"id": "jobsireland", "name": "JobsIreland", "country": "Irlande", "url": "https://jobsireland.ie/"},
    {"id": "indeed_ie", "name": "Indeed Irlande", "country": "Irlande", "url": "https://ie.indeed.com/"},
    {"id": "prospects", "name": "Prospects", "country": "Irlande / UK", "url": "https://www.prospects.ac.uk/"},
    {"id": "bright_network", "name": "Bright Network", "country": "Irlande / UK", "url": "https://www.brightnetwork.co.uk/"},

    # Écosse / UK
    {"id": "gradcracker", "name": "Gradcracker", "country": "UK", "url": "https://www.gradcracker.com/"},
    {"id": "ratemyplacement", "name": "RateMyPlacement", "country": "UK", "url": "https://www.ratemyplacement.co.uk/"},
    {"id": "student_circus", "name": "Student Circus", "country": "UK", "url": "https://www.studentcircus.com/"},
    {"id": "myjobscotland", "name": "myjobscotland", "country": "Écosse", "url": "https://www.myjobscotland.gov.uk/"},
    {"id": "s1jobs", "name": "s1jobs", "country": "Écosse", "url": "https://www.s1jobs.com/"},
    {"id": "gov_uk_find_job", "name": "Find a Job GOV.UK", "country": "UK", "url": "https://www.gov.uk/find-a-job"},
    {"id": "indeed_uk", "name": "Indeed UK", "country": "UK", "url": "https://uk.indeed.com/"},

    # Roumanie
    {"id": "ejobs_ro", "name": "eJobs Roumanie", "country": "Roumanie", "url": "https://www.ejobs.ro/"},
    {"id": "bestjobs_eu", "name": "BestJobs", "country": "Roumanie", "url": "https://www.bestjobs.eu/"},
    {"id": "hipo", "name": "Hipo", "country": "Roumanie", "url": "https://www.hipo.ro/"},
    {"id": "stagiipebune", "name": "Stagii pe Bune", "country": "Roumanie", "url": "https://stagiipebune.ro/"},
    {"id": "undelucram", "name": "Undelucram", "country": "Roumanie", "url": "https://www.undelucram.ro/"},
    {"id": "olx_ro", "name": "OLX Roumanie", "country": "Roumanie", "url": "https://www.olx.ro/locuri-de-munca/"},
    {"id": "indeed_ro", "name": "Indeed Roumanie", "country": "Roumanie", "url": "https://ro.indeed.com/"},

    # Hongrie
    {"id": "profession_hu", "name": "Profession.hu", "country": "Hongrie", "url": "https://www.profession.hu/"},
    {"id": "zyntern", "name": "Zyntern", "country": "Hongrie", "url": "https://zyntern.com/"},
    {"id": "dreamjobs_hu", "name": "DreamJobs", "country": "Hongrie", "url": "https://dreamjobs.hu/"},
    {"id": "cvonline_hu", "name": "CVonline.hu", "country": "Hongrie", "url": "https://www.cvonline.hu/"},
    {"id": "nofluffjobs", "name": "No Fluff Jobs", "country": "Hongrie / Pologne", "url": "https://nofluffjobs.com/"},
    {"id": "indeed_hu", "name": "Indeed Hongrie", "country": "Hongrie", "url": "https://hu.indeed.com/"},

    # Pays-Bas
    {"id": "magnet_me", "name": "Magnet.me", "country": "Pays-Bas", "url": "https://magnet.me/en/internships"},
    {"id": "stage_nl", "name": "Stage.nl", "country": "Pays-Bas", "url": "https://www.stage.nl/"},
    {"id": "youngcapital", "name": "YoungCapital", "country": "Pays-Bas", "url": "https://www.youngcapital.nl/"},
    {"id": "nationalevacaturebank", "name": "Nationale Vacaturebank", "country": "Pays-Bas", "url": "https://www.nationalevacaturebank.nl/"},
    {"id": "intermediair", "name": "Intermediair", "country": "Pays-Bas", "url": "https://www.intermediair.nl/"},
    {"id": "academictransfer", "name": "AcademicTransfer", "country": "Pays-Bas", "url": "https://www.academictransfer.com/"},
    {"id": "iamexpat_nl", "name": "IamExpat Jobs", "country": "Pays-Bas", "url": "https://www.iamexpat.nl/career/jobs-netherlands"},
    {"id": "indeed_nl", "name": "Indeed Pays-Bas", "country": "Pays-Bas", "url": "https://nl.indeed.com/"},

    # Lituanie
    {"id": "cvbankas", "name": "CVbankas", "country": "Lituanie", "url": "https://www.cvbankas.lt/"},
    {"id": "cvonline_lt", "name": "CVOnline Lituanie", "country": "Lituanie", "url": "https://www.cvonline.lt/"},
    {"id": "cvmarket_lt", "name": "CVMarket Lituanie", "country": "Lituanie", "url": "https://www.cvmarket.lt/"},
    {"id": "workinlithuania", "name": "Work in Lithuania", "country": "Lituanie", "url": "https://workinlithuania.com/"},

    # Lettonie
    {"id": "cv_lv", "name": "CV.lv", "country": "Lettonie", "url": "https://www.cv.lv/"},
    {"id": "cvmarket_lv", "name": "CVMarket.lv", "country": "Lettonie", "url": "https://www.cvmarket.lv/"},
    {"id": "visidarbi", "name": "Visidarbi.lv", "country": "Lettonie", "url": "https://www.visidarbi.lv/"},
    {"id": "workingday", "name": "WorkingDay", "country": "Lettonie", "url": "https://www.workingday.lv/"},

    # Suisse
    {"id": "jobs_ch", "name": "jobs.ch", "country": "Suisse", "url": "https://www.jobs.ch/en/vacancies/?term=Internships"},
    {"id": "jobscout24_ch", "name": "JobScout24 Suisse", "country": "Suisse", "url": "https://www.jobscout24.ch/"},
    {"id": "jobup_ch", "name": "Jobup", "country": "Suisse", "url": "https://www.jobup.ch/"},
    {"id": "swissdevjobs", "name": "SwissDev Jobs", "country": "Suisse", "url": "https://swissdevjobs.ch/"},
    {"id": "ictjobs_ch", "name": "ICTjobs.ch", "country": "Suisse", "url": "https://ictjobs.ch/"},
    {"id": "ethz_jobs", "name": "ETH Zürich Jobs", "country": "Suisse", "url": "https://jobs.ethz.ch/"},
    {"id": "epfl_jobs", "name": "EPFL Emplois", "country": "Suisse", "url": "https://www.epfl.ch/about/working/fr/"},
    {"id": "indeed_ch", "name": "Indeed Suisse", "country": "Suisse", "url": "https://ch.indeed.com/"},

    # Croatie
    {"id": "mojposao", "name": "MojPosao", "country": "Croatie", "url": "https://www.moj-posao.net/"},
    {"id": "posao_hr", "name": "Posao.hr", "country": "Croatie", "url": "https://www.posao.hr/"},
    {"id": "pickjobs", "name": "PickJobs", "country": "Croatie", "url": "https://pick.jobs/"},

    # Grèce
    {"id": "kariera_gr", "name": "Kariera.gr", "country": "Grèce", "url": "https://www.kariera.gr/"},
    {"id": "skywalker_gr", "name": "Skywalker.gr", "country": "Grèce", "url": "https://www.skywalker.gr/"},
    {"id": "jobfind_gr", "name": "Jobfind.gr", "country": "Grèce", "url": "https://www.jobfind.gr/"},
    {"id": "workathlon", "name": "Workathlon", "country": "Grèce", "url": "https://www.workathlon.com/"},
    {"id": "indeed_gr", "name": "Indeed Grèce", "country": "Grèce", "url": "https://gr.indeed.com/"},

    # Serbie
    {"id": "infostud", "name": "Infostud Poslovi", "country": "Serbie", "url": "https://poslovi.infostud.com/"},
    {"id": "helloworld_rs", "name": "HelloWorld.rs", "country": "Serbie", "url": "https://www.helloworld.rs/"},
    {"id": "startuj", "name": "Startuj.com", "country": "Serbie", "url": "https://startuj.com/"},
    {"id": "joberty", "name": "Joberty", "country": "Serbie", "url": "https://www.joberty.rs/"},
    {"id": "jooble_rs", "name": "Jooble Serbie", "country": "Serbie", "url": "https://rs.jooble.org/"},

    # Albanie
    {"id": "duapune", "name": "Duapune", "country": "Albanie", "url": "https://www.duapune.com/"},
    {"id": "njoftime", "name": "Njoftime", "country": "Albanie", "url": "https://www.njoftime.com/"},

    # Andorre
    {"id": "treball_ad", "name": "Servei d'Ocupació d'Andorra", "country": "Andorre", "url": "https://www.treball.ad/"},
    {"id": "feinaactiva", "name": "Feina Activa", "country": "Catalogne / Andorre", "url": "https://feinaactiva.gencat.cat/"},

    # Monaco
    {"id": "monaco_emploi", "name": "Monaco pour l'emploi", "country": "Monaco", "url": "https://monaco-emploi.mc/"},
    {"id": "jobs_mc", "name": "Jobs.mc", "country": "Monaco", "url": "https://www.jobs.mc/"},

    # Bulgarie
    {"id": "jobs_bg", "name": "Jobs.bg", "country": "Bulgarie", "url": "https://www.jobs.bg/"},
    {"id": "jobtiger_bg", "name": "JobTiger", "country": "Bulgarie", "url": "https://www.jobtiger.bg/"},
    {"id": "dev_bg", "name": "Dev.bg", "country": "Bulgarie", "url": "https://dev.bg/"},
    {"id": "zaplata_bg", "name": "Zaplata.bg", "country": "Bulgarie", "url": "https://www.zaplata.bg/"},

    # Pologne
    {"id": "pracuj_pl", "name": "Pracuj.pl", "country": "Pologne", "url": "https://www.pracuj.pl/"},
    {"id": "justjoin_it", "name": "Just Join IT", "country": "Pologne", "url": "https://justjoin.it/"},
    {"id": "rocketjobs", "name": "RocketJobs", "country": "Pologne", "url": "https://rocketjobs.pl/"},
    {"id": "absolvent", "name": "Absolvent.pl", "country": "Pologne", "url": "https://www.absolvent.pl/"},
    {"id": "gowork_pl", "name": "GoWork.pl", "country": "Pologne", "url": "https://www.gowork.pl/"},
    {"id": "indeed_pl", "name": "Indeed Pologne", "country": "Pologne", "url": "https://pl.indeed.com/"},

    # Danemark
    {"id": "jobindex_dk", "name": "Jobindex", "country": "Danemark", "url": "https://www.jobindex.dk/"},
    {"id": "workindenmark", "name": "Work in Denmark", "country": "Danemark", "url": "https://www.workindenmark.dk/"},
    {"id": "jobnet_dk", "name": "Jobnet", "country": "Danemark", "url": "https://jobnet.dk/"},
    {"id": "thehub_nordics", "name": "The Hub Nordics", "country": "Danemark / Nordics", "url": "https://thehub.io/jobs"},
    {"id": "graduateland", "name": "Graduateland", "country": "Danemark / Europe", "url": "https://graduateland.com/"},
    {"id": "indeed_dk", "name": "Indeed Danemark", "country": "Danemark", "url": "https://dk.indeed.com/"},

    # Norvège
    {"id": "finn_no", "name": "FINN Jobb", "country": "Norvège", "url": "https://www.finn.no/job/search?q=internship"},
    {"id": "nav_arbeidsplassen", "name": "Arbeidsplassen (NAV)", "country": "Norvège", "url": "https://arbeidsplassen.nav.no/stillinger"},
    {"id": "jobbnorge", "name": "Jobbnorge", "country": "Norvège", "url": "https://www.jobbnorge.no/"},
    {"id": "indeed_no", "name": "Indeed Norvège", "country": "Norvège", "url": "https://no.indeed.com/"},

    # Finlande
    {"id": "duunitori", "name": "Duunitori", "country": "Finlande", "url": "https://duunitori.fi/"},
    {"id": "jobmarket_fi", "name": "Job Market Finland", "country": "Finlande", "url": "https://tyomarkkinatori.fi/en"},
    {"id": "jobly_fi", "name": "Jobly Finlande", "country": "Finlande", "url": "https://www.jobly.fi/"},
    {"id": "academicpositions", "name": "Academic Positions", "country": "Finlande / Nordics", "url": "https://academicpositions.com/"},
    {"id": "indeed_fi", "name": "Indeed Finlande", "country": "Finlande", "url": "https://fi.indeed.com/"},

    # Suède
    {"id": "platsbanken_se", "name": "Platsbanken (Arbetsförmedlingen)", "country": "Suède", "url": "https://arbetsformedlingen.se/platsbanken/"},
    {"id": "jobbsafari_se", "name": "Jobbsafari", "country": "Suède", "url": "https://www.jobbsafari.se/"},
    {"id": "academicwork_se", "name": "Academic Work", "country": "Suède", "url": "https://www.academicwork.se/"},
    {"id": "indeed_se", "name": "Indeed Suède", "country": "Suède", "url": "https://se.indeed.com/"},

    # Ukraine
    {"id": "work_ua", "name": "Work.ua", "country": "Ukraine", "url": "https://www.work.ua/"},
    {"id": "robota_ua", "name": "Robota.ua", "country": "Ukraine", "url": "https://robota.ua/zapros/internships/ukraine"},
    {"id": "djinni_co", "name": "Djinni", "country": "Ukraine", "url": "https://djinni.co/jobs/?keywords=intern"},
    {"id": "dou_ua", "name": "DOU.ua", "country": "Ukraine", "url": "https://jobs.dou.ua/"},
    {"id": "happymonday", "name": "Happy Monday", "country": "Ukraine", "url": "https://happymonday.ua/"},

    # Sources supplémentaires
    {"id": "eurobrussels", "name": "EuroBrussels", "country": "Europe", "url": "https://www.eurobrussels.com/"},
    {"id": "euractiv", "name": "EURACTIV Jobs", "country": "Europe", "url": "https://jobs.euractiv.com/"},
    {"id": "piktalent", "name": "Piktalent", "country": "Europe", "url": "https://piktalent.com/"},
    {"id": "europlacement", "name": "Europlacement", "country": "Europe", "url": "https://europlacement.com/"},
]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7",
}

async def probe_source(client: httpx.AsyncClient, source: dict[str, str], sem: asyncio.Semaphore) -> dict[str, Any]:
    async with sem:
        url = source["url"]
        result = {
            "id": source["id"],
            "name": source["name"],
            "country": source["country"],
            "url": url,
            "status_code": None,
            "final_url": None,
            "accessible": False,
            "scrapable_strategy": "UNKNOWN",
            "anti_bot_detected": None,
            "server": None,
            "response_time_ms": 0,
            "error": None,
        }
        t0 = time.time()
        try:
            resp = await client.get(url, headers=HEADERS)
            duration = int((time.time() - t0) * 1000)
            result["response_time_ms"] = duration
            result["status_code"] = resp.status_code
            result["final_url"] = str(resp.url)
            headers_lower = {k.lower(): v for k, v in resp.headers.items()}
            result["server"] = headers_lower.get("server", "unknown")

            text_snippet = resp.text[:4000].lower()

            # Anti-bot detection
            is_cf = "cf-ray" in headers_lower or "cloudflare" in headers_lower.get("server", "").lower()
            is_cf_block = is_cf and ("just a moment..." in text_snippet or "attention required" in text_snippet or resp.status_code in (403, 503))
            is_akamai = "akamai" in headers_lower.get("server", "").lower() or "access denied" in text_snippet and resp.status_code == 403
            is_datadome = "datadome" in headers_lower or "datadome" in text_snippet
            is_perimeterx = "perimeterx" in text_snippet or "px-captcha" in text_snippet

            if is_cf_block:
                result["anti_bot_detected"] = "Cloudflare Challenge / Block"
            elif is_akamai:
                result["anti_bot_detected"] = "Akamai WAF"
            elif is_datadome:
                result["anti_bot_detected"] = "DataDome"
            elif is_perimeterx:
                result["anti_bot_detected"] = "PerimeterX / HUMAN"

            if resp.status_code in (200, 206, 301, 302, 307, 308):
                if not result["anti_bot_detected"]:
                    result["accessible"] = True
                    # Check if HTML has structured jobs or SSR content
                    if len(resp.text) > 2000 and ("job" in text_snippet or "stage" in text_snippet or "offre" in text_snippet or "career" in text_snippet or "search" in text_snippet):
                        result["scrapable_strategy"] = "HTTP Direct (BS4 / JSON)"
                    else:
                        result["scrapable_strategy"] = "HTTP Direct (SPA / Rendered JS or API)"
                else:
                    result["accessible"] = False
                    result["scrapable_strategy"] = "Playwright Stealth / API Requise"
            elif resp.status_code == 403:
                result["scrapable_strategy"] = "Anti-Bot (Requiert Playwright / API Dédiée)"
            elif resp.status_code == 429:
                result["scrapable_strategy"] = "Rate Limit (Jitter & Proxies requis)"
            else:
                result["scrapable_strategy"] = f"HTTP {resp.status_code}"

        except httpx.ConnectTimeout:
            result["error"] = "Connect Timeout"
            result["scrapable_strategy"] = "Timeout / Blocage Réseau"
        except httpx.ReadTimeout:
            result["error"] = "Read Timeout"
            result["scrapable_strategy"] = "Timeout (Lenteur serveur)"
        except httpx.ConnectError as e:
            result["error"] = f"Connect Error ({str(e)[:40]})"
            result["scrapable_strategy"] = "Inaccessible (DNS / Port)"
        except Exception as e:
            result["error"] = f"Exception: {str(e)[:60]}"
            result["scrapable_strategy"] = "Erreur Inconnue"

        return result

async def main():
    print(f"[*] Démarrage du scan de {len(SOURCES)} plateformes d'emploi européennes...")
    sem = asyncio.Semaphore(12)  # max 12 requêtes simultanées
    timeout = httpx.Timeout(10.0, connect=6.0)

    # Disable SSL verification issues on government/legacy certs if necessary
    limits = httpx.Limits(max_connections=20, max_keepalive_connections=15)
    async with httpx.AsyncClient(timeout=timeout, limits=limits, follow_redirects=True, verify=False) as client:
        tasks = [probe_source(client, src, sem) for src in SOURCES]
        results = await asyncio.gather(*tasks)

    # Sauvegarde du rapport JSON
    output_path = "european_sources_audit.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    accessible_count = sum(1 for r in results if r["accessible"])
    blocked_count = sum(1 for r in results if not r["accessible"])
    print(f"[+] Scan terminé : {accessible_count}/{len(results)} accessibles en HTTP Direct.")
    print(f"[+] Résultats sauvegardés dans {output_path}")

if __name__ == "__main__":
    asyncio.run(main())
