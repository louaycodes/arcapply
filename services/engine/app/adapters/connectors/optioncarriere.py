import re
import urllib.parse
from typing import Any
import httpx
from bs4 import BeautifulSoup
from app.ports.connectors import BaseJobConnector


class OptionCarriereJobConnector(BaseJobConnector):
    """
    Connecteur réel Optioncarriere.tn.
    Effectue un appel HTTP réel vers optioncarriere.tn. En cas de blocage Cloudflare Turnstile,
    renvoie une liste vide avec log explicite (aucun mock ni fallback fictif - AD-4).
    """

    @property
    def platform_name(self) -> str:
        return "optioncarriere"

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
            url = f"https://www.optioncarriere.tn/emploi?s={encoded_query}&l=Tunisie"
            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                ),
                "Accept-Language": "fr-FR,fr;q=0.9",
            }

            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 403 or "cf-turnstile" in resp.text or "Vérification requise" in resp.text:
                    print("[OptionCarriereConnector] Source indisponible : blocage anti-bot Cloudflare Turnstile")
                    return []

                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    articles = soup.find_all(["article", "div"], class_=lambda c: c and "job" in c)

                    for art in articles:
                        link_el = art.find("a", href=True)
                        if not link_el:
                            continue
                        raw_title = link_el.text.strip()
                        href = link_el["href"]
                        full_url = href if href.startswith("http") else f"https://www.optioncarriere.tn{href}"

                        comp_p = art.find("p", class_=lambda c: c and "company" in c)
                        company = comp_p.text.strip() if comp_p else "Entreprise Partenaire OptionCarriere"

                        ext_id = self.generate_stable_id("oc", full_url)

                        results.append({
                            "external_id": ext_id,
                            "platform": "optioncarriere",
                            "title": raw_title,
                            "company": company,
                            "location": "Tunisie",
                            "country": "Tunisie",
                            "description_raw": (
                                f"Offre indexée par Optioncarriere Tunisie. Titre : {raw_title}. "
                                f"Recruteur : {company}. Consultez l'annonce originale pour postuler."
                            ),
                            "url": full_url,
                        })

                        if len(results) >= limit:
                            break
        except Exception as e:
            print(f"[OptionCarriereConnector] Source indisponible : {e}")
            return []

        return results

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
