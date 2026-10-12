import asyncio
from datetime import datetime, timezone
from typing import Any
from sqlmodel import Session, select
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
from app.adapters.connectors.top100_enterprises import Top100EnterprisesJobConnector
from app.adapters.connectors.wttj import WTTJJobConnector
from app.adapters.connectors.nav_norway import NAVNorwayJobConnector
from app.adapters.connectors.finn_no import FinnNoJobConnector
from app.adapters.connectors.jobtech_sweden import JobTechSwedenJobConnector
from app.adapters.connectors.jobs_ch import JobsChJobConnector

# Connecteurs Européens Communs & Institutionnels
from app.adapters.connectors.european_common import (
    EuresJobConnector, ErasmusInternJobConnector, EUCareersJobConnector,
    BlueBookJobConnector, EuropeanJobDaysJobConnector, GlassdoorJobConnector,
    JoobleJobConnector, AdzunaJobConnector, EuroJobsJobConnector,
    IAgoraJobConnector, StudentJobConnector, EuroBrusselsJobConnector,
    EuractivJobConnector, PiktalentJobConnector, EuroplacementJobConnector,
)

# Connecteurs Régionaux Nordiques
from app.adapters.connectors.nordic_connectors import (
    TheHubJobConnector, JobbnorgeJobConnector, WorkInDenmarkJobConnector,
    JobindexJobConnector, JobnetJobConnector, GraduatelandJobConnector,
    JobMarketFinlandJobConnector, DuunitoriJobConnector, JoblyFinlandJobConnector,
    AcademicPositionsJobConnector, AcademicWorkJobConnector, JobbsafariJobConnector,
)

# Connecteurs Régionaux Benelux
from app.adapters.connectors.benelux_connectors import (
    StudentBeJobConnector, VDABJobConnector, ActirisJobConnector,
    LeForemJobConnector, JobatJobConnector, StepStoneBeJobConnector,
    TravaillerPourBeJobConnector, MonPremierJobJobConnector, MagnetMeJobConnector,
    StageNlJobConnector, YoungCapitalJobConnector, NationaleVacaturebankJobConnector,
    IntermediairJobConnector, AcademicTransferJobConnector, IamExpatJobConnector,
    JobsLuJobConnector, JobfinderLuJobConnector, AdemJobConnector, IctjobLuJobConnector,
)

# Connecteurs Régionaux DACH (Allemagne & Suisse)
from app.adapters.connectors.dach_connectors import (
    PraktikumInfoJobConnector, MeinPraktikumJobConnector, PraktikaDeJobConnector,
    ArbeitsagenturJobConnector, MakeItInGermanyJobConnector, StepStoneDeJobConnector,
    XingJobsJobConnector, JobScout24JobConnector, JobupJobConnector,
    SwissDevJobsConnector, IctjobsChJobConnector, EthZurichJobConnector, EpflJobConnector,
)

# Connecteurs Régionaux UK & Irlande
from app.adapters.connectors.uk_ireland_connectors import (
    GradcrackerJobConnector, RateMyPlacementJobConnector, BrightNetworkJobConnector,
    ProspectsJobConnector, StudentCircusJobConnector, MyJobScotlandJobConnector,
    S1jobsJobConnector, GovUkJobConnector, GradIrelandJobConnector,
    IrishJobsJobConnector, JobsIeJobConnector, JobsIrelandJobConnector,
)

# Connecteurs Régionaux Europe du Sud
from app.adapters.connectors.southern_europe_connectors import (
    AlmaLaureaJobConnector, CliclavoroJobConnector, InfoJobsItJobConnector, MonsterItJobConnector,
    InfoJobsEsJobConnector, PrimerEmpleoJobConnector, StudentJobEsJobConnector,
    TecnoempleoJobConnector, EmpleateJobConnector, KarieraGrJobConnector,
    SkywalkerGrJobConnector, JobfindGrJobConnector, WorkathlonJobConnector,
    ServeiOcupacioAndorraJobConnector, FeinaActivaJobConnector,
    MonacoEmploiJobConnector, JobsMcJobConnector,
)

