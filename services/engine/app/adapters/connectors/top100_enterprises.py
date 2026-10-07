import json
import re
import urllib.parse
from datetime import datetime, timezone
from typing import Any, Optional
import httpx
from bs4 import BeautifulSoup
from app.domain.job_extractor import JobDeepExtractor
from app.domain.top100_companies import TOP_100_COMPANIES, get_top_companies_by_country
from app.ports.connectors import BaseJobConnector


class Top100EnterprisesJobConnector(BaseJobConnector):
    """
    Connecteur d'excellence pour les plateformes carrières directes des Top 100 Entreprises IT (France & Tunisie).
    Interroge directement les ATS d'entreprise (Greenhouse, Lever, SmartRecruiters, Workday et portails dédiés)
    pour capter les offres PFE et postes avant même leur publication sur les agrégateurs tiers.
    """

    @property
    def platform_name(self) -> str:
        return "top100_enterprises"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 15,
    ) -> list[dict[str, Any]]:
        # Jitter éthique
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.6)

        results: list[dict[str, Any]] = []
        loc_filter = [loc.lower() for loc in locations] if locations else ["france", "tunisie"]
        kw_list = [k.lower() for k in keywords] if keywords else ["pfe", "stage", "intern"]

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            ),
            "Accept": "application/json, text/html, */*",
            "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8",
        }

        async with httpx.AsyncClient(timeout=7.0, follow_redirects=True, headers=headers) as client:
            # 1. Scraping des entreprises avec board Greenhouse (ex: InstaDeep, Datadog, Criteo, Snowflake)
            for company in TOP_100_COMPANIES:
                if len(results) >= limit:
                    break

                # Filtre pays si spécifié
                comp_country = company.get("country", "France")
                if loc_filter and not any(l in comp_country.lower() for l in loc_filter):
                    continue

                ats_type = company.get("ats_type")
                portal_id = company.get("portal_id")

                try:
                    if ats_type == "greenhouse" and portal_id:
                        gh_jobs = await self._crawl_greenhouse_board(client, company, kw_list, limit - len(results))
                        results.extend(gh_jobs)
                    elif ats_type == "lever" and portal_id:
                        lever_jobs = await self._crawl_lever_board(client, company, kw_list, limit - len(results))
                        results.extend(lever_jobs)
                    elif ats_type == "smartrecruiters" and portal_id:
                        sr_jobs = await self._crawl_smartrecruiters_board(client, company, kw_list, limit - len(results))
                        results.extend(sr_jobs)
                    elif ats_type == "custom" or ats_type == "workday_or_taleo":
                        # Exploration du portail officiel dédié
                        direct_jobs = await self._crawl_direct_portal(client, company, kw_list, limit - len(results))
                        results.extend(direct_jobs)
                except Exception as err:
                    # Résilience : une indisponibilité d'un portail n'arrête pas le crawl global
                    continue

        return results[:limit]

    async def _crawl_greenhouse_board(
        self,
        client: httpx.AsyncClient,
        company: dict[str, Any],
        keywords: list[str],
        max_items: int,
    ) -> list[dict[str, Any]]:
        """Interroge l'API publique Greenhouse Board."""
        portal_id = company["portal_id"]
        url = f"https://boards-api.greenhouse.io/v1/boards/{portal_id}/jobs?content=true"
        found = []

        try:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                raw_jobs = data.get("jobs", [])
                for item in raw_jobs:
                    title = item.get("title", "")
                    content_html = item.get("content", "")
                    loc_name = item.get("location", {}).get("name", "")
                    clean_desc = JobDeepExtractor.clean_text(content_html)

                    # Filtrage par mots-clés PFE / stage / software
                    combined = f"{title} {loc_name} {clean_desc}".lower()
                    if not any(k in combined for k in keywords):
                        continue

                    country = "Tunisie" if any(t in (loc_name + " " + company["country"]).lower() for t in ["tunis", "tunisie"]) else "France"

                    job_entry = {
                        "external_id": f"gh-{portal_id}-{item.get('id')}",
                        "platform": "top100_enterprises",
                        "title": title,
                        "company": company["name"],
                        "location": loc_name or company.get("country", "France"),
                        "country": country,
                        "description_raw": clean_desc or f"Opportunité chez {company['name']} ({loc_name}).",
                        "published_date_raw": item.get("updated_at", ""),
                        "url": item.get("absolute_url", company.get("careers_url", "")),
                        "apply_url": item.get("absolute_url", ""),
                        "is_direct_career_site": True,
                        "department": item.get("departments", [{}])[0].get("name", "") if item.get("departments") else "",
                    }
                    found.append(job_entry)
                    if len(found) >= max_items:
                        break
        except Exception:
            pass

        return found

    async def _crawl_lever_board(
        self,
        client: httpx.AsyncClient,
        company: dict[str, Any],
        keywords: list[str],
        max_items: int,
    ) -> list[dict[str, Any]]:
        """Interroge l'API publique Lever Postings."""
        portal_id = company["portal_id"]
        url = f"https://api.lever.co/v0/postings/{portal_id}?mode=json"
        found = []

        try:
            resp = await client.get(url)
            if resp.status_code == 200:
                items = resp.json()
                for item in items:
                    title = item.get("text", "")
                    desc_plain = item.get("descriptionPlain", "")
                    cats = item.get("categories", {})
                    loc_name = cats.get("location", "")
                    team = cats.get("team", "")

                    combined = f"{title} {desc_plain} {loc_name}".lower()
                    if not any(k in combined for k in keywords):
                        continue

                    country = "Tunisie" if any(t in (loc_name + " " + company["country"]).lower() for t in ["tunis", "tunisie"]) else "France"

                    job_entry = {
                        "external_id": f"lev-{portal_id}-{item.get('id')}",
                        "platform": "top100_enterprises",
                        "title": title,
                        "company": company["name"],
                        "location": loc_name or company.get("country", "France"),
                        "country": country,
                        "description_raw": desc_plain or f"Poste chez {company['name']} ({loc_name}).",
                        "published_date_raw": datetime.fromtimestamp(item.get("createdAt", 0) / 1000, tz=timezone.utc).isoformat() if item.get("createdAt") else "",
                        "url": item.get("hostedUrl", company.get("careers_url", "")),
                        "apply_url": item.get("applyUrl", item.get("hostedUrl", "")),
                        "is_direct_career_site": True,
                        "department": team,
                    }
                    found.append(job_entry)
                    if len(found) >= max_items:
                        break
        except Exception:
            pass

        return found

    async def _crawl_smartrecruiters_board(
        self,
        client: httpx.AsyncClient,
        company: dict[str, Any],
        keywords: list[str],
        max_items: int,
    ) -> list[dict[str, Any]]:
        """Interroge l'API publique SmartRecruiters Postings."""
        portal_id = company["portal_id"]
        url = f"https://api.smartrecruiters.com/v1/companies/{portal_id}/postings?limit=25"
        found = []

        try:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("content", [])
                for item in items:
                    title = item.get("name", "")
                    loc = item.get("location", {})
                    city = loc.get("city", "")
                    country_name = loc.get("country", "")
                    dept = item.get("department", {}).get("label", "")

                    combined = f"{title} {dept} {city}".lower()
                    if not any(k in combined for k in keywords):
                        continue

                    c_val = "Tunisie" if any(t in (city + " " + country_name).lower() for t in ["tunis", "tunisia", "tn"]) else "France"

                    ext_id = f"sr-{portal_id}-{item.get('id')}"
                    apply_url = f"https://jobs.smartrecruiters.com/{portal_id}/{item.get('id')}"

                    job_entry = {
                        "external_id": ext_id,
                        "platform": "top100_enterprises",
                        "title": title,
                        "company": company["name"],
                        "location": f"{city}, {country_name}".strip(", ") or company.get("country", "France"),
                        "country": c_val,
                        "description_raw": f"Offre directe issue du portail carrières de {company['name']}. Département : {dept or 'Ingénierie & Tech'}. Consultez les missions et postulez directement auprès du service RH.",
                        "published_date_raw": item.get("releasedDate", ""),
                        "url": apply_url,
                        "apply_url": apply_url,
                        "is_direct_career_site": True,
                        "department": dept,
                    }
                    found.append(job_entry)
                    if len(found) >= max_items:
                        break
        except Exception:
            pass

        return found

    async def _crawl_direct_portal(
        self,
        client: httpx.AsyncClient,
        company: dict[str, Any],
        keywords: list[str],
        max_items: int,
    ) -> list[dict[str, Any]]:
        """
        Interroge directement la page carrières officielle (ex: EY, Vermeg, Focus, Telnet)
        en extrayant les balises d'offres ou annonces intégrées.
        """
        careers_url = company.get("careers_url", "")
        if not careers_url:
            return []

        found = []
        try:
            resp = await client.get(careers_url, timeout=5.0)
            if resp.status_code == 200 and resp.text:
                soup = BeautifulSoup(resp.text, "html.parser")
                # Recherche des liens ou cartes d'offres contenant des mots-clés
                job_links = soup.find_all("a", href=True)
                seen_urls = set()

                for a in job_links:
                    text_content = a.get_text().strip()
                    href = a.get("href", "")
                    if not text_content or len(text_content) < 6:
                        continue
                    if href in seen_urls:
                        continue

                    t_lower = text_content.lower()
                    if any(k in t_lower for k in keywords):
                        seen_urls.add(href)
                        full_url = href if href.startswith("http") else urllib.parse.urljoin(careers_url, href)
                        c_val = company.get("country", "France")
                        ext_id = self.generate_stable_id(f"dir-{company['id']}", full_url + text_content)

                        job_entry = {
                            "external_id": ext_id,
                            "platform": "top100_enterprises",
                            "title": text_content,
                            "company": company["name"],
                            "location": c_val,
                            "country": c_val,
                            "description_raw": (
                                f"Opportunité directe publiée sur le portail carrières dédié de {company['name']}. "
                                f"Postulez sans intermédiaire via le lien officiel de l'entreprise."
                            ),
                            "published_date_raw": "",
                            "url": full_url,
                            "apply_url": full_url,
                            "is_direct_career_site": True,
                        }
                        found.append(job_entry)
                        if len(found) >= max_items:
                            break
        except Exception:
            pass

        return found

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        """Extrait la description exhaustive depuis l'URL officielle de l'entreprise."""
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            ),
        }
        try:
            async with httpx.AsyncClient(timeout=6.0, follow_redirects=True, headers=headers) as client:
                resp = await client.get(job_url)
                if resp.status_code == 200 and resp.text:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    # Détection conteneur principal
                    main_el = soup.find("article") or soup.find("main") or soup.find("div", class_=lambda c: c and "job-description" in c)
                    if main_el:
                        clean_text = JobDeepExtractor.clean_text(main_el.get_text(separator="\n"))
                        return {
                            "url": job_url,
                            "status": "active",
                            "description_raw": clean_text,
                        }
        except Exception:
            pass

        return {"url": job_url, "status": "active"}
