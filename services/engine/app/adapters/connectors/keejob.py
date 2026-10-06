import re
import urllib.parse
from typing import Any
import httpx
from bs4 import BeautifulSoup
from app.ports.connectors import BaseJobConnector


class KeejobJobConnector(BaseJobConnector):
    """
    Connecteur réel de recherche et d'ingestion d'offres Keejob (Tunisie).
    Scrape en direct les opportunités PFE et jeunes ingénieurs en Tunisie.
    """

    @property
    def platform_name(self) -> str:
        return "keejob"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 15,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.5)

        search_terms = self.normalize_search_terms(
            keywords,
            default_fallback=["stage pfe", "stage", "pfe"],
        )
        results: list[dict[str, Any]] = []
        seen_urls: set[str] = set()

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "fr-FR,fr;q=0.9",
        }

        try:
            async with httpx.AsyncClient(timeout=9.0, follow_redirects=True) as client:
                for term in search_terms:
                    if len(results) >= limit:
                        break

                    encoded_query = urllib.parse.quote(term)
                    # Pagination sur Keejob (&page=1, 2...)
                    for page in range(1, 4):
                        if len(results) >= limit:
                            break

                        url = f"https://www.keejob.com/offres-emploi/?keywords={encoded_query}&page={page}"
                        try:
                            resp = await client.get(url, headers=headers)
                            if resp.status_code != 200 or not resp.text:
                                break

                            soup = BeautifulSoup(resp.text, "html.parser")
                            job_links = soup.find_all(
                                "a",
                                href=lambda h: h and "/offres-emploi/" in h and re.search(r"/\d+/", h)
                            )
                            if not job_links:
                                break

                            page_added = 0
                            for link in job_links:
                                raw_title = link.text.strip()
                                href = link.get("href", "")
                                if not raw_title or len(raw_title) < 4 or "voir l'offre" in raw_title.lower():
                                    continue
                                if href in seen_urls:
                                    continue
                                seen_urls.add(href)

                                id_match = re.search(r"/(\d+)/", href)
                                ext_id = f"kee-{id_match.group(1)}" if id_match else f"kee-{abs(hash(raw_title)) % 1000000}"
                                full_url = href if href.startswith("http") else f"https://www.keejob.com{href}"

                                parent_card = link.find_parent("div")
                                company = "Entreprise Partenaire Keejob"
                                if parent_card:
                                    comp_el = parent_card.find("a", href=lambda h: h and "/entreprises/" in h)
                                    if comp_el and comp_el.text.strip():
                                        company = comp_el.text.strip()

                                results.append({
                                    "external_id": ext_id,
                                    "platform": "keejob",
                                    "title": raw_title,
                                    "company": company,
                                    "location": "Tunis, Tunisie",
                                    "country": "Tunisie",
                                    "description_raw": (
                                        f"Offre PFE collectée en direct sur Keejob Tunisie. Intitulé : {raw_title}. "
                                        f"Recruteur : {company}. Consultez l'annonce officielle pour les prérequis et le dépôt de candidature."
                                    ),
                                    "url": full_url,
                                })
                                page_added += 1

                                if len(results) >= limit:
                                    break

                            if page_added == 0:
                                break

                            await self.apply_jitter(min_seconds=0.15, max_seconds=0.35)

                        except Exception as page_err:
                            print(f"[KeejobConnector] Erreur page {page} ({term}): {page_err}")
                            break

        except Exception as e:
            print(f"[KeejobConnector] Live scraping error: {e}")
            return []

        return results

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        """Extrait la description complète depuis l'annonce Keejob."""
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "fr-FR,fr;q=0.9",
        }
        try:
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(job_url, headers=headers)
                if resp.status_code == 200 and resp.text:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    prose_el = soup.find("div", class_="prose") or soup.find("div", class_="block_details")
                    if prose_el:
                        return {
                            "url": job_url,
                            "status": "active",
                            "description_raw": prose_el.get_text(separator="\n").strip(),
                        }
        except Exception:
            pass

        return {"url": job_url, "status": "active"}