# Connecteurs Régionaux Europe Centrale & Orientale
from app.adapters.connectors.eastern_central_europe_connectors import (
    NoFluffJobsJobConnector, JustJoinItJobConnector, PracujPlJobConnector,
    RocketJobsJobConnector, AbsolventJobConnector, GoWorkPlJobConnector,
    EJobsRoJobConnector, BestJobsJobConnector, HipoJobConnector,
    StagiiPeBuneJobConnector, UndelucramJobConnector, OlxRoJobConnector,
    ProfessionHuJobConnector, ZynternJobConnector, DreamJobsJobConnector,
    CvOnlineHuJobConnector, WorkInLithuaniaJobConnector, CvBankasJobConnector,
    CvOnlineLtJobConnector, CvMarketLtJobConnector, CvLvJobConnector,
    CvMarketLvJobConnector, VisidarbiJobConnector, WorkingDayJobConnector,
    MojPosaoJobConnector, PosaoHrJobConnector, PickJobsJobConnector,
    InfostudJobConnector, HelloWorldRsJobConnector, StartujJobConnector,
    JobertyJobConnector, DuapuneJobConnector, NjoftimeJobConnector,
    JobsBgJobConnector, JobTigerJobConnector, DevBgJobConnector, ZaplataBgJobConnector,
    WorkUaJobConnector, RobotaUaJobConnector, DjinniJobConnector,
    DouUaJobConnector, HappyMondayJobConnector,
)

from app.adapters.database import get_engine
from app.api.events import broadcast_event
from app.adapters.connectors import infer_offer_type, is_pfe_offer
from app.domain.anti_rescrape import is_job_already_applied, is_job_already_archived, is_job_excluded_from_scraping
from app.domain.country_resolver import resolve_country_name, is_location_matching_target
from app.domain.deduplication import JobDeduplicationIndex
from app.domain.job_extractor import JobDeepExtractor
from app.domain.language_detector import detect_job_language
from app.domain.models import JobOffer, MasterProfile, utc_now
from app.ports.connectors import BaseJobConnector

