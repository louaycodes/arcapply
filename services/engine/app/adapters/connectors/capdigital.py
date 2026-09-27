from typing import Any
import httpx
from app.ports.connectors import BaseJobConnector


class CapDigitalJobConnector(BaseJobConnector):
    """
    Connecteur Cap Digital.
    Cap Digital étant un pôle de compétitivité sans job board public direct,
    effectue une vérification d'accès et renvoie une liste vide avec log explicite (aucun mock - AD-4).
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

        try:
            url = "https://www.capdigital.com"
            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                ),
            }
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                print("[CapDigitalConnector] Source indisponible : pôle de compétitivité sans job board direct")
                return []
        except Exception as e:
            print(f"[CapDigitalConnector] Source indisponible : {e}")
            return []

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
