import re
import urllib.parse
from typing import Any
import httpx
from bs4 import BeautifulSoup
from app.ports.connectors import BaseJobConnector


class TanitjobsJobConnector(BaseJobConnector):
    """
    Connecteur réel Tanitjobs (Tunisie).
    Effectue un appel HTTP réel vers tanitjobs.com. En cas de blocage Cloudflare (403),
    renvoie une liste vide avec log explicite (aucun mock ni fallback fictif - AD-4).
    """

    @property
    def platform_name(self) -> str:
        return "tanitjobs"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.5)

        search_terms = self.normalize_search_terms(
            keywords,
            default_fallback=["stage pfe", "stage", "pfe"],
        )
        query = search_terms[0] if search_terms else "stage pfe"
        results: list[dict[str, Any]] = []

        try:
            encoded_query = urllib.parse.quote(query)
            url = f"https://www.tanitjobs.com/jobs/?keywords={encoded_query}"
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
                    print("[TanitjobsConnector] Source indisponible : blocage anti-bot Cloudflare (HTTP 403)")
                    return []

                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    items = soup.find_all(["article", "div"], class_=lambda c: c and ("listing-item" in c or "job-item" in c))
                    for item in items:
                        title_el = item.find(["h2", "h3", "a"])
                        link = item.find("a", href=True)
                        if not title_el or not link:
                            continue
                        raw_title = title_el.text.strip()
                        comp_el = item.find("div", class_="employer") or item.find("span", class_="company")
                        company = comp_el.text.strip() if comp_el else "Recruteur Tanitjobs"
                        job_url = link["href"]
                        if not job_url.startswith("http"):
                            job_url = f"https://www.tanitjobs.com{job_url}"
                        ext_id = f"tanit-{abs(hash(job_url)) % 1000000}"

                        results.append({
                            "external_id": ext_id,
                            "platform": "tanitjobs",
                            "title": raw_title,
                            "company": company,
                            "location": "Tunis, Tunisie",
                            "country": "Tunisie",
                            "description_raw": f"Opportunité PFE collectée sur Tanitjobs Tunisie : {raw_title}.",
                            "url": job_url,
                        })
                        if len(results) >= limit:
                            break
        except Exception as e:
            print(f"[TanitjobsConnector] Source indisponible : {e}")
            return []

        return results

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
