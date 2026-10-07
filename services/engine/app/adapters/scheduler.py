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
from app.adapters.database import get_engine
from app.api.events import broadcast_event
from app.adapters.connectors import infer_offer_type, is_pfe_offer
from app.domain.anti_rescrape import is_job_already_applied, is_job_already_archived, is_job_excluded_from_scraping
from app.domain.deduplication import JobDeduplicationIndex
from app.domain.job_extractor import JobDeepExtractor
from app.domain.models import JobOffer, MasterProfile, utc_now
from app.ports.connectors import BaseJobConnector

ALL_CONNECTORS: dict[str, type[BaseJobConnector]] = {
    # Top 100 Entreprises IT (Portails Carrieres Dedies & ATS direct)
    "top100_enterprises": Top100EnterprisesJobConnector,
    # International & Global
    "linkedin": LinkedInJobConnector,
    "stackoverflow_jobs": StackOverflowJobsJobConnector,
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

            for platform in target_platforms:
                connector_cls = ALL_CONNECTORS.get(platform)
                if not connector_cls:
                    continue

                await broadcast_event(
                    "SCRAPE_PROGRESS",
                    {
                        "platform": platform,
                        "status": "running",
                        "count": 0,
                        "message": f"Scan en cours sur {platform}...",
                    },
                    target_user=target_user,
                )

                connector = connector_cls()
                try:
                    jobs = await connector.search_jobs(
                        keywords=search_kw,
                        locations=search_loc,
                        limit=limit_per_platform,
                    )
                except Exception as err:
                    print(f"[CrawlerScheduler] Erreur connecteur {platform}: {err}")
                    jobs = []
                    await broadcast_event(
                        "SCRAPE_PROGRESS",
                        {
                            "platform": platform,
                            "status": "error",
                            "count": 0,
                            "message": f"Erreur lors du scan de {platform}: {err}",
                        },
                        target_user=target_user,
                    )

                platform_new = 0
                for j in jobs:
                    title = j.get("title", "")
                    desc = j.get("description_raw", "")

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
                    plat = j.get("platform", platform)

                    # Bouclier Anti-Rescrape : Toute offre déjà postulée ou archivée ne sera JAMAIS re-scrappée
                    if is_job_excluded_from_scraping(sess, target_user, j):
                        total_duplicates += 1
                        continue

                    # Déduplication globale sémantique & cross-plateforme (ID externe, URL normalisée, Entreprise + Titre)
                    is_dup, dup_reason = dedup_index.is_duplicate(j)
                    if is_dup:
                        total_duplicates += 1
                        continue

                    j_with_type = dict(j)
                    j_with_type["offer_type"] = current_offer_type

                    # Pour toute nouvelle offre, enrichir avec la description intégrale si placeholder ou tronquée
                    job_url = j.get("url", "")
                    if job_url and (len(desc) < 220 or "consultez l'annonce" in desc.lower() or "consultez les détails" in desc.lower()):
                        try:
                            details = await connector.fetch_job_details(job_url)
                            if details and details.get("description_raw") and len(details["description_raw"]) > len(desc):
                                j_with_type["description_raw"] = details["description_raw"]
                        except Exception:
                            pass

                    # Deep Extraction & Enrichissement sémantique (stack, durée, salaire, date)
                    enriched = JobDeepExtractor.enrich_job_data(j_with_type)

                    new_job = JobOffer(
                        platform=plat,
                        external_id=ext_id,
                        title=enriched["title"],
                        company=enriched["company"],
                        location=enriched.get("location", ""),
                        country=enriched.get("country", "France"),
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

                source_counts[platform] = platform_new
                cls._stats_by_source[platform] = cls._stats_by_source.get(platform, 0) + platform_new

                await broadcast_event(
                    "SCRAPE_PROGRESS",
                    {
                        "platform": platform,
                        "status": "completed",
                        "count": platform_new,
                        "message": f"{platform_new} nouvelle(s) opportunité(s) PFE découverte(s).",
                    },
                    target_user=target_user,
                )

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
