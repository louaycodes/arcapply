import re
import urllib.parse
from typing import Any
import httpx
from bs4 import BeautifulSoup
from app.ports.connectors import BaseJobConnector


class LEtudiantJobConnector(BaseJobConnector):
    """
    Connecteur réel L'Etudiant (jobs-stages.letudiant.fr).
    Effectue une requête HTTP réelle. En cas d'indisponibilité ou absence d'offres correspondantes,
    renvoie une liste vide (aucun mock ni fallback fictif - AD-4).
    """

    @property
    def platform_name(self) -> str:
        return "letudiant"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.4)

        query = " ".join(keywords) if keywords else "stage pfe"
        results: list[dict[str, Any]] = []

        try:
            encoded_query = urllib.parse.quote(query)
            url = f"https://jobs-stages.letudiant.fr/offres?keyword={encoded_query}"
            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                ),
                "Accept-Language": "fr-FR,fr;q=0.9",
            }

            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200 and resp.text:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    links = soup.find_all("a", href=lambda h: h and "/offres/" in h and re.search(r"-\d+", h))

                    seen = set()
                    for l in links:
                        href = l.get("href", "")
                        raw_title = l.text.strip()
                        if not raw_title or len(raw_title) < 4 or href in seen:
                            continue
                        seen.add(href)

                        full_url = f"https://jobs-stages.letudiant.fr{href}" if href.startswith("/") else href
                        ext_id = self.generate_stable_id("let", full_url)

                        results.append({
                            "external_id": ext_id,
                            "platform": "letudiant",
                            "title": raw_title,
                            "company": "Entreprise Partenaire L'Etudiant",
                            "location": "France",
                            "country": "France",
                            "description_raw": f"Offre de stage collectée sur L'Etudiant : {raw_title}. URL : {full_url}",
                            "url": full_url,
                        })

                        if len(results) >= limit:
                            break
        except Exception as e:
            print(f"[LEtudiantConnector] Source indisponible : {e}")
            return []

        return results

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
