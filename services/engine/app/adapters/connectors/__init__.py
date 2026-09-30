from __future__ import annotations

from typing import Literal

from app.adapters.connectors.linkedin import LinkedInJobConnector
from app.adapters.connectors.jobteaser import JobteaserJobConnector
from app.adapters.connectors.top100_enterprises import Top100EnterprisesJobConnector
from app.domain.pfe_validator import is_pfe_offer

__all__ = [
    "LinkedInJobConnector",
    "JobteaserJobConnector",
    "Top100EnterprisesJobConnector",
    "infer_offer_type",
    "is_pfe_offer",
]


def infer_offer_type(title: str, description: str = "") -> str:
    """Classifie une offre : retourne 'PFE' si l'offre respecte les critères de stage PFE, sinon 'REJECTED'."""
    return "PFE" if is_pfe_offer(title, description) else "REJECTED"
