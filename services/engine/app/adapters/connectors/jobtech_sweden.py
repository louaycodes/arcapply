from __future__ import annotations

import re
import urllib.parse
from typing import Any
import httpx
from app.ports.connectors import BaseJobConnector


class JobTechSwedenJobConnector(BaseJobConnector):
    """
    Connecteur officiel JobTech Dev / Arbetsförmedlingen (Service Public de l'Emploi de Suède).
    Exploite l'API REST ouverte suédoise :
    - Zéro blocage anti-bot
    - Format JSON officiel hautement qualifié (titre, employeur, compétences, ville, salaire, lien).
    """

    @property
    def platform_name(self) -> str:
        return "jobtech_sweden"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 15,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.4)

        search_terms = self.normalize_search_terms(
            keywords,
            default_fallback=["internship", "exjobb", "examensarbete", "praktik", "thesis"],
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
                # Endpoint public officiel JobTech Dev
                api_url = f"https://jobsearch.api.jobtechdev.se/search?q={encoded_term}&limit={min(limit, 20)}"

                try:
                    resp = await client.get(api_url, headers=headers)
                    if resp.status_code != 200:
                        continue

                    data = resp.json()
                    hits = data.get("hits", [])

                    for hit in hits:
                        job_id = hit.get("id")
                        if not job_id or str(job_id) in seen_ids:
                            continue

                        title = hit.get("headline", "").strip()
                        if not title:
                            continue

                        employer = hit.get("employer", {}).get("name") or "Entreprise Suédoise"

                        # Localisation
                        addr = hit.get("workplace_address", {})
                        city = addr.get("city") or addr.get("municipality") or ""
                        location_str = f"{city}, Suède" if city else "Suède"

                        # Description
                        desc_data = hit.get("description", {})
                        description_raw = desc_data.get("text", "") if isinstance(desc_data, dict) else str(desc_data)
                        clean_desc = re.sub(r"<[^>]+>", " ", description_raw)
                        clean_desc = re.sub(r"\s+", " ", clean_desc).strip()

                        job_url = hit.get("webpage_url") or f"https://arbetsformedlingen.se/platsbanken/annonser/{job_id}"
                        app_details = hit.get("application_details", {})
                        apply_url = app_details.get("url") if isinstance(app_details, dict) else job_url
                        pub_date = hit.get("publication_date")

                        seen_ids.add(str(job_id))
                        results.append({
                            "external_id": f"se-{job_id}",
                            "platform": "jobtech_sweden",
                            "title": title,
                            "company": employer,
                            "location": location_str,
                            "country": "Sweden",
                            "description_raw": clean_desc or f"Offre Platsbanken Suède : {title} chez {employer}.",
                            "published_date_raw": pub_date,
                            "url": job_url,
                            "apply_url": apply_url or job_url,
                        })

                        if len(results) >= limit:
                            break

                except Exception as e:
                    print(f"[JobTechSwedenConnector] Erreur requête '{term}': {e}")
                    continue

                await self.apply_jitter(min_seconds=0.15, max_seconds=0.3)

        return results

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
