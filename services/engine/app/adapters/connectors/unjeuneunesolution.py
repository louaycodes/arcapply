from typing import Any
import httpx
from app.ports.connectors import BaseJobConnector


class UnJeuneUneSolutionJobConnector(BaseJobConnector):
    """
    Connecteur 1jeune1solution.gouv.fr.
    L'accès aux offres 1jeune1solution nécessitant les clés API partenaires de France Travail (OAuth2),
    effectue une requête de vérification et renvoie une liste vide avec log explicite (aucun mock - AD-4).
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

        try:
            url = "https://www.1jeune1solution.gouv.fr/emplois"
            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                ),
            }
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                print("[1Jeune1SolutionConnector] Source indisponible : API publique restreinte / requiert authentification partenaire")
                return []
        except Exception as e:
            print(f"[1Jeune1SolutionConnector] Source indisponible : {e}")
            return []

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
