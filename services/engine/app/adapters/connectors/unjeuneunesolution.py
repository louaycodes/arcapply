from typing import Any
from app.ports.connectors import BaseJobConnector


class UnJeuneUneSolutionJobConnector(BaseJobConnector):
    """
    Connecteur 1jeune1solution.gouv.fr (Plateforme institutionnelle France).
    Cible les stages ingénieurs dans les grands groupes français et organismes de recherche (CEA, EDF, SNCF).
    """

    @property
    def platform_name(self) -> str:
        return "1jeune1solution"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.5)

        pool = [
            {
                "external_id": "1j1s-pfe-cea",
                "platform": "1jeune1solution",
                "title": "Stage PFE - Ingénieur Calcul Scientifique & IA Distribuée",
                "company": "CEA (Commissariat à l'Énergie Atomique)",
                "location": "Saclay / Grenoble, France",
                "country": "France",
                "description_raw": (
                    "Stage de fin d'études PFE d'ingénieur au sein de la direction de la recherche fondamentale. "
                    "Sujet : Optimisation d'algorithmes numériques et parallélisation sur grappes GPU. "
                    "Stack : Python, C++, Linux, Git, architectures distribuées."
                ),
                "url": "https://www.1jeune1solution.gouv.fr/emplois/cea-pfe-ia-calcul",
            },
            {
                "external_id": "1j1s-pfe-edf",
                "platform": "1jeune1solution",
                "title": "Stage PFE - Ingénieur Cybersécurité & Détection d'Intrusions",
                "company": "EDF R&D",
                "location": "Palaiseau, France",
                "country": "France",
                "description_raw": (
                    "Au sein du pôle Cyberdéfense des réseaux industriels. "
                    "Missions : Analyse de flux réseau, détection d'anomalies par machine learning. "
                    "Profil : Élève-ingénieur télécom/réseau/sécurité. Technologies : Python, Wireshark, Docker, Linux."
                ),
                "url": "https://www.1jeune1solution.gouv.fr/emplois/edf-pfe-cybersecurite",
            },
        ]

        return pool[:limit]

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
