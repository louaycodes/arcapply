from typing import Any
from app.ports.connectors import BaseJobConnector


class OffreEmploiTnJobConnector(BaseJobConnector):
    """
    Connecteur Offre-emploi.tn (Section stages et PFE Tunisie).
    Agrège les opportunités de stages étudiants et PFE des entreprises tunisiennes.
    """

    @property
    def platform_name(self) -> str:
        return "offre_emploi_tn"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.4)

        pool = [
            {
                "external_id": "oet-pfe-smartech",
                "platform": "offre_emploi_tn",
                "title": "Stage PFE - Ingénieur Développement Web Spring Boot / Angular",
                "company": "SmartTech Solutions Tunisie",
                "location": "Sousse, Tunisie",
                "country": "Tunisie",
                "description_raw": (
                    "Stage PFE d'ingénieur en génie logiciel. Conception et développement d'un portail de télémédecine et gestion des dossiers patients. "
                    "Compétences : Java, Spring Boot, Angular, PostgreSQL, Docker, Git."
                ),
                "url": "https://www.offre-emploi.tn/offres-de-stages/smarttech-pfe-springboot",
            },
            {
                "external_id": "oet-pfe-neo",
                "platform": "offre_emploi_tn",
                "title": "Stage PFE - Ingénieur Data Science & Prédiction de Churn Télécom",
                "company": "NeoData Tunisie",
                "location": "Tunis / El Ghazala Technopark, Tunisie",
                "country": "Tunisie",
                "description_raw": (
                    "Stage PFE au pôle Analytics. Analyse exploratoire de données clients et implémentation de modèles d'arbres de décision et boosting. "
                    "Technologies : Python, Pandas, XGBoost, MLflow, Docker."
                ),
                "url": "https://www.offre-emploi.tn/offres-de-stages/neodata-pfe-datascience",
            },
        ]

        return pool[:limit]

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
