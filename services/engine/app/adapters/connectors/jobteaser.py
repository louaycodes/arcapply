import re
import urllib.parse
from typing import Any
from playwright.async_api import async_playwright
from app.ports.connectors import BaseJobConnector


class JobteaserJobConnector(BaseJobConnector):
    """
    Connecteur réel Jobteaser (PFE Grandes Écoles & Universités).
    Effectue un scraping dynamique via Playwright pour extraire les vraies offres de stages.
    """

    @property
    def platform_name(self) -> str:
        return "jobteaser"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.5)

        search_terms = self.normalize_search_terms(
            keywords,
            default_fallback=["stage pfe", "stage ingenieur", "stage"],
        )
        query = search_terms[0] if search_terms else "stage pfe"
        results: list[dict[str, Any]] = []

        try:
            encoded_query = urllib.parse.quote(query)
            url = f"https://www.jobteaser.com/fr/job-offers?q={encoded_query}"

            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page(
                    user_agent=(
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                    )
                )
                await page.goto(url, timeout=15000, wait_until="domcontentloaded")
                await page.wait_for_timeout(3000)

                # Sélecteurs réels Jobteaser pour les offres
                links = await page.query_selector_all('a[href*="/job-offers/"]')

                seen_urls = set()
                for link in links:
                    href = await link.get_attribute("href") or ""
                    raw_text = (await link.inner_text()).strip().replace("\n", " ")

                    if not href or href in seen_urls:
                        continue

                    # Ignorer les liens non-spécifiques
                    if href.endswith("/job-offers") or href.endswith("/job-offers/"):
                        continue
                    seen_urls.add(href)

                    full_url = f"https://www.jobteaser.com{href}" if href.startswith("/") else href

                    id_match = re.search(r"/job-offers/([0-9a-fA-F-]+)", href)
                    ext_id = f"jt-{id_match.group(1)}" if id_match else f"jt-{abs(hash(full_url)) % 1000000}"

                    title = raw_text if raw_text and len(raw_text) > 4 else "Stage PFE Jobteaser"
                    company = "Entreprise Partenaire Jobteaser"

                    # Recherche d'entreprise dans le parent
                    parent = await link.query_selector("xpath=ancestor::article[1]") or await link.query_selector("xpath=ancestor::div[2]")
                    if parent:
                        parent_text = (await parent.inner_text()).strip()
                        lines = [line.strip() for line in parent_text.splitlines() if line.strip()]
                        if len(lines) >= 2:
                            company = lines[0] if lines[0] != title else lines[1]

                    results.append({
                        "external_id": ext_id,
                        "platform": "jobteaser",
                        "title": title,
                        "company": company,
                        "location": "France",
                        "country": "France",
                        "description_raw": (
                            f"Offre de stage collectée en direct sur Jobteaser. Intitulé : {title} chez {company}. "
                            f"Consultez l'offre sur {full_url}"
                        ),
                        "url": full_url,
                    })

                    if len(results) >= limit:
                        break

                await browser.close()
        except Exception as e:
            print(f"[JobteaserConnector] Live scraping error: {e}")
            return []

        return results

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
