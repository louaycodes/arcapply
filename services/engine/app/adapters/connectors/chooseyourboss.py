from typing import Any
from app.ports.connectors import BaseJobConnector


class ChooseYourBossJobConnector(BaseJobConnector):
    """
    Connecteur ChooseYourBoss.
    Plateforme de recrutement inversé spécialisée tech, dev et stages ingénieurs.
    """

    @property
    def platform_name(self) -> str:
        return "chooseyourboss"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.5)

        pool = [
            {
                "external_id": "cyb-pfe-contentsquare",
                "platform": "chooseyourboss",
                "title": "Stage PFE - Software Engineer Data Pipeline & Streaming Flink",
                "company": "ContentSquare",
                "location": "Paris, France",
                "country": "France",
                "description_raw": (
                    "Stage PFE chez la licorne ContentSquare au sein de la Data Platform. "
                    "Traitement de flux de données massifs (milliards d'événements/jour) avec Apache Flink et Kafka. "
                    "Stack : Java, Scala, Python, Kubernetes, AWS."
                ),
                "url": "https://www.chooseyourboss.com/offres/contentsquare-pfe-data-streaming",
            },
            {
                "external_id": "cyb-pfe-payfit",
                "platform": "chooseyourboss",
                "title": "Stage PFE - Ingénieur Frontend Architecture & Design System",
                "company": "PayFit",
                "location": "Paris / Télétravail, France",
                "country": "France",
                "description_raw": (
                    "Stage PFE d'ingénieur logiciel chez PayFit. Évolution du design system et des micro-frontends en React et TypeScript. "
                    "Tests automatisés, performance web et accessibilité WCAG."
                ),
                "url": "https://www.chooseyourboss.com/offres/payfit-pfe-frontend",
            },
        ]

        return pool[:limit]

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
