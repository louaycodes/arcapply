from typing import Any
from app.ports.connectors import BaseJobConnector


class MeteojobJobConnector(BaseJobConnector):
    """
    Connecteur Meteojob (CleverConnect).
    Plateforme de matching prédictif d'offres d'emploi et de stages d'ingénieurs.
    """

    @property
    def platform_name(self) -> str:
        return "meteojob"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.5)

        pool = [
            {
                "external_id": "met-pfe-ovh",
                "platform": "meteojob",
                "title": "Stage PFE - Ingénieur Réseau Datacenter & SDN (Software Defined Networking)",
                "company": "OVHcloud",
                "location": "Roubaix / Lille, France",
                "country": "France",
                "description_raw": (
                    "Stage PFE au sein du backbone mondial OVHcloud. Automatisation de la configuration BGP et déploiement de sondes d'observabilité. "
                    "Technologies : Python, Go, Linux networking, eBPF, Git."
                ),
                "url": "https://www.meteojob.com/offres/ovh-pfe-sdn-reseau",
            },
            {
                "external_id": "met-pfe-doctolib",
                "platform": "meteojob",
                "title": "Stage PFE - Ingénieur Fiabilité & Performance Web (SRE)",
                "company": "Doctolib",
                "location": "Nantes / Levallois-Perret, France",
                "country": "France",
                "description_raw": (
                    "Stage PFE chez la licorne de santé Doctolib. Analyse des latences de requêtes, scaling horizontal sur AWS EKS, "
                    "et monitoring Datadog. Stack : Ruby/Rails, TypeScript, Kubernetes, Terraform."
                ),
                "url": "https://www.meteojob.com/offres/doctolib-pfe-sre-performance",
            },
        ]

        return pool[:limit]

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
