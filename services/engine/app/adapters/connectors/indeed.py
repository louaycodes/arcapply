import re
import urllib.parse
from typing import Any
from playwright.async_api import async_playwright
from app.domain.country_resolver import get_default_keywords_for_location, resolve_country_name
from app.ports.connectors import BaseJobConnector

INDEED_DOMAINS: dict[str, str] = {
    "norway": "no.indeed.com",
    "norvège": "no.indeed.com",
    "sweden": "se.indeed.com",
    "suède": "se.indeed.com",
    "denmark": "dk.indeed.com",
    "danemark": "dk.indeed.com",
    "finland": "fi.indeed.com",
    "finlande": "fi.indeed.com",
    "germany": "de.indeed.com",
    "allemagne": "de.indeed.com",
    "switzerland": "ch.indeed.com",
    "suisse": "ch.indeed.com",
    "belgium": "be.indeed.com",
    "belgique": "be.indeed.com",
    "united kingdom": "uk.indeed.com",
    "uk": "uk.indeed.com",
    "royaume-uni": "uk.indeed.com",
    "netherlands": "nl.indeed.com",
    "pays-bas": "nl.indeed.com",
    "spain": "es.indeed.com",
    "espagne": "es.indeed.com",
    "italy": "it.indeed.com",
    "italie": "it.indeed.com",
    "luxembourg": "lu.indeed.com",
    "ireland": "ie.indeed.com",
    "irlande": "ie.indeed.com",
    "france": "fr.indeed.com",
    "tunisie": "fr.indeed.com",
}


class IndeedJobConnector(BaseJobConnector):
    """
    Connecteur réel Indeed International (France, Norvège, Allemagne, Suisse, UK...).
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
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.5)

        target_locations = [l.strip() for l in locations if l.strip()] if locations else ["France"]
        results: list[dict[str, Any]] = []
        seen_jks = set()

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page(
                    user_agent=(
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                    )
                )

                for loc in target_locations:
                    if len(results) >= limit:
                        break

                    country = resolve_country_name(loc)
                    domain = INDEED_DOMAINS.get(loc.lower()) or INDEED_DOMAINS.get(country.lower(), "indeed.com")
                    fallback_kw = get_default_keywords_for_location(loc)
                    search_terms = self.normalize_search_terms(keywords, default_fallback=fallback_kw)

                    for query in search_terms:
                        if len(results) >= limit:
                            break

                        encoded_query = urllib.parse.quote(query)
                        encoded_loc = urllib.parse.quote(loc)
                        url = f"https://{domain}/jobs?q={encoded_query}&l={encoded_loc}"

                        try:
                            await page.goto(url, timeout=10000, wait_until="domcontentloaded")
                            try:
                                await page.wait_for_selector("div.job_seen_beacon, td.resultContent, a[data-jk]", timeout=2500)
                            except Exception:
                                pass

                            # Sélecteurs Indeed pour les cartes d'offres
                            cards = await page.query_selector_all("div.job_seen_beacon, td.resultContent, a[data-jk]")

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

                                job_url = f"https://{domain}/viewjob?jk={jk}"

                                # Entreprise et localisation
                                company = "Entreprise Partenaire Indeed"
                                location_str = loc
                                comp_el = await card.query_selector('span[data-testid="company-name"], span.companyName')
                                if comp_el:
                                    company = (await comp_el.inner_text()).strip()

                                loc_el = await card.query_selector('div[data-testid="text-location"], div.companyLocation')
                                if loc_el:
                                    location_str = (await loc_el.inner_text()).strip()

                                job_country = resolve_country_name(location_str) if location_str else country

                                results.append({
                                    "external_id": f"ind-{jk}",
                                    "platform": "indeed",
                                    "title": title,
                                    "company": company,
                                    "location": location_str,
                                    "country": job_country,
                                    "description_raw": (
                                        f"Offre collectée sur Indeed ({job_country}). Titre : {title} chez {company}. "
                                        f"Lien officiel de l'offre : {job_url}"
                                    ),
                                    "url": job_url,
                                })

                                if len(results) >= limit:
                                    break

                        except Exception as e:
                            print(f"[IndeedConnector] Erreur requête ({loc} / {query}): {e}")
                            continue

                await browser.close()
        except Exception as e:
            print(f"[IndeedConnector] Erreur initialisation navigateur Playwright: {e}")
            return results

        return results

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
