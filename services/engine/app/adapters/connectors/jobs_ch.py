from __future__ import annotations

import re
import urllib.parse
from typing import Any
import httpx
from bs4 import BeautifulSoup
from app.ports.connectors import BaseJobConnector


class JobsChJobConnector(BaseJobConnector):
    """
    Connecteur réel Jobs.ch (Premier portail d'offres d'emploi et stages en Suisse).
    Scrape en direct les offres de stages, master thesis et postes juniors en Suisse (Zürich, Genève, Lausanne...).
    """

    @property
    def platform_name(self) -> str:
        return "jobs_ch"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 15,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.5)

        search_terms = self.normalize_search_terms(
            keywords,
            default_fallback=["internship", "stage", "praktikum", "master thesis"],
        )

        results: list[dict[str, Any]] = []
        seen_ids: set[str] = set()

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9,fr-FR;q=0.8,de;q=0.7",
        }

        async with httpx.AsyncClient(timeout=9.0, follow_redirects=True) as client:
            for term in search_terms:
                if len(results) >= limit:
                    break

                encoded_term = urllib.parse.quote(term)
                search_url = f"https://www.jobs.ch/en/vacancies/?term={encoded_term}"

                try:
                    resp = await client.get(search_url, headers=headers)
                    if resp.status_code != 200 or not resp.text:
                        continue

                    soup = BeautifulSoup(resp.text, "html.parser")
                    links = soup.find_all("a", href=lambda h: h and "/vacancies/detail/" in h)

                    for link in links:
                        if len(results) >= limit:
                            break

                        href = link.get("href", "")
                        id_match = re.search(r"/vacancies/detail/([a-zA-Z0-9\-]+)", href)
                        if not id_match:
                            continue

                        job_id = id_match.group(1)
                        if job_id in seen_ids:
                            continue
                        seen_ids.add(job_id)

                        title = link.get("title") or ""
                        if not title:
                            # Fallback sur texte brut
                            raw_text = link.get_text(separator=" | ").strip()
                            parts = [p.strip() for p in raw_text.split("|") if p.strip()]
                            title = parts[0] if parts else "Internship Switzerland"
                            title = re.sub(r"^\d+\s+(?:days?|weeks?|months?|hours?)\s+ago\s*", "", title, flags=re.IGNORECASE)

                        # Recherche de l'entreprise et du lieu
                        company = "Entreprise Suisse"
                        location_str = "Suisse"

                        all_spans = [s.get_text(strip=True) for s in link.find_all(["span", "p"]) if s.get_text(strip=True)]
                        for i, s in enumerate(all_spans):
                            if "place of work:" in s.lower() and i + 1 < len(all_spans):
                                location_str = f"{all_spans[i+1]}, Suisse"
                            elif s not in (title, "Easy apply", "Internship") and not s.startswith("Place of") and not s.endswith("ago"):
                                if len(s) > 2 and company == "Entreprise Suisse" and "workload" not in s.lower():
                                    company = s

                        full_url = f"https://www.jobs.ch{href}" if href.startswith("/") else href

                        results.append({
                            "external_id": f"ch-{job_id}",
                            "platform": "jobs_ch",
                            "title": title,
                            "company": company,
                            "location": location_str,
                            "country": "Switzerland",
                            "description_raw": (
                                f"Offre collectée sur Jobs.ch (Suisse). Titre : {title} chez {company} ({location_str}). "
                                f"Consultez les détails pour découvrir les missions et postuler."
                            ),
                            "url": full_url,
                        })

                except Exception as e:
                    print(f"[JobsChConnector] Erreur requête '{term}': {e}")
                    continue

                await self.apply_jitter(min_seconds=0.2, max_seconds=0.4)

        return results

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        """Extrait la description complète sur la page d'annonce Jobs.ch."""
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9,fr-FR;q=0.8,de;q=0.7",
        }
        try:
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(job_url, headers=headers)
                if resp.status_code == 200 and resp.text:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    desc_container = soup.find("div", {"data-cy": "vacancy-description"}) or soup.find("article") or soup.find("main")
                    if desc_container:
                        return {
                            "url": job_url,
                            "status": "active",
                            "description_raw": desc_container.get_text(separator="\n").strip(),
                        }
        except Exception:
            pass

        return {"url": job_url, "status": "active"}
