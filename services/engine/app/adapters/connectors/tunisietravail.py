import re
import urllib.parse
from typing import Any
import httpx
from bs4 import BeautifulSoup
from app.ports.connectors import BaseJobConnector


class TunisieTravailJobConnector(BaseJobConnector):
    """
    Connecteur réel de recherche et d'ingestion d'offres TunisieTravail.net (Tunisie).
    Scrape en direct les offres et annonces de stages PFE récentes en Tunisie.
    """

    @property
    def platform_name(self) -> str:
        return "tunisietravail"

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
        }

        try:
            async with httpx.AsyncClient(timeout=9.0, follow_redirects=True) as client:
                for term in search_terms:
                    if len(results) >= limit:
                        break

                    encoded_query = urllib.parse.quote(term)
                    # Pagination sur TunisieTravail (&paged=1, 2...)
                    for page in range(1, 4):
                        if len(results) >= limit:
                            break

                        url = f"https://www.tunisietravail.net/?s={encoded_query}&paged={page}" if page > 1 else f"https://www.tunisietravail.net/?s={encoded_query}"
                        try:
                            resp = await client.get(url, headers=headers)
                            if resp.status_code != 200 or not resp.text:
                                break

                            soup = BeautifulSoup(resp.text, "html.parser")
                            articles = soup.find_all("article")
                            if not articles:
                                break

                            page_added = 0
                            for art in articles:
                                h_tag = art.find(["h2", "h3"])
                                if not h_tag or not h_tag.find("a"):
                                    continue

                                link_el = h_tag.find("a")
                                raw_title = link_el.text.strip()
                                job_url = link_el.get("href", "")
                                if not job_url or job_url in seen_urls:
                                    continue
                                seen_urls.add(job_url)

                                # Extraction entreprise depuis le titre
                                comp_match = re.match(r"^([A-Za-z0-9\s]+?)\s+(?:offre|recrute|cherche)", raw_title, re.IGNORECASE)
                                company = comp_match.group(1).strip() if comp_match else "Entreprise TunisieTravail"

                                id_match = re.search(r"-(\d+)/?$", job_url)
                                ext_id = f"tt-{id_match.group(1)}" if id_match else f"tt-{abs(hash(job_url)) % 1000000}"

                                snippet_el = art.find("div", class_="entry-summary") or art.find("p")
                                snippet = snippet_el.text.strip() if snippet_el else f"Annonce de stage PFE sur TunisieTravail : {raw_title}"

                                results.append({
                                    "external_id": ext_id,
                                    "platform": "tunisietravail",
                                    "title": raw_title,
                                    "company": company,
                                    "location": "Tunis, Tunisie",
                                    "country": "Tunisie",
                                    "description_raw": snippet,
                                    "url": job_url,
                                })
                                page_added += 1

                                if len(results) >= limit:
                                    break

                            if page_added == 0:
                                break

                            await self.apply_jitter(min_seconds=0.15, max_seconds=0.35)

                        except Exception as page_err:
                            print(f"[TunisieTravailConnector] Erreur page {page} ({term}): {page_err}")
                            break

        except Exception as e:
            print(f"[TunisieTravailConnector] Live scraping error: {e}")
            return []

        return results

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        """Extrait le contenu exhaustif de l'annonce depuis TunisieTravail."""
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            ),
        }
        try:
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(job_url, headers=headers)
                if resp.status_code == 200 and resp.text:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    body = soup.find("div", class_="PostContent") or soup.find("div", class_="entry")
                    if body:
                        return {
                            "url": job_url,
                            "status": "active",
                            "description_raw": body.get_text(separator="\n").strip(),
                        }
        except Exception:
            pass

        return {"url": job_url, "status": "active"}
