import re
from typing import Any
import httpx
from bs4 import BeautifulSoup
from app.ports.connectors import BaseJobConnector


class AnetiJobConnector(BaseJobConnector):
    """
    Connecteur réel Emploi.nat.tn (ANETI - Agence Nationale pour l'Emploi et le Travail Indépendant).
    Effectue une recherche HTTP en direct sur le portail ANETI et extrait les fiches d'offres réelles.
    """

    @property
    def platform_name(self) -> str:
        return "aneti"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.3, max_seconds=0.6)

        # ANETI classifie les offres par métier (ex: ingénieur, informatique, télécom, technicien)
        query = "ingenieur"
        if keywords:
            # Si un mot-clé spécifique métier est fourni, le privilégier
            for kw in keywords:
                cleaned_kw = kw.lower().strip()
                if cleaned_kw in ("ingenieur", "ingénieur", "informatique", "telecom", "technicien", "electronique", "mecanique", "civil"):
                    query = cleaned_kw.replace("é", "e").replace("è", "e")
                    break
            else:
                # Sinon si le premier mot-clé n'est pas juste "stage" ou "pfe", l'utiliser
                first = keywords[0].lower().strip()
                if first not in ("stage", "pfe"):
                    query = first
        results: list[dict[str, Any]] = []

        search_url = "https://www.emploi.nat.tn/fo/Fr/global.php?&page=84"
        data = {
            "txt_recherche": query,
            "wm": "sub",
            "choix": "1",
            "Submit": "Chercher",
        }
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "fr-FR,fr;q=0.9",
        }

        try:
            async with httpx.AsyncClient(timeout=12.0, verify=False, follow_redirects=True) as client:
                resp = await client.post(search_url, data=data, headers=headers)
                if resp.status_code == 200 and resp.text:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    # Recherche des liens d'offres appelant show_detail('bureau', 'annee', 'numoffre')
                    offer_links = soup.find_all("a", onclick=lambda oc: oc and "show_detail" in oc)

                    seen_refs = set()
                    for link in offer_links:
                        oc = link.get("onclick", "")
                        match = re.search(r"show_detail\s*\(\s*'(\d+)'\s*,\s*'(\d+)'\s*,\s*'(\d+)'\s*\)", oc)
                        if not match:
                            continue

                        bureau, annee, numoffre = match.group(1), match.group(2), match.group(3)
                        ref_key = f"{bureau}-{annee}-{numoffre}"
                        if ref_key in seen_refs:
                            continue
                        seen_refs.add(ref_key)

                        detail_url = (
                            f"https://www.emploi.nat.tn/fo/Fr/dynamique/offrescad_fiche.php"
                            f"?bureau={bureau}&annee={annee}&numoffre={numoffre}"
                        )

                        # Trouver les métadonnées dans la ligne ou cellule parente
                        tr = link.find_parent("tr")
                        sector = ""
                        governorate = "Tunisie"
                        if tr:
                            tds = [td.text.strip() for td in tr.find_all("td") if td.text.strip()]
                            if len(tds) >= 2:
                                sector = tds[1]
                            if len(tds) >= 3:
                                governorate = f"{tds[2]}, Tunisie"

                        title = f"Offre ANETI Réf. {bureau}/{annee}/{numoffre}"
                        if sector:
                            title += f" - {sector}"

                        results.append({
                            "external_id": f"aneti-{ref_key}",
                            "platform": "aneti",
                            "title": title,
                            "company": "Entreprise Partenaire ANETI",
                            "location": governorate,
                            "country": "Tunisie",
                            "description_raw": (
                                f"Offre d'emploi/stage enregistrée auprès de l'ANETI. Référence : {bureau}/{annee}/{numoffre}. "
                                f"Secteur : {sector}. Consultez la fiche officielle sur {detail_url}"
                            ),
                            "url": detail_url,
                        })

                        if len(results) >= limit:
                            break
        except Exception as e:
            print(f"[AnetiConnector] Live scraping error: {e}")
            return []

        return results

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
