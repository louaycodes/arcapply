import re
import urllib.parse
from typing import Any
from playwright.async_api import async_playwright
from app.ports.connectors import BaseJobConnector


class IndeedJobConnector(BaseJobConnector):
    """
    Connecteur réel Indeed.fr.
    Effectue un scraping dynamique via Playwright pour extraire les vraies offres d'emploi et stages Indeed.
    """

    @property
    def platform_name(self) -> str:
        return "indeed"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.3, max_seconds=0.6)

        query = " ".join(keywords) if keywords else "stage pfe"
        results: list[dict[str, Any]] = []

        try:
            encoded_query = urllib.parse.quote(query)
            url = f"https://fr.indeed.com/jobs?q={encoded_query}"

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

                # Sélecteurs réels Indeed pour les cartes d'offres
                cards = await page.query_selector_all('div.job_seen_beacon, td.resultContent, a[data-jk]')

                seen_jks = set()
                for card in cards:
                    link_el = await card.query_selector('a[data-jk], h2.jobTitle a, a[href*="/viewjob"], a[href*="/rc/clk"]')
                    if not link_el:
                        if await card.get_attribute("data-jk"):
                            link_el = card
                        else:
                            continue

                    jk = await link_el.get_attribute("data-jk")
                    href = await link_el.get_attribute("href") or ""
                    title = (await link_el.inner_text()).strip().replace("\n", " ")

                    if not jk and href:
                        jk_match = re.search(r"jk=([0-9a-fA-F]+)", href)
                        if jk_match:
                            jk = jk_match.group(1)

                    if not jk or jk in seen_jks or not title:
                        continue
                    seen_jks.add(jk)

                    job_url = f"https://fr.indeed.com/viewjob?jk={jk}"

                    # Entreprise et localisation
                    company = "Entreprise Partenaire Indeed"
                    location_str = "France"
                    comp_el = await card.query_selector('span[data-testid="company-name"], span.companyName')
                    if comp_el:
                        company = (await comp_el.inner_text()).strip()

                    loc_el = await card.query_selector('div[data-testid="text-location"], div.companyLocation')
                    if loc_el:
                        location_str = (await loc_el.inner_text()).strip()

                    results.append({
                        "external_id": f"ind-{jk}",
                        "platform": "indeed",
                        "title": title,
                        "company": company,
                        "location": location_str,
                        "country": "France",
                        "description_raw": (
                            f"Offre de stage collectée en direct sur Indeed France. Titre : {title} chez {company}. "
                            f"Lien officiel de l'offre : {job_url}"
                        ),
                        "url": job_url,
                    })

                    if len(results) >= limit:
                        break

                await browser.close()
        except Exception as e:
            print(f"[IndeedConnector] Live scraping error: {e}")
            return []

        return results

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
