import re
from typing import Optional
from app.domain.models import JobOffer


INTERVIEW_PATTERNS = [
    r"\b(entretien|convocation|invitation|visio|rencontrer|disponibilit[eé]s?|cr[eé]neaux?)\b",
    r"\b(teams\.microsoft\.com|meet\.google\.com|calendly\.com|zoom\.us)\b",
    r"\b(stage de fin d['’]études|pfe).*(entretien|discuter|rencontre|échange)\b",
    r"\b(interview|technical test|phone screen|interview invitation|schedule a call)\b",
]

REJECTION_PATTERNS = [
    r"\b(ne (?:pas|pouvons|pourrons|donnerons pas) (?:donner suite|r[eé]pondre favorablement))\b",
    r"\b(ne pas donner suite|pas retenu|pas [eé]t[eé] retenu|non retenue?)\b",
    r"\b(regrettons de vous informer|malgr[eé] la qualit[eé]|malgr[eé] l['’]int[eé]r[eê]t de votre profil)\b",
    r"\b(poursuivre avec d['’]autres candidats|autre profil|orient[eé] notre choix)\b",
    r"\b(suite favorablement?|r[eé]ponse n[eé]gative)\b",
    r"\b(unfortunately|not selected|pursuing other candidates|wish you the best in your search)\b",
]

ACKNOWLEDGEMENT_PATTERNS = [
    r"\b(bien re[cç]u|accusons r[eé]ception|candidature bien re[cç]ue|candidature a bien [eé]t[eé] transmise)\b",
    r"\b(transmis(e)? aux [eé]quipes?|en cours d['’]examen|dossier en cours d['’][eé]tude)\b",
    r"\b(thank you for your application|application received|we have received your application)\b",
]


class EmailClassifier:
    """
    Classifieur déterministe de retours recruteurs pour la recherche de stage PFE.
    Analyse l'intention (Entretien, Refus, Accusé de réception) et réconcilie avec le job offer.
    """

    @classmethod
    def classify(cls, subject: str, body: str) -> tuple[str, str]:
        """
        Analyse le sujet et le corps d'un email pour déterminer sa catégorie et extraire un snippet.
        Retourne (category, snippet).
        """
        full_text = f"{subject}\n{body}".strip()
        lower_text = full_text.lower()

        # 1. Détection Entretien
        for pat in INTERVIEW_PATTERNS:
            if re.search(pat, lower_text, re.IGNORECASE):
                snippet = cls._extract_snippet(full_text, pat)
                return "INTERVIEW", snippet

        # 2. Détection Refus
        for pat in REJECTION_PATTERNS:
            if re.search(pat, lower_text, re.IGNORECASE):
                snippet = cls._extract_snippet(full_text, pat)
                return "REJECTION", snippet

        # 3. Détection Accusé de réception
        for pat in ACKNOWLEDGEMENT_PATTERNS:
            if re.search(pat, lower_text, re.IGNORECASE):
                snippet = cls._extract_snippet(full_text, pat)
                return "ACKNOWLEDGEMENT", snippet

        # 4. Autre
        snippet = full_text[:160] + "..." if len(full_text) > 160 else full_text
        return "OTHER", snippet

    @classmethod
    def match_job(
        cls,
        subject: str,
        body: str,
        sender: str,
        jobs: list[JobOffer],
        company_hint: Optional[str] = None,
    ) -> Optional[JobOffer]:
        """
        Rapproche un email entrant avec une offre existante en base.
        """
        if not jobs:
            return None

        # Priorité au hint explicite si fourni
        if company_hint:
            hint_lower = company_hint.strip().lower()
            for job in jobs:
                if hint_lower in job.company.lower() or job.company.lower() in hint_lower:
                    return job

        # Rapprochement par expéditeur (domaine) ou présence dans le texte
        sender_lower = sender.lower()
        text_lower = f"{subject} {body}".lower()
        candidates: list[JobOffer] = []

        for job in jobs:
            comp_lower = job.company.lower()
            # 1. Match direct du nom complet
            if comp_lower in text_lower or comp_lower in sender_lower:
                candidates.append(job)
                continue

            # 2. Match par mots significatifs de l'entreprise (ex: "Airbus" dans "Airbus Defence")
            tokens = [t for t in re.split(r"[\s\-_/]+", comp_lower) if len(t) >= 4]
            if any(t in sender_lower or t in text_lower for t in tokens):
                candidates.append(job)

        if len(candidates) == 1:
            return candidates[0]
        elif len(candidates) > 1:
            # Préférer les candidatures à l'état actif (SUBMITTED, INTERVIEW, READY)
            priority_statuses = {"SUBMITTED", "INTERVIEW", "READY"}
            for c in candidates:
                if c.status in priority_statuses:
                    return c
            return candidates[0]

        return None

    @classmethod
    def _extract_snippet(cls, text: str, pattern: str) -> str:
        """Extrait la phrase contenant le motif ou les premiers 180 caractères."""
        sentences = re.split(r"[.\n!?]", text)
        for s in sentences:
            cleaned = s.strip()
            if cleaned and re.search(pattern, cleaned, re.IGNORECASE):
                return cleaned[:180] + ("..." if len(cleaned) > 180 else "")

        return text[:160] + ("..." if len(text) > 160 else "")
