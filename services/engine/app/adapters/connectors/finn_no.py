from __future__ import annotations

import re
import urllib.parse
from typing import Any
import httpx
from bs4 import BeautifulSoup
from app.ports.connectors import BaseJobConnector


class FinnNoJobConnector(BaseJobConnector):
    """
    Connecteur réel FINN.no (Portail numéro 1 de l'emploi en Norvège).
    Scrape en direct les annonces de stage, PFE, masteroppgave et emplois juniors en Norvège.
    """

    @property
    def platform_name(self) -> str:
        return "finn_no"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 15,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.5)

        search_terms = self.normalize_search_terms(
            keywords,
            default_fallback=["internship", "sommerjobb", "trainee", "masteroppgave"],
        )

        results: list[dict[str, Any]] = []
        seen_ids: set[str] = set()

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9,no;q=0.8",
        }

        async with httpx.AsyncClient(timeout=9.0, follow_redirects=True) as client:
            for term in search_terms:
                if len(results) >= limit:
                    break

                encoded_term = urllib.parse.quote(term)
                # FINN.no search url
                search_url = f"https://www.finn.no/job/search?q={encoded_term}"

                try:
                    resp = await client.get(search_url, headers=headers)
                    if resp.status_code != 200 or not resp.text:
                        continue

                    soup = BeautifulSoup(resp.text, "html.parser")
                    articles = soup.find_all("article")

                    for article in articles:
                        if len(results) >= limit:
                            break

                        link_el = article.find("a")
                        if not link_el:
                            continue

                        href = link_el.get("href", "")
                        if not href or "/job/ad/" not in href:
                            continue

                        job_url = href if href.startswith("http") else f"https://www.finn.no{href}"

                        # ID d'annonce FINN (ex: 478074729)
                        id_match = re.search(r"/job/ad/(\d+)", job_url)
                        finn_id = id_match.group(1) if id_match else href
                        if finn_id in seen_ids:
                            continue
                        seen_ids.add(finn_id)

                        # Titre
                        h2_el = article.find("h2") or article.find("h3") or link_el
                        title = h2_el.get_text(strip=True) if h2_el else "Offre FINN.no"

                        # Entreprise & Localisation
                        comp_el = article.find("div", class_=lambda c: c and ("text-caption" in c or "subtle" in c))
                        company = comp_el.get_text(strip=True) if comp_el else "Entreprise Norvège"

                        loc_el = article.find("span", class_=lambda c: c and "truncate" in c)
                        loc_val = loc_el.get_text(strip=True) if loc_el else "Oslo"
                        location_str = f"{loc_val}, Norvège" if loc_val else "Norvège"

                        base_desc = (
                            f"Offre FINN.no : {title} chez {company} ({location_str}). "
                            f"Consultez les détails pour découvrir les missions et postuler."
                        )

                        results.append({
                            "external_id": f"finn-{finn_id}",
                            "platform": "finn_no",
                            "title": title,
                            "company": company,
                            "location": location_str,
                            "country": "Norway",
                            "description_raw": base_desc,
                            "url": job_url,
                        })

                except Exception as e:
                    print(f"[FinnNoConnector] Erreur requête '{term}': {e}")
                    continue

                await self.apply_jitter(min_seconds=0.2, max_seconds=0.4)

        return results

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        """Extrait la description complète sur la page d'annonce FINN.no."""
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9,no;q=0.8",
        }
        try:
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(job_url, headers=headers)
                if resp.status_code == 200 and resp.text:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    # Conteneur principal de texte de l'annonce
                    body_el = soup.find("div", class_=lambda c: c and ("import-decoration" in c or "body" in c or "description" in c))
                    if not body_el:
                        body_el = soup.find("section") or soup.find("main")

                    if body_el:
                        desc_text = body_el.get_text(separator="\n").strip()
                        return {
                            "url": job_url,
                            "status": "active",
                            "description_raw": desc_text,
                        }
        except Exception:
            pass

        return {"url": job_url, "status": "active"}
