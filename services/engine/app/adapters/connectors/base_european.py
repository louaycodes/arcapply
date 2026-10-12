from __future__ import annotations

import re
import urllib.parse
from typing import Any, Optional
import httpx
from bs4 import BeautifulSoup
from app.domain.country_resolver import get_default_keywords_for_location, resolve_country_name
from app.ports.connectors import BaseJobConnector


class BaseEuropeanWebJobConnector(BaseJobConnector):
    """
    Connecteur de base réutilisable et ultra-robuste pour les plateformes d'emploi européennes.
    Gère :
    - User-Agent moderne et en-têtes multilingues
    - Jitter éthique (AD-6)
    - Normalisation des mots-clés selon le pays
    - Parsing HTML avec BeautifulSoup et sélecteurs de secours
    - Génération déterministe d'identifiants stables (MD5)
    - Résolution déterministe du pays
    - Fallback sans crash si un portail externe est temporairement indisponible.
    """

    platform_slug: str = "generic_eu"
    default_country: str = "Europe"
    base_url: str = "https://example.com"
    search_url_template: str = "{base_url}/search?q={query}"
    card_selector: str = "article, .job-item, .job-card, .job_card, .job-listing, [class*='job-item'], [class*='job-card'], [class*='job_card'], [data-job-id]"
    title_selector: str = "h2, h3, h1, [class*='title'], a"
    company_selector: str = "[class*='company'], [class*='employer'], span"
    link_selector: str = "a"
    location_selector: str = "[class*='location'], [class*='city']"

    @property
    def platform_name(self) -> str:
        return self.platform_slug

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.15, max_seconds=0.4)

        fallback_kw = get_default_keywords_for_location(self.default_country)
        search_terms = self.normalize_search_terms(keywords, default_fallback=fallback_kw)

        results: list[dict[str, Any]] = []
        seen_ids: set[str] = set()

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,fr;q=0.8,de;q=0.7",
        }

        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            for query in search_terms:
                if len(results) >= limit:
                    break

                encoded_query = urllib.parse.quote(query)
                target_url = self.search_url_template.format(
                    base_url=self.base_url.rstrip("/"),
                    query=encoded_query,
                )

                try:
                    resp = await client.get(target_url, headers=headers)
                    if resp.status_code != 200 or not resp.text:
                        continue

                    parsed = self.parse_html_cards(resp.text, str(resp.url), limit - len(results), seen_ids)
                    results.extend(parsed)

                except Exception as e:
                    print(f"[{self.platform_slug}] Erreur requête vers {target_url}: {e}")
                    continue

                await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)

        return results[:limit]

    def parse_html_cards(
        self,
        html_text: str,
        current_url: str,
        max_items: int,
        seen_ids: set[str],
    ) -> list[dict[str, Any]]:
        soup = BeautifulSoup(html_text, "html.parser")
        items = []
        seen_urls = set()

        # Détection des cartes d'offres
        cards = soup.select(self.card_selector)
        if not cards:
            cards = soup.find_all(["article", "li"])

        for card in cards:
            if len(items) >= max_items:
                break

            # Ignorer les conteneurs parents qui englobent d'autres cartes
            if card.select("article, .job-card, .job-item"):
                continue

            link_el = card.select_one(self.link_selector) if self.link_selector else card.find("a")
            if not link_el or not link_el.get("href"):
                if card.name == "a" and card.get("href"):
                    link_el = card
                else:
                    continue

            href = link_el.get("href", "")
            if not href or href.startswith("#") or "javascript:" in href:
                continue

            job_url = urllib.parse.urljoin(self.base_url, href)
            if job_url in seen_urls or job_url.rstrip("/") == self.base_url.rstrip("/"):
                continue
            if job_url.rstrip("/").endswith(("/jobs", "/emplois", "/vacatures", "/karriere")):
                continue
            seen_urls.add(job_url)

            # Titre
            title_el = card.select_one(self.title_selector)
            title = (title_el.get_text(strip=True) if title_el else link_el.get_text(strip=True)) or "Opportunité"
            # Nettoyage et suppression d'émojis tiers
            title = re.sub(r"[^\w\s\-\.,/&()+#'\"–—]", "", title)
            title = re.sub(r"\s+", " ", title).strip()
            title_lower = title.lower()
            if len(title) < 4 or any(bad in title_lower for bad in [
                "apply", "postuler", "details", "en savoir plus", "voir",
                "for jobsøgere", "for arbejdsgivere", "find jobs", "search jobs",
                "connexion", "login", "create account", "privacy policy"
            ]):
                continue

            # Entreprise
            company_el = card.select_one(self.company_selector)
            company = company_el.get_text(strip=True) if company_el else f"Entreprise {self.default_country}"
            company = re.sub(r"[^\w\s\-\.,/&()+#'\"–—]", "", company)
            company = re.sub(r"\s+", " ", company).strip()
            if len(company) > 60 or company == title or not company:
                company = f"Entreprise {self.default_country}"


            # Lieu
            loc_el = card.select_one(self.location_selector)
            location_str = loc_el.get_text(strip=True) if loc_el else self.default_country
            location_str = re.sub(r"\s+", " ", location_str).strip()

            ext_id = self.generate_stable_id(self.platform_slug[:6], f"{title}:{company}:{job_url}")
            if ext_id in seen_ids:
                continue
            seen_ids.add(ext_id)

            country = resolve_country_name(location_str) if location_str else resolve_country_name(self.default_country)

            items.append({
                "external_id": ext_id,
                "platform": self.platform_slug,
                "title": title,
                "company": company,
                "location": location_str,
                "country": country,
                "description_raw": (
                    f"Offre d'opportunité collectée sur {self.platform_slug.upper()} ({country}). "
                    f"Poste : {title} chez {company}. Lieu : {location_str}. "
                    f"Consultez les détails pour postuler : {job_url}"
                ),
                "url": job_url,
            })

        return items

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        """Extrait le texte complet de l'annonce."""
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.25)
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
        }
        try:
            async with httpx.AsyncClient(timeout=7.0, follow_redirects=True) as client:
                resp = await client.get(job_url, headers=headers)
                if resp.status_code == 200 and resp.text:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    body_el = soup.find(["article", "main", "section"]) or soup.find("div", class_=lambda c: c and ("desc" in c or "body" in c or "content" in c))
                    if body_el:
                        return {
                            "url": job_url,
                            "status": "active",
                            "description_raw": body_el.get_text(separator="\n").strip(),
                        }
        except Exception:
            pass
        return {"url": job_url, "status": "active"}
