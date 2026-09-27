from typing import Any
from app.ports.connectors import BaseJobConnector


class MonsterJobConnector(BaseJobConnector):
    """
    Connecteur Monster.fr.
    Agrège les opportunités de stages et premiers emplois d'ingénieurs en France.
    """

    @property
    def platform_name(self) -> str:
        return "monster"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.5)

        pool = [
            {
                "external_id": "mon-pfe-atos",
                "platform": "monster",
                "title": "Stage PFE - Ingénieur Cloud Orchestration & OpenShift",
                "company": "Eviden (Atos Group)",
                "location": "Bezons / Paris, France",
                "country": "France",
                "description_raw": (
                    "Stage PFE au sein de la ligne de produits Cloud Hybride. "
                    "Développement d'opérateurs Kubernetes personnalisés et automatisation GitOps avec ArgoCD. "
                    "Stack : Go, Kubernetes, OpenShift, Helm, Git."
                ),
                "url": "https://www.monster.fr/emploi/eviden-pfe-openshift",
            },
            {
                "external_id": "mon-pfe-alstom",
                "platform": "monster",
                "title": "Stage PFE - Ingénieur Système Signalisation Ferroviaire & CBTC",
                "company": "Alstom Transport",
                "location": "Saint-Ouen / Paris, France",
                "country": "France",
                "description_raw": (
                    "Recherche élève-ingénieur en systèmes embarqués ou automatique pour stage PFE de fin d'études. "
                    "Modélisation et vérification formelle de sous-systèmes de signalisation ferroviaire CBTC."
                ),
                "url": "https://www.monster.fr/emploi/alstom-pfe-cbtc",
            },
        ]

        return pool[:limit]

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
