from typing import Any
from app.ports.connectors import BaseJobConnector


class LEtudiantJobConnector(BaseJobConnector):
    """
    Connecteur L'Etudiant.
    Portail national pour les stages et premiers emplois d'élèves-ingénieurs et universitaires.
    """

    @property
    def platform_name(self) -> str:
        return "letudiant"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.4)

        pool = [
            {
                "external_id": "let-pfe-sncf",
                "platform": "letudiant",
                "title": "Stage PFE - Ingénieur Données & Maintenance Prédictive TGV",
                "company": "SNCF Voyageurs (Direction Matériel)",
                "location": "Saint-Denis / Paris, France",
                "country": "France",
                "description_raw": (
                    "Stage PFE de fin d'études au laboratoire de maintenance prédictive. "
                    "Exploitation des données des capteurs embarqués sur rames TGV et développement de modèles de détection précoce d'usure. "
                    "Compétences : Python, Pandas, Scikit-learn, SQL, Docker."
                ),
                "url": "https://jobs.letudiant.fr/offres/sncf-pfe-maintenance-predictive",
            },
            {
                "external_id": "let-pfe-stellantis",
                "platform": "letudiant",
                "title": "Stage PFE - Ingénieur Logiciel Systèmes de Conduite Autonome (ADAS)",
                "company": "Stellantis",
                "location": "Poissy / Vélizy, France",
                "country": "France",
                "description_raw": (
                    "Stage PFE d'ingénieur au pôle Autonomous Driving Stellantis. Intégration de briques de fusion de capteurs (Radar/Lidar/Caméra). "
                    "Profil : Élève-ingénieur informatique industrielle / télécoms. Technologies : C++, ROS2, Linux, Python."
                ),
                "url": "https://jobs.letudiant.fr/offres/stellantis-pfe-adas",
            },
        ]

        return pool[:limit]

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
