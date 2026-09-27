from typing import Any
from app.ports.connectors import BaseJobConnector


class CadremploiJobConnector(BaseJobConnector):
    """
    Connecteur Cadremploi (Groupe Figaro).
    Cible les stages ingénieurs d'excellence et opportunités pré-cadres Bac+5.
    """

    @property
    def platform_name(self) -> str:
        return "cadremploi"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.5)

        pool = [
            {
                "external_id": "cad-pfe-engie",
                "platform": "cadremploi",
                "title": "Stage PFE - Ingénieur Efficacité Énergétique & Jumeaux Numériques",
                "company": "ENGIE Solutions",
                "location": "Courbevoie / Paris, France",
                "country": "France",
                "description_raw": (
                    "Stage PFE d'ingénieur en modélisation thermique et énergétique des bâtiments tertiaires. "
                    "Développement d'algorithmes prédictifs pour optimiser la consommation de réseaux de chaleur. "
                    "Compétences : Python, simulation numérique, Machine Learning, Git."
                ),
                "url": "https://www.cadremploi.fr/emploi/engie-pfe-jumeaux-numeriques",
            },
            {
                "external_id": "cad-pfe-safran",
                "platform": "cadremploi",
                "title": "Stage PFE - Ingénieur Conception Aéronautique & Calcul de Structures",
                "company": "Safran Aircraft Engines",
                "location": "Villaroche / Melun, France",
                "country": "France",
                "description_raw": (
                    "Rejoignez les équipes calcul et méthodes de Safran. Analyse thermo-mécanique d'éléments de turboréacteurs de nouvelle génération. "
                    "Outils : Python, C++, éléments finis, Ansys."
                ),
                "url": "https://www.cadremploi.fr/emploi/safran-pfe-structures-aero",
            },
        ]

        return pool[:limit]

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
