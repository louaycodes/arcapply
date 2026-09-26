from typing import Any
from app.ports.connectors import BaseJobConnector


class JobteaserJobConnector(BaseJobConnector):
    """
    Connecteur de recherche et d'ingestion d'offres Jobteaser (PFE Grandes Écoles).
    Applique le jitter aléatoire et cible les opportunités partenaires universitaires.
    """

    @property
    def platform_name(self) -> str:
        return "jobteaser"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 5,
    ) -> list[dict[str, Any]]:
        # Application du jitter éthique
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.5)

        sample_pool = [
            {
                "external_id": "jt-pfe-550192",
                "platform": "jobteaser",
                "title": "Stage PFE - Ingénieur Conception Logicielle & Microservices",
                "company": "Société Générale (IT & Solutions)",
                "location": "Paris La Défense, France",
                "country": "France",
                "description_raw": (
                    "Stage PFE 2027 au sein de la direction informatique. Développement de modules de traitement "
                    "bancaire résilients. Technologies : Python, FastAPI, API REST, Docker, PostgreSQL."
                ),
                "url": "https://www.jobteaser.com/fr/job-offers/550192",
            },
            {
                "external_id": "jt-pfe-610488",
                "platform": "jobteaser",
                "title": "Stage Fin d'Études - Ingénieur QA Automatisation & Test Engine",
                "company": "Capgemini",
                "location": "Lyon, France",
                "country": "France",
                "description_raw": (
                    "Rejoignez notre centre d'excellence pour votre PFE d'ingénieur. Automatisation de tests E2E, "
                    "tests de charge et intégration continue. Connaissances : Python, Playwright ou Selenium, CI/CD."
                ),
                "url": "https://www.jobteaser.com/fr/job-offers/610488",
            },
            {
                "external_id": "jt-pfe-720194",
                "platform": "jobteaser",
                "title": "Stage PFE - Développeur Systèmes Embarqués & IoT",
                "company": "Telnet",
                "location": "Tunis, Tunisie",
                "country": "Tunisie",
                "description_raw": (
                    "Stage de fin d'études orienté passerelles IoT et traitement local de données. "
                    "Profil : Élève-ingénieur avec de bonnes connaissances en C/C++, Linux embarqué et protocoles réseau."
                ),
                "url": "https://www.jobteaser.com/fr/job-offers/720194",
            },
        ]

        results: list[dict[str, Any]] = []
        for job in sample_pool:
            if locations:
                if not any(loc.lower() in job["country"].lower() or loc.lower() in job["location"].lower() for loc in locations):
                    continue
            results.append(job)
            if len(results) >= limit:
                break

        return results

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {
            "url": job_url,
            "status": "active",
        }
