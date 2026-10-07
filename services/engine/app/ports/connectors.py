import abc
import asyncio
import random
import re
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

    @classmethod
    def generate_stable_id(cls, prefix: str, raw_key: str, length: int = 10) -> str:
        """
        Génère un identifiant déterministe et pérenne basé sur un hash MD5.
        Remplace le built-in hash() non déterministe entre redémarrages de processus Python.
        """
        import hashlib
        digest = hashlib.md5((raw_key or "").encode("utf-8")).hexdigest()[:length]
        return f"{prefix}-{digest}"

    @classmethod
    def expand_pfe_search_terms(
        cls,
        raw_terms: list[str],
    ) -> list[str]:
        """
        Développe les termes techniques purs (ex: 'DevOps', 'Cloud', 'Data')
        en requêtes de stage PFE exhaustives et ciblées.
        Préserve les termes contenant déjà des qualificatifs de stage.
        """
        stage_pattern = re.compile(
            r"\b(stage|stages|pfe|intern|interns|internship|internships|alternance|apprentissage|apprenti|apprentie|stagiaire|stagiaires|fin d['’\s]?etudes?|fin d['’\s]?études?)\b",
            re.IGNORECASE,
        )
        expanded: list[str] = []
        for term in raw_terms:
            t_clean = term.strip()
            if not t_clean:
                continue
            if stage_pattern.search(t_clean):
                if t_clean not in expanded:
                    expanded.append(t_clean)
            else:
                pfe_variants = [
                    f"Stage {t_clean}",
                    f"PFE {t_clean}",
                    f"Stage PFE {t_clean}",
                    f"Stage Ingénieur {t_clean}",
                    f"{t_clean} Intern",
                ]
                for v in pfe_variants:
                    if v not in expanded:
                        expanded.append(v)
        return expanded

    @classmethod
    def normalize_search_terms(
        cls,
        keywords: list[str] | None,
        default_fallback: list[str] | None = None,
        expand_pfe: bool = True,
    ) -> list[str]:
        """
        Normalise et développe les termes de recherche pour les connecteurs.
        Évite l'effet d'entonnoir destructeur du ' '.join(keywords) et convertit
        automatiquement les intitulés métiers (DevOps, Cloud...) en requêtes PFE ciblées.
        """
        if not keywords:
            return default_fallback or ["Stage PFE", "Stage Ingénieur", "PFE"]

        raw_terms: list[str] = []
        for item in keywords:
            if not item:
                continue
            parts = [p.strip() for p in item.split(",") if p.strip()]
            for p in parts:
                if p not in raw_terms:
                    raw_terms.append(p)

        if not raw_terms:
            return default_fallback or ["Stage PFE", "Stage Ingénieur", "PFE"]

        if expand_pfe:
            return cls.expand_pfe_search_terms(raw_terms)
        return raw_terms
