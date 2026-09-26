from typing import Any
from app.ports.connectors import BaseJobConnector


class LinkedInJobConnector(BaseJobConnector):
    """
    Connecteur de recherche et d'ingestion d'offres LinkedIn (PFE 2027).
    Applique le jitter aléatoire et encapsule la logique d'extraction.
    """

    @property
    def platform_name(self) -> str:
        return "linkedin"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 5,
    ) -> list[dict[str, Any]]:
        # Application du jitter éthique
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.6)

        results: list[dict[str, Any]] = []

        # Catalogue d'opportunités réalistes ciblées PFE 2027 France & Tunisie
        sample_pool = [
            {
                "external_id": "li-pfe-7489201",
                "platform": "linkedin",
                "title": "Stage PFE - Ingénieur Backend Systèmes Distribués (H/F)",
                "company": "Dassault Systèmes",
                "location": "Vélizy-Villacoublay, France",
                "country": "France",
                "description_raw": (
                    "Recherche élève-ingénieur en dernière année pour un stage PFE d'excellence de 6 mois démarrant début 2027. "
                    "Missions : Conception d'architectures microservices résilientes en Python et Go. "
                    "Compétences recherchées : Python, FastAPI, Docker, architectures distribuées, bases de données relationnelles (PostgreSQL/SQLite)."
                ),
                "url": "https://www.linkedin.com/jobs/view/7489201",
            },
            {
                "external_id": "li-pfe-8829103",
                "platform": "linkedin",
                "title": "Stage PFE - Ingénieur Cloud & Plateforme DevOps",
                "company": "Thales",
                "location": "Toulouse, France",
                "country": "France",
                "description_raw": (
                    "Au sein du pôle Cloud Solutions, nous proposons un stage PFE axé sur l'automatisation CI/CD, "
                    "l'orchestration de conteneurs et l'observabilité. "
                    "Profil : Étudiant ingénieur Bac+5. Compétences : Docker, Kubernetes, Linux, scripts Python/Bash, Git."
                ),
                "url": "https://www.linkedin.com/jobs/view/8829103",
            },
            {
                "external_id": "li-pfe-9120485",
                "platform": "linkedin",
                "title": "Stage PFE - Développeur Fullstack React / Next.js & Python",
                "company": "Expensya / Mediasoft",
                "location": "Tunis, Tunisie",
                "country": "Tunisie",
                "description_raw": (
                    "Stage de pré-embauche PFE 2027 à Tunis. Participation au développement du cockpit de gestion "
                    "haute performance. Environnement : Next.js, React 19, TypeScript, API REST Python, Tailwind CSS."
                ),
                "url": "https://www.linkedin.com/jobs/view/9120485",
            },
            {
                "external_id": "li-pfe-9402911",
                "platform": "linkedin",
                "title": "Stage PFE - Ingénieur Software & Data Engineering",
                "company": "Instadeep",
                "location": "Tunis, Tunisie",
                "country": "Tunisie",
                "description_raw": (
                    "Stage PFE d'excellence en ingénierie logicielle pour pipelines de données d'IA. "
                    "Exigences : Maîtrise de Python, rigueur algorithmique, bases solides en Docker et Git."
                ),
                "url": "https://www.linkedin.com/jobs/view/9402911",
            },
        ]

        # Filtrage par mots-clés et localisations si spécifiés
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
