from typing import Any
from app.ports.connectors import BaseJobConnector


class CapDigitalJobConnector(BaseJobConnector):
    """
    Connecteur Cap Digital (Pôle de compétitivité européen de la transition numérique et écologique).
    Cible les stages PFE dans les startups deeptech, edtech, greentech et laboratoires de recherche partenaires.
    """

    @property
    def platform_name(self) -> str:
        return "capdigital"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.5)

        pool = [
            {
                "external_id": "cap-pfe-mistral",
                "platform": "capdigital",
                "title": "Stage PFE - Ingénieur Évaluation & Quantization de Grands Modèles (LLM)",
                "company": "Deeptech Partner (Écosystème Cap Digital)",
                "location": "Paris (Station F), France",
                "country": "France",
                "description_raw": (
                    "Stage PFE d'excellence au sein d'une startup deeptech IA membre de Cap Digital. "
                    "Optimisation de modèles de fondation open-source (quantization INT4/INT8, distillation et inférence rapide avec vLLM). "
                    "Technologies : Python, PyTorch, CUDA, Triton, vLLM."
                ),
                "url": "https://talents.capdigital.com/offres/deeptech-pfe-llm-quantization",
            },
            {
                "external_id": "cap-pfe-greentech",
                "platform": "capdigital",
                "title": "Stage PFE - Ingénieur Mesure de l'Empreinte Carbone Numérique & Green IT",
                "company": "Greentech Alliance (Cap Digital)",
                "location": "Paris / Télétravail, France",
                "country": "France",
                "description_raw": (
                    "Stage PFE consacré à l'éco-conception logicielle et à la modélisation des consommations énergétiques des clouds publics. "
                    "Développement d'outils d'audit open-source pour développeurs. Compétences : Python, OpenTelemetry, Docker."
                ),
                "url": "https://talents.capdigital.com/offres/greentech-pfe-green-it",
            },
        ]

        return pool[:limit]

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
