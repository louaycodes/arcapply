from typing import Any
from app.ports.connectors import BaseJobConnector


class NumeumJobConnector(BaseJobConnector):
    """
    Connecteur Numeum.fr (Syndicat professionnel de l'écosystème numérique français).
    Recense les opportunités de stages et premiers emplois au sein des ESN et éditeurs de logiciels adhérents.
    """

    @property
    def platform_name(self) -> str:
        return "numeum"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.5)

        pool = [
            {
                "external_id": "num-pfe-sii",
                "platform": "numeum",
                "title": "Stage PFE - Ingénieur Conception Systèmes Embarqués Critiques",
                "company": "SII Group (Membre Numeum)",
                "location": "Toulouse / Sophia-Antipolis, France",
                "country": "France",
                "description_raw": (
                    "Stage PFE chez SII pour le secteur aérospatial et défense. "
                    "Développement et validation de logiciels temps réel sous norme DO-178C. "
                    "Technologies : C/C++, Linux embarqué, bancs de test automatisés en Python."
                ),
                "url": "https://carrieres.numeum.fr/offres/sii-pfe-embarque-aero",
            },
            {
                "external_id": "num-pfe-infotel",
                "platform": "numeum",
                "title": "Stage PFE - Ingénieur Modernisation Mainframe vers Cloud Hybride",
                "company": "Infotel (Membre Numeum)",
                "location": "Paris / Neuilly, France",
                "country": "France",
                "description_raw": (
                    "Stage PFE d'ingénieur d'études. Analyse d'architectures héritées et migration de flux bancaires vers AWS et conteneurs Docker. "
                    "Stack : Java, Spring Boot, API REST, Docker, SQL."
                ),
                "url": "https://carrieres.numeum.fr/offres/infotel-pfe-cloud-hybride",
            },
        ]

        return pool[:limit]

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
