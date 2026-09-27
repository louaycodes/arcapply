from typing import Any
from app.ports.connectors import BaseJobConnector


class StagiairesFrJobConnector(BaseJobConnector):
    """
    Connecteur Stagiaires.fr.
    Portail entièrement ciblé sur les stages étudiants et stages de fin d'études (PFE) en France.
    """

    @property
    def platform_name(self) -> str:
        return "stagiaires_fr"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.4)

        pool = [
            {
                "external_id": "stg-pfe-deezer",
                "platform": "stagiaires_fr",
                "title": "Stage PFE - Ingénieur Recommandation Musicale & IA Audio",
                "company": "Deezer",
                "location": "Paris, France",
                "country": "France",
                "description_raw": (
                    "Stage PFE de 6 mois au sein du lab R&D Audio & Machine Learning. "
                    "Conception d'algorithmes d'embeddings audio et filtrage collaboratif pour les playlists intelligentes. "
                    "Technologies : Python, PyTorch, BigQuery, Docker."
                ),
                "url": "https://www.stagiaires.fr/offres/deezer-pfe-audio-ia",
            },
            {
                "external_id": "stg-pfe-blablacar",
                "platform": "stagiaires_fr",
                "title": "Stage PFE - Ingénieur Backend Core Engine (Go / Kafka)",
                "company": "BlaBlaCar",
                "location": "Paris, France",
                "country": "France",
                "description_raw": (
                    "Au sein de la Core Engine Tribe. Optimisation des algorithmes de covoiturage et de recherche d'itinéraires en temps réel. "
                    "Stack : Go, Kafka, PostgreSQL, GCP, Kubernetes."
                ),
                "url": "https://www.stagiaires.fr/offres/blablacar-pfe-backend-go",
            },
        ]

        return pool[:limit]

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
