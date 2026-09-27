import re
from typing import Any
import httpx
from bs4 import BeautifulSoup
from app.ports.connectors import BaseJobConnector


class OffreEmploiTnJobConnector(BaseJobConnector):
    """
    Connecteur réel Offre-emploi.tn (Section stages et PFE Tunisie).
    Effectue un scraping HTTP en direct sur la section /offres-de-stages/ avec extraction de vraies URLs.
    """

    @property
    def platform_name(self) -> str:
        return "offre_emploi_tn"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.3, max_seconds=0.6)

        results: list[dict[str, Any]] = []
        url = "https://www.offre-emploi.tn/offres-de-stages/"
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        }

        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200 and resp.text:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    links = soup.find_all("a", href=lambda h: h and "/offres-de-stages/" in h and re.search(r"-\d+/?$", h))

                    seen_urls = set()
                    for link in links:
                        raw_title = link.text.strip()
                        href = link.get("href", "")
                        if not raw_title or len(raw_title) < 4 or href in seen_urls:
                            continue

                        full_url = href if href.startswith("http") else f"https://www.offre-emploi.tn{href}"
                        seen_urls.add(href)

                        id_match = re.search(r"-(\d+)/?$", href)
                        ext_id = f"oet-{id_match.group(1)}" if id_match else f"oet-{abs(hash(full_url)) % 1000000}"

                        results.append({
                            "external_id": ext_id,
                            "platform": "offre_emploi_tn",
                            "title": raw_title,
                            "company": "Entreprise Partenaire Offre-Emploi.tn",
                            "location": "Tunis, Tunisie",
                            "country": "Tunisie",
                            "description_raw": (
                                f"Offre de stage collectée en direct sur Offre-Emploi Tunisie. Titre : {raw_title}. "
                                f"Consultez l'offre sur {full_url}"
                            ),
                            "url": full_url,
                        })

                        if len(results) >= limit:
                            break
        except Exception as e:
            print(f"[OffreEmploiTnConnector] Live scraping error: {e}")
            return []

        return results

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
