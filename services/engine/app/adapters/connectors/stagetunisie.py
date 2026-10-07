import re
import urllib.parse
from typing import Any
import httpx
from bs4 import BeautifulSoup
from app.ports.connectors import BaseJobConnector


class StageTunisieJobConnector(BaseJobConnector):
    """
    Connecteur Stage-tunisie.tn.
    Vérifie la disponibilité du domaine et effectue la requête réelle.
    En cas de domaine non résolu ou d'erreur de connexion, renvoie une liste vide avec log explicite (aucun mock - AD-4).
    """

    @property
    def platform_name(self) -> str:
        return "stagetunisie"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.4)

        search_terms = self.normalize_search_terms(
            keywords,
            default_fallback=["stage pfe", "stage", "pfe"],
        )
        query = search_terms[0] if search_terms else "stage pfe"
        results: list[dict[str, Any]] = []

        try:
            encoded_query = urllib.parse.quote(query)
            url = f"https://stage-tunisie.tn/?s={encoded_query}&post_type=job_listing"
            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                ),
            }

            async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200 and resp.text:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    listings = soup.find_all("li", class_=lambda c: c and "job_listing" in c)

                    for item in listings:
                        link_el = item.find("a", href=True)
                        title_el = item.find(["h3", "h4"]) or link_el
                        if not link_el or not title_el:
                            continue
                        raw_title = title_el.text.strip()
                        full_url = link_el["href"]

                        comp_el = item.find("div", class_=lambda c: c and "company" in c)
                        company = comp_el.text.strip() if comp_el else "Entreprise PFE Tunisie"

                        ext_id = self.generate_stable_id("st", full_url)

                        results.append({
                            "external_id": ext_id,
                            "platform": "stagetunisie",
                            "title": raw_title,
                            "company": company,
                            "location": "Tunis, Tunisie",
                            "country": "Tunisie",
                            "description_raw": (
                                f"Sujet de stage PFE publié sur Stage-Tunisie. Titre : {raw_title}. "
                                f"Structure d'accueil : {company}. Consultez l'annonce : {full_url}"
                            ),
                            "url": full_url,
                        })

                        if len(results) >= limit:
                            break
        except httpx.ConnectError:
            print("[StageTunisieConnector] Source indisponible : nom de domaine inexistant ou abandonné (DNS non résolu)")
            return []
        except Exception as e:
            print(f"[StageTunisieConnector] Source indisponible : {e}")
            return []

        return results

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
