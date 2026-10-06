from __future__ import annotations

import re

# ---------------------------------------------------------------------------
# Mots-clés obligatoires pour les offres de Stages PFE
# ---------------------------------------------------------------------------
# L'offre DOIT contenir au moins l'un de ces mots-clés (titre ou description)
PFE_KEYWORDS: list[str] = [
    r"\bpfe\b",
    r"\bstage\b",
    r"\bstages\b",
    r"\bstagiaire\b",
    r"\bstagiaires\b",
    r"\binternship\b",
    r"\binternships\b",
    r"\bintern\b",
    r"\binterns\b",
    r"\bfin\s*d['’\s]?études?\b",
    r"\bfin\s*d['’\s]?etudes?\b",
    r"\bend[- ]of[- ]studies\b",
    r"\bend[- ]of[- ]study\b",
    r"\balternance\b",
    r"\bapprentissage\b",
    r"\bapprenti\b",
    r"\bgraduate\b",
    r"\btrainee\b",
    r"\btraineeship\b",
]

# ---------------------------------------------------------------------------
# Motifs d'exclusion pour emplois / CDI / CDD / Freelance
# ---------------------------------------------------------------------------
# Si le titre indique clairement un contrat ou statut professionnel incompatible
# sans mentionner explicitement le mot stage/internship/pfe, l'offre est rejetée.
NON_PFE_TITLE_EXCLUSIONS: list[str] = [
    r"\b(cdi|cdd|freelance|ind[ée]pendant|portage\s*salarial|int[ée]rim)\b",
    r"\b(full[- ]time|temps\s*plein|permanent\s*contract)\b",
    r"\b(senior\s*(?:engineer|developer|d[ée]veloppeur|consultant)|lead\s*(?:tech|engineer|developer))\b",
]

PFE_REGEX = re.compile("|".join(PFE_KEYWORDS), re.IGNORECASE)
NON_PFE_TITLE_REGEX = re.compile("|".join(NON_PFE_TITLE_EXCLUSIONS), re.IGNORECASE)


def is_pfe_offer(title: str, description: str = "") -> bool:
    """
    Vérifie si une offre répond strictement aux critères d'un stage de fin d'études (PFE).

    Règles de décision :
    1. Si aucun mot-clé de stage/PFE/internship n'est présent dans le titre ou la description -> False.
    2. Si le titre contient un motif d'exclusion (CDI, CDD, Freelance, Senior, Full-time)
       SANS contenir aucun mot-clé de stage -> False.
    3. Sinon -> True.
    """
    if not title:
        return False

    title_clean = title.strip()
    desc_clean = (description or "").strip()
    combined_text = f"{title_clean} {desc_clean}"

    # 1. Vérification de la présence d'au moins un mot-clé de stage
    if not PFE_REGEX.search(combined_text):
        return False

    # 2. Vérification des exclusions de type d'emploi dans le titre
    title_has_stage = bool(PFE_REGEX.search(title_clean))
    title_has_exclusion = bool(NON_PFE_TITLE_REGEX.search(title_clean))

    if title_has_exclusion and not title_has_stage:
        return False

    return True
