import abc
import asyncio
import random
from typing import Any


class BaseJobConnector(abc.ABC):
    """
    Port abstrait (AD-5 Strategy Pattern) pour les connecteurs d'offres de stage.
    Toutes les plateformes (LinkedIn, Jobteaser) implémentent ce contrat.
    """

    @property
    @abc.abstractmethod
    def platform_name(self) -> str:
        """Nom identifiant de la plateforme (ex: 'linkedin', 'jobteaser')."""
        pass

    @abc.abstractmethod
    async def search_jobs(
        self,
        keywords: list[str],
        locations: list[str],
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        """
        Recherche des offres selon les mots-clés et localisations configurés.
        Retourne une liste de dictionnaires bruts d'offres.
        """
        pass

    @abc.abstractmethod
    async def fetch_job_details(self, job_url: str) -> dict[str, Any]:
        """Extrait les détails et la description exhaustive d'une offre."""
        pass

    async def apply_jitter(self, min_seconds: float = 0.5, max_seconds: float = 1.8) -> None:
        """
        Applique une temporisation aléatoire (jitter) pour imiter la navigation humaine
        et préserver les sessions des détections anti-bot.
        """
        delay = random.uniform(min_seconds, max_seconds)
        await asyncio.sleep(delay)
