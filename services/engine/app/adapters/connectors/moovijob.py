from typing import Any
from app.ports.connectors import BaseJobConnector


class MoovijobJobConnector(BaseJobConnector):
    """
    Connecteur Moovijob.com (Spécialiste recrutement tech, stages et salons ingénieurs France & Europe).
    """

    @property
    def platform_name(self) -> str:
        return "moovijob"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.4)

        pool = [
            {
                "external_id": "moov-pfe-lu-tech",
                "platform": "moovijob",
                "title": "Stage PFE - Ingénieur Développement Web Fullstack Next.js / FastAPI",
                "company": "Docler Holding / Tech Hub",
                "location": "Strasbourg / Metz, France",
                "country": "France",
                "description_raw": (
                    "Stage PFE d'ingénieur au sein de notre pôle Media Tech. "
                    "Conception d'une interface de streaming haute disponibilité et services asynchrones. "
                    "Technologies : TypeScript, React, Next.js, Python, PostgreSQL, Redis."
                ),
                "url": "https://www.moovijob.com/offres/docler-pfe-fullstack",
            },
            {
                "external_id": "moov-pfe-bce",
                "platform": "moovijob",
                "title": "Stage PFE - Ingénieur Infrastructure Réseau & Broadcast IP",
                "company": "BCE Telecom & Media",
                "location": "Lille / Paris, France",
                "country": "France",
                "description_raw": (
                    "Stage PFE télécom et broadcast. Migration des infrastructures de diffusion vers les normes ST 2110 IP. "
                    "Compétences : Réseaux IP, multicast, Linux, scripting Bash/Python."
                ),
                "url": "https://www.moovijob.com/offres/bce-pfe-broadcast-ip",
            },
        ]

        return pool[:limit]

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
