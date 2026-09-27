import asyncio
from datetime import datetime, timezone
from typing import Any
from sqlmodel import Session, select
from app.adapters.connectors.jobteaser import JobteaserJobConnector
from app.adapters.connectors.keejob import KeejobJobConnector
from app.adapters.connectors.linkedin import LinkedInJobConnector
from app.adapters.connectors.tanitjobs import TanitjobsJobConnector
from app.adapters.connectors.tunisietravail import TunisieTravailJobConnector
from app.adapters.connectors.unjeuneunesolution import UnJeuneUneSolutionJobConnector
from app.adapters.connectors.wttj import WTTJJobConnector
from app.adapters.database import get_engine
from app.api.events import broadcast_event
from app.domain.models import JobOffer, utc_now
from app.ports.connectors import BaseJobConnector

ALL_CONNECTORS: dict[str, type[BaseJobConnector]] = {
    "linkedin": LinkedInJobConnector,
    "keejob": KeejobJobConnector,
    "tunisietravail": TunisieTravailJobConnector,
    "tanitjobs": TanitjobsJobConnector,
    "jobteaser": JobteaserJobConnector,
    "wttj": WTTJJobConnector,
    "1jeune1solution": UnJeuneUneSolutionJobConnector,
}


class CrawlerScheduler:
    """
    Orchestrateur multi-sources de scraping PFE (France & Tunisie).
    Exécute les collectes périodiques, gère la déduplication et diffuse en temps réel via SSE.
    """

    _instance = None
    _last_crawl_time: datetime | None = None
    _is_running: bool = False
    _stats_by_source: dict[str, int] = {}

    @classmethod
    def get_status(cls) -> dict[str, Any]:
        return {
            "registered_connectors": list(ALL_CONNECTORS.keys()),
            "total_connectors": len(ALL_CONNECTORS),
            "is_running": cls._is_running,
            "last_crawl_time": cls._last_crawl_time.isoformat() if cls._last_crawl_time else None,
            "stats_by_source": cls._stats_by_source,
        }

    @classmethod
    async def run_full_crawl(
        cls,
        keywords: list[str] | None = None,
        locations: list[str] | None = None,
        platforms: list[str] | None = None,
        session: Session | None = None,
    ) -> dict[str, Any]:
        """
        Déclenche l'ingestion sur l'ensemble ou une sélection de plateformes.
        """
        if cls._is_running:
            return {"status": "already_running", "message": "Un crawl est déjà en cours d'exécution."}

        cls._is_running = True
        cls._last_crawl_time = utc_now()

        target_platforms = platforms if platforms else list(ALL_CONNECTORS.keys())
        search_kw = keywords if keywords else ["PFE", "Stage Ingénieur"]
        search_loc = locations if locations else ["France", "Tunisie"]

        total_collected = 0
        total_new = 0
        total_duplicates = 0
        source_counts: dict[str, int] = {}

        owns_session = session is None
        sess = session if session is not None else Session(get_engine())

        try:
            for platform in target_platforms:
                connector_cls = ALL_CONNECTORS.get(platform)
                if not connector_cls:
                    continue

                await broadcast_event(
                    "SCRAPE_PROGRESS",
                    {"platform": platform, "status": "running", "message": f"Scan en cours sur {platform}..."}
                )

                connector = connector_cls()
                try:
                    jobs = await connector.search_jobs(
                        keywords=search_kw,
                        locations=search_loc,
                        limit=8,
                    )
                except Exception as err:
                    print(f"[CrawlerScheduler] Erreur connecteur {platform}: {err}")
                    jobs = []

                platform_new = 0
                for j in jobs:
                    total_collected += 1
                    ext_id = j.get("external_id")
                    plat = j.get("platform", platform)

                    # Déduplication stricte (platform, external_id)
                    existing = sess.exec(
                        select(JobOffer).where(
                            JobOffer.platform == plat,
                            JobOffer.external_id == ext_id,
                        )
                    ).first()

                    if existing:
                        total_duplicates += 1
                        continue

                    new_job = JobOffer(
                        platform=plat,
                        external_id=ext_id,
                        title=j["title"],
                        company=j["company"],
                        location=j.get("location", ""),
                        country=j.get("country", "France"),
                        description_raw=j.get("description_raw", ""),
                        url=j.get("url", ""),
                        status="DISCOVERED",
                    )
                    sess.add(new_job)
                    sess.commit()
                    sess.refresh(new_job)

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
                            "collected_at": new_job.collected_at.isoformat(),
                        }
                    )

                source_counts[platform] = platform_new
                cls._stats_by_source[platform] = cls._stats_by_source.get(platform, 0) + platform_new

                await broadcast_event(
                    "SCRAPE_PROGRESS",
                    {
                        "platform": platform,
                        "status": "completed",
                        "message": f"{platform_new} nouvelle(s) opportunité(s) découverte(s).",
                    }
                )

        finally:
            cls._is_running = False
            if owns_session:
                sess.close()

        return {
            "status": "completed",
            "collected_count": total_collected,
            "new_count": total_new,
            "duplicate_count": total_duplicates,
            "by_platform": source_counts,
            "message": f"Collecte multi-sources achevée : {total_new} nouvelles offres intégrées.",
        }
