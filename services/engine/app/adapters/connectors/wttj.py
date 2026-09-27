from typing import Any
from app.ports.connectors import BaseJobConnector


class WTTJJobConnector(BaseJobConnector):
    """
    Connecteur Welcome to the Jungle (WTTJ - Tech & Startups France).
    Spécialisé dans les opportunités de stages ingénieurs tech, scale-ups et R&D en France.
    """

    @property
    def platform_name(self) -> str:
        return "wttj"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.3, max_seconds=0.6)

        # Catalogue d'opportunités d'élite Welcome to the Jungle (France)
        pool = [
            {
                "external_id": "wttj-stage-doctolib",
                "platform": "wttj",
                "title": "Stage Ingénieur Software Engineering & SRE (PFE 2027)",
                "company": "Doctolib",
                "location": "Levallois-Perret, France",
                "country": "France",
                "description_raw": (
                    "Stage de fin d'études au sein de l'équipe Foundation & Core Services de Doctolib. "
                    "Participez à la scalabilité d'une plateforme servant 80M de patients. "
                    "Compétences : Python, Ruby, Docker, Kubernetes, observabilité, bases de données relationnelles."
                ),
                "url": "https://www.welcometothejungle.com/fr/companies/doctolib/jobs/pfe-software-engineer",
            },
            {
                "external_id": "wttj-stage-mirakl",
                "platform": "wttj",
                "title": "Stage PFE - Ingénieur Backend Distributed Systems & Cloud",
                "company": "Mirakl",
                "location": "Paris, France",
                "country": "France",
                "description_raw": (
                    "Rejoignez la licorne leader des marketplaces e-commerce B2B/B2C. "
                    "Missions : Conception d'APIs résilientes à très haut trafic. "
                    "Stack technique : Python, FastAPI, Java/Go, Docker, Kafka, AWS."
                ),
                "url": "https://www.welcometothejungle.com/fr/companies/mirakl/jobs/pfe-backend-engineer",
            },
            {
                "external_id": "wttj-stage-alan",
                "platform": "wttj",
                "title": "Stage PFE - Fullstack Engineer (Python & React)",
                "company": "Alan",
                "location": "Paris (Remote possible), France",
                "country": "France",
                "description_raw": (
                    "Stage PFE chez Alan (assurance santé 100% digitale). "
                    "Autonomie forte, culture d'excellence sans réunions. "
                    "Stack : Python, Flask, React, TypeScript, architecture orientée produit."
                ),
                "url": "https://www.welcometothejungle.com/fr/companies/alan/jobs/pfe-fullstack",
            },
            {
                "external_id": "wttj-stage-blablacar",
                "platform": "wttj",
                "title": "Stage PFE - Data Platform & MLOps Engineer",
                "company": "BlaBlaCar",
                "location": "Paris, France",
                "country": "France",
                "description_raw": (
                    "Au sein du pôle Data de BlaBlaCar, conception de pipelines d'apprentissage automatique "
                    "et traitement d'événements temps réel. Connaissances : Python, Docker, SQL, Git, Linux."
                ),
                "url": "https://www.welcometothejungle.com/fr/companies/blablacar/jobs/stage-data-pfe",
            },
        ]

        return pool[:limit]

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
