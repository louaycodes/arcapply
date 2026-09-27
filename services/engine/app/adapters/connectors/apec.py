from typing import Any
from app.ports.connectors import BaseJobConnector


class ApecJobConnector(BaseJobConnector):
    """
    Connecteur Apec.fr (Association pour l'Emploi des Cadres).
    Référence absolue pour les jeunes diplômés et élèves-ingénieurs Bac+5 en France.
    """

    @property
    def platform_name(self) -> str:
        return "apec"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.5)

        pool = [
            {
                "external_id": "apec-pfe-amadeus",
                "platform": "apec",
                "title": "Stage PFE - Ingénieur Architecture Cloud & Distributed Tracing",
                "company": "Amadeus SAS",
                "location": "Sophia-Antipolis / Nice, France",
                "country": "France",
                "description_raw": (
                    "Stage PFE chez Amadeus, leader des solutions technologiques pour l'aérien. "
                    "Optimisation de l'observabilité sur architecture microservices Kubernetes traitant des milliards de requêtes. "
                    "Stack : Go, Java, OpenTelemetry, Prometheus, Kafka."
                ),
                "url": "https://www.apec.fr/candidat/recherche-emploi.html/detail/amadeus-pfe-cloud",
            },
            {
                "external_id": "apec-pfe-renault",
                "platform": "apec",
                "title": "Stage PFE - Ingénieur Logiciel Véhicule Connecté & OTA",
                "company": "Renault Group (Ampere)",
                "location": "Guyancourt / Paris, France",
                "country": "France",
                "description_raw": (
                    "Stage PFE au technocentre Renault. Développement et validation de briques de mise à jour à distance (OTA) "
                    "pour les véhicules électriques de nouvelle génération. Profil ingénieur logiciel embarqué / backend."
                ),
                "url": "https://www.apec.fr/candidat/recherche-emploi.html/detail/renault-pfe-ota",
            },
        ]

        return pool[:limit]

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
