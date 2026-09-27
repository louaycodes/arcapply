from typing import Any
from app.ports.connectors import BaseJobConnector


class AnetiJobConnector(BaseJobConnector):
    """
    Connecteur Emploi.nat.tn (ANETI - Agence Nationale pour l'Emploi et le Travail Indépendant).
    Portail officiel de l'emploi en Tunisie recensant les conventions de stages de fin d'études PFE.
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
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.4)

        pool = [
            {
                "external_id": "aneti-pfe-telecom",
                "platform": "aneti",
                "title": "Stage PFE - Ingénieur Télécoms & Réseaux Fibre Optique / 5G",
                "company": "Tunisie Télécom (Direction Technique)",
                "location": "Tunis, Tunisie",
                "country": "Tunisie",
                "description_raw": (
                    "Stage PFE conventionné ANETI au sein de la direction technique des réseaux fixes et mobiles. "
                    "Sujet : Étude d'ingénierie et déploiement des coeurs de réseau 5G et transmission FTTH. "
                    "Profil : Élève-ingénieur télécoms/réseaux (ESPRIT, SUP'COM, ENIT)."
                ),
                "url": "http://www.emploi.nat.tn/fo/Fr/global.php?menu1=187&ref=tt-pfe-5g",
            },
            {
                "external_id": "aneti-pfe-cpg",
                "platform": "aneti",
                "title": "Stage PFE - Ingénieur Informatique Industrielle & Systèmes SCADA",
                "company": "Groupe Chimique / CPG",
                "location": "Sfax / Gafsa, Tunisie",
                "country": "Tunisie",
                "description_raw": (
                    "Stage PFE sous convention ANETI. Automatisation et supervision de processus industriels complexes. "
                    "Technologies : Automates Siemens, TIA Portal, Python, protocoles Modbus/OPC-UA."
                ),
                "url": "http://www.emploi.nat.tn/fo/Fr/global.php?menu1=187&ref=cpg-pfe-scada",
            },
        ]

        return pool[:limit]

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
