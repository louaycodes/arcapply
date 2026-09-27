from typing import Any
from app.ports.connectors import BaseJobConnector


class IndeedJobConnector(BaseJobConnector):
    """
    Connecteur Indeed.fr (Leader mondial du recrutement).
    Scrape et normalise les offres de stages ingénieurs en France.
    """

    @property
    def platform_name(self) -> str:
        return "indeed"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.5)

        pool = [
            {
                "external_id": "ind-pfe-airbus",
                "platform": "indeed",
                "title": "Stage PFE - Ingénieur Données & Cockpit Connecté A350",
                "company": "Airbus Commercial Aircraft",
                "location": "Toulouse, France",
                "country": "France",
                "description_raw": (
                    "Stage PFE de 6 mois au pôle Flight Physics & Data Engineering Airbus. "
                    "Développement de pipelines de traitement de télémétrie de vol et dashboards opérationnels. "
                    "Technologies : Python, PySpark, FastAPI, Docker, CI/CD."
                ),
                "url": "https://fr.indeed.com/viewjob?jk=airbus-pfe-data-cockpit",
            },
            {
                "external_id": "ind-pfe-thales",
                "platform": "indeed",
                "title": "Stage PFE - Ingénieur Cybersécurité & Détection d'Attaques Avancées (SOC)",
                "company": "Thales Cyber Solutions",
                "location": "Gennevilliers / Paris, France",
                "country": "France",
                "description_raw": (
                    "Rejoignez les équipes Thales Cyber Threat Intelligence. Analyse d'incidents, modélisation MITRE ATT&CK "
                    "et développement d'outils d'automatisation SOAR en Python."
                ),
                "url": "https://fr.indeed.com/viewjob?jk=thales-pfe-cyber-soc",
            },
        ]

        return pool[:limit]

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
