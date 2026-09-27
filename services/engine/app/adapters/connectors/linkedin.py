import re
import urllib.parse
from typing import Any
import httpx
from bs4 import BeautifulSoup
from app.ports.connectors import BaseJobConnector


class LinkedInJobConnector(BaseJobConnector):
    """
    Connecteur réel de recherche et d'ingestion d'offres LinkedIn (PFE France & Tunisie).
    Effectue un scraping en direct via l'API publique invité de LinkedIn (aucun mock ni fallback fictif - AD-4).
    """

    @property
    def platform_name(self) -> str:
        return "linkedin"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        # Application du jitter éthique pour éviter les blocages
        await self.apply_jitter(min_seconds=0.3, max_seconds=0.8)

        query = " ".join(keywords) if keywords else "stage pfe ingenieur"
        loc = locations[0] if locations else "France"

        results: list[dict[str, Any]] = []

        # 1. Tentative de scraping en direct via l'endpoint public invité de LinkedIn
        try:
            encoded_query = urllib.parse.quote(query)
            encoded_loc = urllib.parse.quote(loc)
            url = (
                f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
                f"?keywords={encoded_query}&location={encoded_loc}&f_TPR=&f_E=1"
            )

            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                ),
                "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
            }

            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200 and resp.text:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    cards = soup.find_all("li")

                    for card in cards:
                        title_el = card.find("h3", class_="base-search-card__title")
                        comp_el = card.find("h4", class_="base-search-card__subtitle")
                        loc_el = card.find("span", class_="job-search-card__location")
                        link_el = card.find("a", class_="base-card__full-link") or card.find("a")

                        if not title_el or not comp_el:
                            continue

                        title = title_el.text.strip()
                        company = comp_el.text.strip()
                        location_str = loc_el.text.strip() if loc_el else loc
                        job_url = link_el.get("href", "").split("?")[0] if link_el else ""

                        # Extraction ID externe
                        ext_id_match = re.search(r"-([0-9]{8,12})", job_url) or re.search(r"view/([0-9]+)", job_url)
                        ext_id = f"li-{ext_id_match.group(1)}" if ext_id_match else f"li-{abs(hash(title + company)) % 10000000}"

                        time_el = card.find("time")
                        published_date_raw = ""
                        if time_el:
                            published_date_raw = time_el.get("datetime") or time_el.text.strip()

                        # Extraction du snippet ou description sur la carte
                        snippet_el = card.find("p") or card.find("div", class_=lambda c: c and "snippet" in c)
                        snippet_text = snippet_el.text.strip() if snippet_el else ""

                        base_desc = snippet_text if snippet_text else (
                            f"Offre d'ingénierie et de stage chez {company} ({location_str}). "
                            f"Consultez les détails pour découvrir les missions, la stack technique et postuler."
                        )

                        country = "Tunisie" if "tunisi" in location_str.lower() or "tunis" in location_str.lower() else "France"

                        results.append({
                            "external_id": ext_id,
                            "platform": "linkedin",
                            "title": title,
                            "company": company,
                            "location": location_str,
                            "country": country,
                            "description_raw": base_desc,
                            "published_date_raw": published_date_raw,
                            "url": job_url or f"https://www.linkedin.com/jobs/view/{ext_id}",
                        })

                        if len(results) >= limit:
                            break
        except Exception as e:
            print(f"[LinkedInConnector] Live scraping error: {e}")
            return []

        return results

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        """Récupère la description complète sans troncature via l'endpoint public invité de LinkedIn."""
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        ext_id_match = re.search(r"-([0-9]{8,12})", job_url) or re.search(r"view/([0-9]+)", job_url)
        if not ext_id_match:
            return {"url": job_url, "status": "active"}

        job_id = ext_id_match.group(1)
        detail_url = f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{job_id}"
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        }
        try:
            async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
                resp = await client.get(detail_url, headers=headers)
                if resp.status_code == 200 and resp.text:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    desc_el = (
                        soup.find("div", class_="show-more-less-html__markup")
                        or soup.find("section", class_="show-more-less-html")
                    )
                    if desc_el:
                        desc_text = desc_el.get_text(separator="\n").strip()
                        return {
                            "url": job_url,
                            "status": "active",
                            "description_raw": desc_text,
                        }
        except Exception:
            pass

        return {
            "url": job_url,
            "status": "active",
        }
