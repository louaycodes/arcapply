import urllib.parse
from typing import Any
import httpx
from bs4 import BeautifulSoup
from app.ports.connectors import BaseJobConnector


class MonsterJobConnector(BaseJobConnector):
    """
    Connecteur réel Monster.fr.
    Effectue une requête HTTP réelle vers monster.fr. En cas de blocage anti-bot (403),
    renvoie une liste vide avec log explicite (aucun mock - AD-4).
    """

    @property
    def platform_name(self) -> str:
        return "monster"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.5)

        query = " ".join(keywords) if keywords else "stage pfe"
        try:
            encoded_query = urllib.parse.quote(query)
            url = f"https://www.monster.fr/emploi/recherche?q={encoded_query}"
            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                ),
            }

            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 403 or "Access Denied" in resp.text:
                    print("[MonsterConnector] Source indisponible : blocage anti-bot (HTTP 403)")
                    return []
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    links = soup.find_all("a", href=lambda h: h and "/job-openings/" in h)
                    results = []
                    for l in links[:limit]:
                        href = l.get("href", "")
                        title = l.text.strip()
                        full_url = f"https://www.monster.com{href}" if href.startswith("/") else href
                        results.append({
                            "external_id": self.generate_stable_id("mon", full_url),
                            "platform": "monster",
                            "title": title or "Offre Monster",
                            "company": "Entreprise Partenaire Monster",
                            "location": "France",
                            "country": "France",
                            "description_raw": f"Offre collectée sur Monster France : {title}. URL : {full_url}",
                            "url": full_url,
                        })
                    return results
                return []
        except Exception as e:
            print(f"[MonsterConnector] Source indisponible : {e}")
            return []

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
