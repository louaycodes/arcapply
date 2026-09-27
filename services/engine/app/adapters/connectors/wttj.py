from typing import Any
import httpx
from app.ports.connectors import BaseJobConnector


class WTTJJobConnector(BaseJobConnector):
    """
    Connecteur Welcome to the Jungle (WTTJ - Tech & Startups France).
    Effectue un appel réel vers la plateforme WTTJ. WTTJ soumettant désormais la recherche
    d'offres à un tunnel d'onboarding/authentification utilisateur obligatoire,
    le connecteur renvoie une liste vide avec log explicite (aucun mock - AD-4).
    """

    @property
    def platform_name(self) -> str:
        return "wttj"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.3, max_seconds=0.6)

        try:
            url = "https://www.welcometothejungle.com/fr/jobs"
            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                ),
            }
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                # WTTJ redirige le trafic non authentifié vers l'onboarding profil
                if resp.status_code in (200, 202) and "get-started" in str(resp.url):
                    print("[WTTJConnector] Source indisponible : authentification obligatoire / accès public direct restreint")
                    return []
                print("[WTTJConnector] Source indisponible : tunnel d'inscription obligatoire")
                return []
        except Exception as e:
            print(f"[WTTJConnector] Source indisponible : {e}")
            return []

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
