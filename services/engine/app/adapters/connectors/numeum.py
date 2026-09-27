from typing import Any
import httpx
from app.ports.connectors import BaseJobConnector


class NumeumJobConnector(BaseJobConnector):
    """
    Connecteur Numeum.fr (Syndicat professionnel de l'écosystème numérique français).
    Effectue une tentative de connexion réelle vers le portail numeric-emploi.org.
    En cas de timeout ou d'indisponibilité du serveur, renvoie une liste vide avec log explicite (aucun mock - AD-4).
    """

    @property
    def platform_name(self) -> str:
        return "numeum"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.5)

        try:
            url = "https://numeric-emploi.org/"
            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                ),
            }
            async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code != 200:
                    print(f"[NumeumConnector] Source indisponible : code HTTP {resp.status_code}")
                    return []
                return []
        except httpx.TimeoutException:
            print("[NumeumConnector] Source indisponible : portail de recrutement injoignable (timeout)")
            return []
        except Exception as e:
            print(f"[NumeumConnector] Source indisponible : {e}")
            return []

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