ALL_CONNECTORS: dict[str, type[BaseJobConnector]] = {
    # Top 100 Entreprises IT (Portails Carrieres Dedies & ATS direct)
    "top100_enterprises": Top100EnterprisesJobConnector,
    # International & Global
    "linkedin": LinkedInJobConnector,
    "stackoverflow_jobs": StackOverflowJobsJobConnector,
    # Norvège & Nordics
    "nav_norway": NAVNorwayJobConnector,
    "finn_no": FinnNoJobConnector,
    "thehub": TheHubJobConnector,
    "jobbnorge": JobbnorgeJobConnector,
    # Suède
    "jobtech_sweden": JobTechSwedenJobConnector,
    "academic_work": AcademicWorkJobConnector,
    "jobbsafari": JobbsafariJobConnector,
    # Danemark
    "workindenmark": WorkInDenmarkJobConnector,
    "jobindex": JobindexJobConnector,
    "jobnet": JobnetJobConnector,
    "graduateland": GraduatelandJobConnector,
    # Finlande
    "jobmarket_finland": JobMarketFinlandJobConnector,
    "duunitori": DuunitoriJobConnector,
    "jobly_finland": JoblyFinlandJobConnector,
    "academic_positions": AcademicPositionsJobConnector,
    # Suisse
    "jobs_ch": JobsChJobConnector,
    "jobscout24_ch": JobScout24JobConnector,
    "jobup_ch": JobupJobConnector,
    "swissdevjobs": SwissDevJobsConnector,
    "ictjobs_ch": IctjobsChJobConnector,
    "ethz_jobs": EthZurichJobConnector,
    "epfl_jobs": EpflJobConnector,
    # Allemagne
    "praktikum_info": PraktikumInfoJobConnector,
    "meinpraktikum": MeinPraktikumJobConnector,
    "praktika_de": PraktikaDeJobConnector,
    "arbeitsagentur": ArbeitsagenturJobConnector,
    "make_it_in_germany": MakeItInGermanyJobConnector,
    "stepstone_de": StepStoneDeJobConnector,
    "xing_jobs": XingJobsJobConnector,
    # Belgique
    "student_be": StudentBeJobConnector,
    "vdab": VDABJobConnector,
    "actiris": ActirisJobConnector,
    "leforem": LeForemJobConnector,
    "jobat": JobatJobConnector,
    "stepstone_be": StepStoneBeJobConnector,
    "travaillerpour_be": TravaillerPourBeJobConnector,
    "monpremierjob": MonPremierJobJobConnector,
    # Pays-Bas
    "magnet_me": MagnetMeJobConnector,
    "stage_nl": StageNlJobConnector,
    "youngcapital": YoungCapitalJobConnector,
    "nationalevacaturebank": NationaleVacaturebankJobConnector,
    "intermediair": IntermediairJobConnector,
    "academic_transfer": AcademicTransferJobConnector,
    "iamexpat_nl": IamExpatJobConnector,
    # Luxembourg
    "jobs_lu": JobsLuJobConnector,
    "jobfinder_lu": JobfinderLuJobConnector,
    "adem": AdemJobConnector,
    "ictjob_lu": IctjobLuJobConnector,
    # Royaume-Uni & Écosse
    "gradcracker": GradcrackerJobConnector,
    "ratemyplacement": RateMyPlacementJobConnector,
    "bright_network": BrightNetworkJobConnector,
    "prospects": ProspectsJobConnector,
    "student_circus": StudentCircusJobConnector,
    "myjobscotland": MyJobScotlandJobConnector,
    "s1jobs": S1jobsJobConnector,
    "gov_uk": GovUkJobConnector,
    # Irlande
    "gradireland": GradIrelandJobConnector,
    "irishjobs": IrishJobsJobConnector,
    "jobs_ie": JobsIeJobConnector,
    "jobsireland": JobsIrelandJobConnector,
    # Italie
    "almalaurea": AlmaLaureaJobConnector,
    "cliclavoro": CliclavoroJobConnector,
    "infojobs_it": InfoJobsItJobConnector,
    "monster_it": MonsterItJobConnector,
    # Espagne
    "infojobs_es": InfoJobsEsJobConnector,
    "primerempleo": PrimerEmpleoJobConnector,
    "studentjob_es": StudentJobEsJobConnector,
    "tecnoempleo": TecnoempleoJobConnector,
    "empleate": EmpleateJobConnector,
    # Grèce
    "kariera_gr": KarieraGrJobConnector,
    "skywalker_gr": SkywalkerGrJobConnector,
    "jobfind_gr": JobfindGrJobConnector,
    "workathlon": WorkathlonJobConnector,
    # Andorre & Monaco
    "treball_ad": ServeiOcupacioAndorraJobConnector,
    "feinaactiva": FeinaActivaJobConnector,
    "monaco_emploi": MonacoEmploiJobConnector,
    "jobs_mc": JobsMcJobConnector,
    # Pologne
    "nofluffjobs": NoFluffJobsJobConnector,
    "justjoin_it": JustJoinItJobConnector,
    "pracuj_pl": PracujPlJobConnector,
    "rocketjobs": RocketJobsJobConnector,
    "absolvent": AbsolventJobConnector,
    "gowork_pl": GoWorkPlJobConnector,
    # Roumanie
    "ejobs_ro": EJobsRoJobConnector,
    "bestjobs_eu": BestJobsJobConnector,
    "hipo": HipoJobConnector,
    "stagiipebune": StagiiPeBuneJobConnector,
    "undelucram": UndelucramJobConnector,
    "olx_ro": OlxRoJobConnector,
    # Hongrie
    "profession_hu": ProfessionHuJobConnector,
    "zyntern": ZynternJobConnector,
    "dreamjobs_hu": DreamJobsJobConnector,
    "cvonline_hu": CvOnlineHuJobConnector,
    # Pays Baltes (Lituanie & Lettonie)
    "workinlithuania": WorkInLithuaniaJobConnector,
    "cvbankas": CvBankasJobConnector,
    "cvonline_lt": CvOnlineLtJobConnector,
    "cvmarket_lt": CvMarketLtJobConnector,
    "cv_lv": CvLvJobConnector,
    "cvmarket_lv": CvMarketLvJobConnector,
    "visidarbi": VisidarbiJobConnector,
    "workingday": WorkingDayJobConnector,
    # Balkans & Europe du Sud-Est
    "mojposao": MojPosaoJobConnector,
    "posao_hr": PosaoHrJobConnector,
    "pickjobs": PickJobsJobConnector,
    "infostud": InfostudJobConnector,
    "helloworld_rs": HelloWorldRsJobConnector,
    "startuj": StartujJobConnector,
    "joberty": JobertyJobConnector,
    "duapune": DuapuneJobConnector,
    "njoftime": NjoftimeJobConnector,
    "jobs_bg": JobsBgJobConnector,
    "jobtiger_bg": JobTigerJobConnector,
    "dev_bg": DevBgJobConnector,
    "zaplata_bg": ZaplataBgJobConnector,
    # Ukraine
    "work_ua": WorkUaJobConnector,
    "robota_ua": RobotaUaJobConnector,
    "djinni": DjinniJobConnector,
    "dou_ua": DouUaJobConnector,
    "happymonday": HappyMondayJobConnector,
    # Portails Communs Européens & Institutionnels
    "eures": EuresJobConnector,
    "erasmusintern": ErasmusInternJobConnector,
    "eu_careers": EUCareersJobConnector,
    "blue_book": BlueBookJobConnector,
    "european_job_days": EuropeanJobDaysJobConnector,
    "glassdoor": GlassdoorJobConnector,
    "jooble": JoobleJobConnector,
    "adzuna": AdzunaJobConnector,
    "eurojobs": EuroJobsJobConnector,
    "iagora": IAgoraJobConnector,
    "studentjob": StudentJobConnector,
    "eurobrussels": EuroBrusselsJobConnector,
    "euractiv": EuractivJobConnector,
    "piktalent": PiktalentJobConnector,
    "europlacement": EuroplacementJobConnector,
    # Tunisie
    "keejob": KeejobJobConnector,
    "tunisietravail": TunisieTravailJobConnector,
    "tanitjobs": TanitjobsJobConnector,
    "emploitunisie": EmploiTunisieJobConnector,
    "stagetunisie": StageTunisieJobConnector,
    "optioncarriere": OptionCarriereJobConnector,
    "aneti": AnetiJobConnector,
    "offre_emploi_tn": OffreEmploiTnJobConnector,
    # France
    "wttj": WTTJJobConnector,
    "1jeune1solution": UnJeuneUneSolutionJobConnector,
    "jobteaser": JobteaserJobConnector,
    "hellowork": HelloWorkJobConnector,
    "indeed": IndeedJobConnector,
    "apec": ApecJobConnector,
    "moovijob": MoovijobJobConnector,
    "monster": MonsterJobConnector,
    "stagiaires_fr": StagiairesFrJobConnector,
    "cadremploi": CadremploiJobConnector,
    "meteojob": MeteojobJobConnector,
    "letudiant": LEtudiantJobConnector,
    "chooseyourboss": ChooseYourBossJobConnector,
    # Portails ESN & Ecosystemes Tech
    "esn_direct": ESNDirectJobConnector,
    "numeum": NumeumJobConnector,
    "capdigital": CapDigitalJobConnector,
}

