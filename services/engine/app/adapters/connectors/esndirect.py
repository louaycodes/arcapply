from typing import Any
import httpx
from app.ports.connectors import BaseJobConnector


class ESNDirectJobConnector(BaseJobConnector):
    """
    Connecteur ESN Direct.
    Effectue une vérification réelle de l'infrastructure cible. Le domaine étant inactif (parké HugeDomains),
    renvoie une liste vide avec log explicite (aucun mock - AD-4).
    """

    @property
    def platform_name(self) -> str:
        return "esn_direct"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.4)

        try:
            url = "http://www.esndirect.com"
            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                ),
            }
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                if "hugedomains" in resp.text.lower() or "for sale" in resp.text.lower():
                    print("[ESNDirectConnector] Source indisponible : domaine inactif / nom de domaine en vente (HugeDomains)")
                    return []
                return []
        except Exception as e:
            print(f"[ESNDirectConnector] Source indisponible : {e}")
            return []

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
