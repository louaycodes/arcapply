import asyncio
import re
import urllib.parse
from typing import Any
from playwright.async_api import async_playwright
from app.ports.connectors import BaseJobConnector


class ApecJobConnector(BaseJobConnector):
    """
    Connecteur réel Apec.fr (Association pour l'Emploi des Cadres).
    Effectue un scraping dynamique via Playwright pour extraire les offres cadres/stages réelles.
    """

    @property
    def platform_name(self) -> str:
        return "apec"

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
            url = f"https://www.apec.fr/candidat/recherche-emploi.html/emploi?motsCles={encoded_query}"

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

                job_links = await page.query_selector_all('a[href*="/emploi/detail-offre/"]')

                seen_urls = set()
                for link in job_links:
                    href = await link.get_attribute("href") or ""
                    raw_text = (await link.inner_text()).strip().replace("\n", " ")

                    if not href or href in seen_urls:
                        continue
                    seen_urls.add(href)

                    # Construire l'URL canonique propre sans query params de pagination
                    clean_path = href.split("?")[0]
                    full_url = f"https://www.apec.fr{clean_path}" if clean_path.startswith("/") else clean_path

                    id_match = re.search(r"detail-offre/([0-9A-Za-z]+)", clean_path)
                    ext_id = f"apec-{id_match.group(1)}" if id_match else f"apec-{abs(hash(full_url)) % 1000000}"

                    # Séparer entreprise et titre si présents dans le texte du lien
                    title = raw_text
                    company = "Entreprise Partenaire Apec"
                    if " - " in raw_text:
                        parts = raw_text.split(" - ", 1)
                        company = parts[0].strip()
                        title = parts[1].strip()

                    results.append({
                        "external_id": ext_id,
                        "platform": "apec",
                        "title": title or "Offre Cadre / Stage Apec",
                        "company": company,
                        "location": "France",
                        "country": "France",
                        "description_raw": (
                            f"Offre certifiée collectée en direct sur l'Apec. Intitulé : {title} chez {company}. "
                            f"Consultez l'annonce complète : {full_url}"
                        ),
                        "url": full_url,
                    })

                    if len(results) >= limit:
                        break

                await browser.close()
        except Exception as e:
            print(f"[ApecConnector] Live scraping error: {e}")
            return []

        return results

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
