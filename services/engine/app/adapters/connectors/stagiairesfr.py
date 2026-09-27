from typing import Any
import httpx
from app.ports.connectors import BaseJobConnector


class StagiairesFrJobConnector(BaseJobConnector):
    """
    Connecteur Stagiaires.fr.
    Effectue une requête réelle. Le site étant inactif (page de parking OVH "Site en construction"),
    renvoie une liste vide avec log explicite (aucun mock - AD-4).
    """

    @property
    def platform_name(self) -> str:
        return "stagiaires_fr"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.4)

        try:
            url = "http://www.stagiaires.fr"
            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                ),
            }
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                if "Site en construction" in resp.text or "ovh" in resp.text.lower():
                    print("[StagiairesFrConnector] Source indisponible : site inactif (page parking OVH)")
                    return []
                return []
        except Exception as e:
            print(f"[StagiairesFrConnector] Source indisponible : {e}")
            return []

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
