from __future__ import annotations

from typing import Literal

from app.adapters.connectors.linkedin import LinkedInJobConnector
from app.adapters.connectors.jobteaser import JobteaserJobConnector
from app.adapters.connectors.top100_enterprises import Top100EnterprisesJobConnector

__all__ = ["LinkedInJobConnector", "JobteaserJobConnector", "Top100EnterprisesJobConnector", "infer_offer_type"]

# ---------------------------------------------------------------------------
# Heuristique de classification automatique des offres (PFE vs JOB)
# ---------------------------------------------------------------------------
# Mots-clés PFE : indiquent un stage de fin d'études ou alternance.
_PFE_KEYWORDS: list[str] = [
    "pfe",
    "stage",
    "internship",
    "intern",
    "fin d'études",
    "fin d etudes",
    "fin d'etudes",
    "alternance",
    "apprentissage",
]

# Mots-clés JOB : indiquent un emploi à durée déterminée ou indéterminée.
_JOB_KEYWORDS: list[str] = [
    "cdi",
    "cdd",
    "emploi",
    "poste",
    "engineer",
    "developer",
    "développeur",
    "developpeur",
    "ingénieur confirmé",
    "senior",
    "junior",
    "recrutement",
    "full-time",
    "temps plein",
]


def infer_offer_type(title: str, description: str = "") -> Literal["PFE", "JOB"]:
    """Classifie automatiquement une offre en « PFE » ou « JOB » par scoring
    de mots-clés sur le titre et la description.

    Règle de décision :
    - score_pfe > score_job  → ``"PFE"``
    - score_job > score_pfe  → ``"JOB"``
    - égalité ou zéro        → ``"PFE"`` (valeur par défaut prudente)
    """
    combined = (title + " " + description).lower()

    score_pfe = sum(1 for kw in _PFE_KEYWORDS if kw in combined)
    score_job = sum(1 for kw in _JOB_KEYWORDS if kw in combined)

    return "JOB" if score_job > score_pfe else "PFE"

