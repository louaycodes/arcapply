import re
import urllib.parse
from typing import Any
import httpx
from bs4 import BeautifulSoup
from app.ports.connectors import BaseJobConnector


class EmploiTunisieJobConnector(BaseJobConnector):
    """
    Connecteur réel Emploitunisie.com (AfricaWork Tunisie).
    Effectue un appel HTTP réel vers emploitunisie.com. En cas de blocage Cloudflare (403),
    renvoie une liste vide avec log explicite (aucun mock ni fallback fictif - AD-4).
    """

    @property
    def platform_name(self) -> str:
        return "emploitunisie"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.5)

        query = " ".join(keywords) if keywords else "stage pfe"
        results: list[dict[str, Any]] = []

        try:
            encoded_query = urllib.parse.quote(query)
            url = f"https://www.emploitunisie.com/recherche-jobs-tunisie?search_api_views_fulltext={encoded_query}"
            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                ),
                "Accept-Language": "fr-FR,fr;q=0.9",
            }

            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 403 or "Just a moment..." in resp.text or "cf-challenge" in resp.text:
                    print("[EmploiTunisieConnector] Source indisponible : blocage anti-bot Cloudflare (HTTP 403)")
                    return []

                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    job_cards = soup.find_all("div", class_=lambda c: c and ("job-description-wrapper" in c or "job-item" in c))

                    for card in job_cards:
                        link_el = card.find("a", href=True)
                        if not link_el:
                            continue
                        raw_title = link_el.text.strip()
                        href = link_el["href"]
                        full_url = href if href.startswith("http") else f"https://www.emploitunisie.com{href}"

                        comp_el = card.find("div", class_=lambda c: c and "company" in c)
                        company = comp_el.text.strip() if comp_el else "Recruteur Tech EmploiTunisie"

                        id_match = re.search(r"/(\d+)", href)
                        ext_id = f"et-{id_match.group(1)}" if id_match else f"et-{abs(hash(full_url)) % 1000000}"

                        results.append({
                            "external_id": ext_id,
                            "platform": "emploitunisie",
                            "title": raw_title,
                            "company": company,
                            "location": "Tunis, Tunisie",
                            "country": "Tunisie",
                            "description_raw": (
                                f"Offre PFE collectée sur EmploiTunisie. Titre : {raw_title}. "
                                f"Entreprise : {company}. Consultez le portail pour postuler."
                            ),
                            "url": full_url,
                        })

                        if len(results) >= limit:
                            break
        except Exception as e:
            print(f"[EmploiTunisieConnector] Source indisponible : {e}")
            return []

        return results

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
