from __future__ import annotations

import re
import urllib.parse
from typing import Any
import httpx
from app.ports.connectors import BaseJobConnector


class NAVNorwayJobConnector(BaseJobConnector):
    """
    Connecteur officiel pour Arbeidsplassen / NAV (Service Public de l'Emploi de Norvège).
    Exploite l'API REST publique ouverte de NAV (OpenSearch / Elasticsearch) :
    - Zéro scraping HTML fragile
    - Zéro blocage Cloudflare/CAPTCHA
    - Données ultra-structurées (employeur, compétences, lieu, description complète).
    """

    @property
    def platform_name(self) -> str:
        return "nav_norway"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 15,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.4)

        search_terms = self.normalize_search_terms(
            keywords,
            default_fallback=["internship", "trainee", "sommerjobb", "masteroppgave", "praksis"],
        )

        results: list[dict[str, Any]] = []
        seen_ids: set[str] = set()

        headers = {
            "User-Agent": "ArcApply-JobCopilot/1.0 (+https://github.com/louaycodes/arcapply)",
            "Accept": "application/json",
        }

        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            for term in search_terms:
                if len(results) >= limit:
                    break

                encoded_term = urllib.parse.quote(term)
                # Endpoint public de recherche de stillinger (offres d'emploi)
                api_url = f"https://arbeidsplassen.nav.no/stillinger/api/search?q={encoded_term}&size={min(limit, 25)}"

                try:
                    resp = await client.get(api_url, headers=headers)
                    if resp.status_code != 200:
                        continue

                    data = resp.json()
                    hits_container = data.get("hits", {})
                    hits = hits_container.get("hits", []) if isinstance(hits_container, dict) else []

                    for hit in hits:
                        source = hit.get("_source", {})
                        uuid_val = source.get("uuid") or hit.get("_id")
                        if not uuid_val or uuid_val in seen_ids:
                            continue

                        title = source.get("title", "").strip()
                        if not title:
                            continue

                        employer = source.get("businessName") or source.get("employer", {}).get("name") or "Entreprise Norvégienne"

                        # Localisation
                        loc_list = source.get("locations", [])
                        loc_parts = []
                        if loc_list and isinstance(loc_list, list):
                            first_loc = loc_list[0]
                            if isinstance(first_loc, dict):
                                city = first_loc.get("city") or first_loc.get("municipal") or ""
                                county = first_loc.get("county") or ""
                                if city:
                                    loc_parts.append(city)
                                if county and county != city:
                                    loc_parts.append(county)

                        location_str = ", ".join(loc_parts) + ", Norvège" if loc_parts else "Norvège"

                        # Description
                        description_raw = source.get("description", "") or source.get("adtext", "")
                        # Nettoyage balises HTML
                        clean_desc = re.sub(r"<[^>]+>", " ", description_raw)
                        clean_desc = re.sub(r"\s+", " ", clean_desc).strip()

                        link_url = f"https://arbeidsplassen.nav.no/stillinger/stilling/{uuid_val}"
                        apply_url = source.get("applicationUrl") or link_url
                        published_at = source.get("published")

                        seen_ids.add(uuid_val)
                        results.append({
                            "external_id": f"nav-{uuid_val}",
                            "platform": "nav_norway",
                            "title": title,
                            "company": employer,
                            "location": location_str,
                            "country": "Norway",
                            "description_raw": clean_desc or f"Offre officielle NAV Norvège : {title} chez {employer}.",
                            "published_date_raw": published_at,
                            "url": link_url,
                            "apply_url": apply_url,
                        })

                        if len(results) >= limit:
                            break

                except Exception as e:
                    print(f"[NAVNorwayConnector] Erreur requête pour '{term}': {e}")
                    continue

                await self.apply_jitter(min_seconds=0.15, max_seconds=0.3)

        return results

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        # L'API NAV fournit déjà la description intégrale dès la recherche
        return {"url": job_url, "status": "active"}
