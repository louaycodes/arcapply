import re
import urllib.parse
from typing import Any
import httpx
from bs4 import BeautifulSoup
from app.ports.connectors import BaseJobConnector


class MeteojobJobConnector(BaseJobConnector):
    """
    Connecteur réel Meteojob (CleverConnect).
    Effectue un scraping HTTP en direct sur meteojob.com avec extraction de vraies URLs d'offres.
    """

    @property
    def platform_name(self) -> str:
        return "meteojob"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.5)

        search_terms = self.normalize_search_terms(
            keywords,
            default_fallback=["stage pfe", "stage ingenieur", "stage"],
        )
        results: list[dict[str, Any]] = []
        seen_urls = set()

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        }

        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                for term in search_terms:
                    if len(results) >= limit:
                        break

                    encoded_query = urllib.parse.quote(term)
                    url = f"https://www.meteojob.com/jobs?what={encoded_query}"
                    try:
                        resp = await client.get(url, headers=headers)
                        if resp.status_code == 200 and resp.text:
                            soup = BeautifulSoup(resp.text, "html.parser")
                            links = soup.find_all("a", href=lambda h: h and "/jobs/" in h)

                            for link in links:
                                raw_title = link.text.strip()
                                href = link.get("href", "")
                                if not raw_title or len(raw_title) < 4 or href in seen_urls:
                                    continue

                                full_url = href if href.startswith("http") else f"https://www.meteojob.com{href}"
                                seen_urls.add(href)

                                id_match = re.search(r"/jobs/(\d+)", href)
                                ext_id = f"met-{id_match.group(1)}" if id_match else f"met-{abs(hash(full_url)) % 1000000}"

                                # Parent card lookup for company
                                parent = link.find_parent("article") or link.find_parent("div")
                                company = "Entreprise Partenaire Meteojob"
                                location_str = "France"
                                if parent:
                                    text_elements = [p.text.strip() for p in parent.find_all(["p", "span"]) if p.text.strip()]
                                    if text_elements:
                                        company = text_elements[0]
                                    if len(text_elements) > 1:
                                        location_str = text_elements[1]

                                results.append({
                                    "external_id": ext_id,
                                    "platform": "meteojob",
                                    "title": raw_title,
                                    "company": company,
                                    "location": location_str,
                                    "country": "France",
                                    "description_raw": (
                                        f"Offre de stage collectée en direct sur Meteojob France. Titre : {raw_title}. "
                                        f"Consultez l'offre sur {full_url}"
                                    ),
                                    "url": full_url,
                                })

                                if len(results) >= limit:
                                    break
                    except Exception as err:
                        print(f"[MeteojobConnector] Erreur requête ({term}): {err}")
                        break
        except Exception as e:
            print(f"[MeteojobConnector] Live scraping error: {e}")
            return []

        return results

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
