from typing import Any
from app.ports.connectors import BaseJobConnector


class StackOverflowJobsJobConnector(BaseJobConnector):
    """
    Connecteur StackOverflow Jobs & Developer Hub.
    Opportunités de stages ingénieurs logiciel et profils open-source.
    """

    @property
    def platform_name(self) -> str:
        return "stackoverflow_jobs"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.5)

        pool = [
            {
                "external_id": "so-pfe-mozilla",
                "platform": "stackoverflow_jobs",
                "title": "Stage PFE - Ingénieur R&D WebAssembly & Runtimes Navigateur",
                "company": "Mozilla Europe",
                "location": "Paris / Remote, France",
                "country": "France",
                "description_raw": (
                    "Stage PFE chez Mozilla pour travailler sur le moteur SpiderMonkey et les spécifications WebAssembly. "
                    "Expérience en Rust, C++, structures de données et compilation de code."
                ),
                "url": "https://stackoverflow.com/jobs/mozilla-pfe-wasm",
            },
            {
                "external_id": "so-pfe-datadog",
                "platform": "stackoverflow_jobs",
                "title": "Stage PFE - Software Engineer Observability & Tracing Agent",
                "company": "Datadog France",
                "location": "Paris, France",
                "country": "France",
                "description_raw": (
                    "Stage PFE chez Datadog au sein de l'équipe APM (Application Performance Monitoring). "
                    "Développement de traceurs et d'instrumentation bas niveau pour les runtimes Python et Go."
                ),
                "url": "https://stackoverflow.com/jobs/datadog-pfe-apm",
            },
        ]

        return pool[:limit]

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