INACTIVE_PLATFORMS: set[str] = {
    "stackoverflow_jobs",  # Service définitivement arrêté par Stack Overflow
    "esn_direct",          # Nom de domaine expiré / en vente
    "stagiaires_fr",       # Nom de domaine expiré (parking OVH)
    "stagetunisie",        # DNS mort / nom de domaine non résolu
    "jobs_mc",             # DNS mort
    "monaco_emploi",       # DNS mort
    "capdigital",          # Pôle de compétitivité sans job board direct
}


class CrawlerScheduler:
    """
    Orchestrateur multi-sources de scraping PFE (France & Tunisie).
    Exécute les collectes périodiques, gère la déduplication et diffuse en temps réel via SSE.
    """

    _instance = None
    _last_crawl_times: dict[str, datetime] = {}
    _running_users: set[str] = set()
    _stats_by_source: dict[str, int] = {}

    @classmethod
    def get_status(cls, user_id: str = "louay") -> dict[str, Any]:
        target = (user_id or "louay").strip().lower()
        last_time = cls._last_crawl_times.get(target)
        return {
            "registered_connectors": list(ALL_CONNECTORS.keys()),
            "total_connectors": len(ALL_CONNECTORS),
            "is_running": target in cls._running_users,
            "last_crawl_time": last_time.isoformat() if last_time else None,
            "stats_by_source": cls._stats_by_source,
        }

    @classmethod
    async def run_full_crawl(
        cls,
        keywords: list[str] | None = None,
        locations: list[str] | None = None,
        platforms: list[str] | None = None,
        limit_per_platform: int = 15,
        session: Session | None = None,
        user_id: str = "louay",
    ) -> dict[str, Any]:
        """
        Déclenche l'ingestion sur l'ensemble ou une sélection de plateformes pour un utilisateur donné.
        """
        target_user = (user_id or "louay").strip().lower()
        if target_user in cls._running_users:
            return {"status": "already_running", "message": f"Un crawl est déjà en cours d'exécution pour {target_user}."}

        cls._running_users.add(target_user)
        try:
            cls._last_crawl_times[target_user] = utc_now()

            target_platforms = platforms if platforms else list(ALL_CONNECTORS.keys())
            search_kw = BaseJobConnector.normalize_search_terms(keywords)
            search_loc = locations if locations else ["France", "Tunisie"]

            # Si des localisations spécifiques sont demandées sans forcer platforms, cibler intelligemment les connecteurs
            if not platforms and locations and not any(l.lower() in ["all", "europe", "tous"] for l in locations):
                resolved_platforms = []
                norm_locs = {l.strip().lower() for l in locations}
                for p_slug, p_cls in ALL_CONNECTORS.items():
                    # Connecteurs globaux & multi-pays
                    if p_slug in ["top100_enterprises", "linkedin", "indeed", "eures", "eurojobs", "erasmusintern", "glassdoor", "jooble", "adzuna"]:
                        resolved_platforms.append(p_slug)
                        continue
                    # Attribut default_country
                    conn_country = getattr(p_cls, "default_country", "").strip().lower()
                    if conn_country and any(loc in conn_country or conn_country in loc for loc in norm_locs):
                        resolved_platforms.append(p_slug)
                        continue
                    # Connecteurs dédiés France
                    if any(l in ["france", "fr"] for l in norm_locs) and p_slug in ["wttj", "jobteaser", "hellowork", "apec", "meteojob", "letudiant", "cadremploi", "1jeune1solution", "stagiaires_fr", "monster"]:
                        resolved_platforms.append(p_slug)
                        continue
                    # Connecteurs dédiés Tunisie
                    if any(l in ["tunisie", "tunisia", "tn"] for l in norm_locs) and p_slug in ["keejob", "tunisietravail", "tanitjobs", "emploitunisie", "stagetunisie", "optioncarriere", "aneti", "offre_emploi_tn"]:
                        resolved_platforms.append(p_slug)
                        continue
                if resolved_platforms:
                    target_platforms = resolved_platforms

            # Filtrage des connecteurs inactifs ou morts
            target_platforms = [p for p in target_platforms if p not in INACTIVE_PLATFORMS]

            total_collected = 0
            total_new = 0
            total_duplicates = 0
            source_counts: dict[str, int] = {}

            owns_session = session is None
            sess = session if session is not None else Session(get_engine())

            # Récupération du profil et de son mode de recherche
            user_profile = sess.exec(select(MasterProfile).where(MasterProfile.user_id == target_user)).first()
            search_mode = getattr(user_profile, "search_mode", "PFE") if user_profile else "PFE"

            # Indexation sémantique et cross-plateformes pour déduplication stricte
            existing_user_jobs = sess.exec(select(JobOffer).where(JobOffer.user_id == target_user)).all()
            dedup_index = JobDeduplicationIndex(existing_user_jobs)

            # Priorisation intelligente : les grands job boards vérifiés sont scannés en tête de file
            core_priority = [
                "top100_enterprises", "linkedin", "keejob", "tunisietravail",
                "jobteaser", "indeed", "hellowork", "meteojob", "apec", "aneti",
                "tanitjobs", "letudiant", "gradcracker", "jobtech_sweden", "jobs_ch"
            ]
            sorted_platforms = sorted(
                target_platforms,
                key=lambda p: (0 if p in core_priority else 1, core_priority.index(p) if p in core_priority else 999)
            )

            sem = asyncio.Semaphore(15)
            per_connector_timeout = 10.0
            global_crawl_timeout = 35.0

            async def fetch_and_process_platform(p_name: str) -> None:
                nonlocal total_collected, total_new, total_duplicates
                c_cls = ALL_CONNECTORS.get(p_name)
                if not c_cls:
                    return

                # Notification SSE : démarrage de l'exploration de la plateforme
                await broadcast_event(
                    "SCRAPE_PROGRESS",
                    {
                        "platform": p_name,
                        "status": "running",
                        "count": 0,
                        "message": f"Scan en cours sur {p_name}...",
                    },
                    target_user=target_user,
                )

                fetched: list[dict[str, Any]] = []
                conn_inst = None
                async with sem:
                    try:
                        conn_inst = c_cls()
                        fetched = await asyncio.wait_for(
                            conn_inst.search_jobs(
                                keywords=search_kw,
                                locations=search_loc,
                                limit=limit_per_platform,
                            ),
                            timeout=per_connector_timeout,
                        )
                    except asyncio.TimeoutError:
                        print(f"[CrawlerScheduler] Timeout connecteur {p_name} (> {per_connector_timeout}s)")
                    except Exception as err:
                        print(f"[CrawlerScheduler] Erreur connecteur {p_name}: {err}")

                platform_new = 0
                platform_enrich_count = 0

                if fetched and conn_inst:
                    for j in fetched:
                        title = j.get("title", "")
                        desc = j.get("description_raw", "")
                        job_loc = j.get("location", "")

                        # Bouclier Géographique Déterministe
                        if not is_location_matching_target(job_loc, search_loc):
                            continue

                        # Invariant : validation selon le search_mode du profil
                        if search_mode == "PFE":
                            if not is_pfe_offer(title, desc):
                                continue
                            current_offer_type = "PFE"
                        else:
                            inferred = infer_offer_type(title, desc)
                            if inferred == "REJECTED":
                                continue
                            current_offer_type = inferred

                        total_collected += 1
                        ext_id = j.get("external_id")
                        plat = j.get("platform", p_name)

                        # Bouclier Anti-Rescrape
                        if is_job_excluded_from_scraping(sess, target_user, j):
                            total_duplicates += 1
                            continue

                        # Déduplication globale sémantique & cross-plateformes
                        is_dup, _ = dedup_index.is_duplicate(j)
                        if is_dup:
                            total_duplicates += 1
                            continue

                        j_with_type = dict(j)
                        j_with_type["offer_type"] = current_offer_type

                        # Enrichissement de la description si tronquée
                        job_url = j.get("url", "")
                        if job_url and platform_enrich_count < 2 and (len(desc) < 220 or "consultez l'annonce" in desc.lower() or "consultez les détails" in desc.lower()):
                            try:
                                details = await asyncio.wait_for(conn_inst.fetch_job_details(job_url), timeout=1.8)
                                if details and details.get("description_raw") and len(details["description_raw"]) > len(desc):
                                    j_with_type["description_raw"] = details["description_raw"]
                                    platform_enrich_count += 1
                            except Exception:
                                pass

                        # Deep Extraction & normalisation métadonnées
                        enriched = JobDeepExtractor.enrich_job_data(j_with_type)
                        job_country = resolve_country_name(enriched.get("country") or enriched.get("location") or "France")
                        detected_lang = detect_job_language(
                            title=enriched.get("title", ""),
                            description=enriched.get("description_raw", ""),
                            country=job_country,
                        )

                        new_job = JobOffer(
                            platform=plat,
                            external_id=ext_id,
                            title=enriched["title"],
                            company=enriched["company"],
                            location=enriched.get("location", ""),
                            country=job_country,
                            description_raw=enriched.get("description_raw", ""),
                            url=enriched.get("url", ""),
                            status="DISCOVERED",
                            offer_type=current_offer_type,
                            published_at=enriched.get("published_at"),
                            skills_required=enriched.get("skills_required", "[]"),
                            contract_duration=enriched.get("contract_duration", ""),
                            salary_stipend=enriched.get("salary_stipend", ""),
                            department=enriched.get("department", ""),
                            is_direct_career_site=enriched.get("is_direct_career_site", False),
                            apply_url=enriched.get("apply_url", ""),
                            language=detected_lang,
                            user_id=target_user,
                        )
                        sess.add(new_job)
                        sess.commit()
                        sess.refresh(new_job)
                        dedup_index.add(new_job)

                        total_new += 1
                        platform_new += 1

                        # Émission instantanée SSE pour le radar
                        await broadcast_event(
                            "JOB_DISCOVERED",
                            {
                                "id": new_job.id,
                                "platform": new_job.platform,
                                "title": new_job.title,
                                "company": new_job.company,
                                "country": new_job.country,
                                "location": new_job.location,
                                "status": new_job.status,
                                "offer_type": new_job.offer_type,
                                "skills_required": new_job.skills_required,
                                "contract_duration": new_job.contract_duration,
                                "salary_stipend": new_job.salary_stipend,
                                "department": new_job.department,
                                "is_direct_career_site": new_job.is_direct_career_site,
                                "apply_url": new_job.apply_url,
                                "published_at": new_job.published_at.isoformat() if new_job.published_at else None,
                                "collected_at": new_job.collected_at.isoformat(),
                            },
                            target_user=target_user,
                        )

                source_counts[p_name] = platform_new
                cls._stats_by_source[p_name] = cls._stats_by_source.get(p_name, 0) + platform_new

                # Diffusion SSE : scan de la plateforme terminé
                await broadcast_event(
                    "SCRAPE_PROGRESS",
                    {
                        "platform": p_name,
                        "status": "completed",
                        "count": platform_new,
                        "message": f"{platform_new} nouvelle(s) opportunité(s) PFE validée(s).",
                    },
                    target_user=target_user,
                )

            # Lancement concurrent avec ingestion en continu
            tasks = [asyncio.create_task(fetch_and_process_platform(p)) for p in sorted_platforms]
            try:
                await asyncio.wait_for(asyncio.gather(*tasks, return_exceptions=True), timeout=global_crawl_timeout)
            except asyncio.TimeoutError:
                print(f"[CrawlerScheduler] Limite de temps globale atteinte ({global_crawl_timeout}s). Annulation des tâches restantes.")
                for t in tasks:
                    if not t.done():
                        t.cancel()

            # Événement global de fin d'exploration multi-sources
            await broadcast_event(
                "SCRAPE_ALL_COMPLETED",
                {
                    "status": "completed",
                    "total_collected": total_collected,
                    "new_count": total_new,
                    "duplicate_count": total_duplicates,
                    "platforms": target_platforms,
                    "by_platform": source_counts,
                    "message": f"Collecte multi-sources achevée : {total_new} nouvelles offres PFE intégrées.",
                },
                target_user=target_user,
            )

        finally:
            cls._running_users.discard(target_user)
            if owns_session:
                sess.close()

        return {
            "status": "completed",
            "collected_count": total_collected,
            "new_count": total_new,
            "duplicate_count": total_duplicates,
            "platforms": target_platforms,
            "by_platform": source_counts,
            "message": f"Collecte multi-sources achevée : {total_new} nouvelles offres intégrées.",
        }
