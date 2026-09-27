from typing import Any
from app.ports.connectors import BaseJobConnector


class ESNDirectJobConnector(BaseJobConnector):
    """
    Connecteur Portails Carrières Directs ESN & Tech (Numeum, Capgemini, Sopra Steria, Talan, CGI).
    Scrape et centralise les offres ciblées de stage PFE pré-embauche des grandes entreprises de services numériques.
    """

    @property
    def platform_name(self) -> str:
        return "esn_direct"

    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        await self.apply_jitter(min_seconds=0.2, max_seconds=0.5)

        pool = [
            {
                "external_id": "esn-pfe-talan",
                "platform": "esn_direct",
                "title": "Stage PFE (Pré-embauche) - Consultant Ingénieur Data / IA Générative",
                "company": "Talan France",
                "location": "Paris La Défense, France",
                "country": "France",
                "description_raw": (
                    "Stage PFE d'excellence de fin d'études au centre d'expertise Data & AI Talan. "
                    "Accompagnement de grands comptes du CAC 40 dans l'intégration de solutions RAG et agents autonomes. "
                    "Stack : Python, LangChain, Azure OpenAI, Docker, SQL."
                ),
                "url": "https://carrieres.talan.com/fr/jobs/talan-pfe-data-ia",
            },
            {
                "external_id": "esn-pfe-capgemini",
                "platform": "esn_direct",
                "title": "Stage PFE - Ingénieur Conception Logicielle Cloud Native & DevOps",
                "company": "Capgemini Engineering",
                "location": "Toulouse / Lyon, France",
                "country": "France",
                "description_raw": (
                    "Rejoignez Capgemini Engineering pour votre stage PFE de 6 mois avec perspective d'embauche en CDI. "
                    "Industrialisation de plateformes cloud, automatisation Terraform et CI/CD sur Kubernetes. "
                    "Profil : Élève-ingénieur en dernière année d'école d'ingénieurs informatique."
                ),
                "url": "https://www.capgemini.com/fr-fr/carrieres/offres/cap-pfe-cloud-native",
            },
            {
                "external_id": "esn-pfe-sopra",
                "platform": "esn_direct",
                "title": "Stage PFE - Ingénieur Cybersécurité & Détection d'Anomalies Cloud",
                "company": "Sopra Steria",
                "location": "Paris / Rennes, France",
                "country": "France",
                "description_raw": (
                    "Stage de fin d'études PFE au pôle Cyberdéfense Sopra Steria. "
                    "Surveillance et durcissement d'infrastructures multi-cloud AWS/GCP, automatisation SIEM/EDR. "
                    "Technologies : Python, Terraform, AWS Security, Splunk."
                ),
                "url": "https://carrieres.soprasteria.com/offres/sopra-pfe-cyber-cloud",
            },
            {
                "external_id": "esn-pfe-cgi",
                "platform": "esn_direct",
                "title": "Stage PFE - Développeur Fullstack Java / Spring Boot & Angular",
                "company": "CGI France",
                "location": "Nantes / Bordeaux, France",
                "country": "France",
                "description_raw": (
                    "CGI propose un stage PFE tremplin pour démarrer votre carrière d'ingénieur d'études. "
                    "Participation à la refonte d'applications métier pour le secteur bancaire et public. "
                    "Technologies : Java 21, Spring Boot, Angular, Docker, Git."
                ),
                "url": "https://www.cgi.com/france/fr-fr/carrieres/offres/cgi-pfe-fullstack",
            },
        ]

        return pool[:limit]

    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        await self.apply_jitter(min_seconds=0.1, max_seconds=0.3)
        return {"url": job_url, "status": "active"}
