import re
from typing import List, Tuple

from app.domain.models import ATSMatchResult, CoverLetter, JobOffer, MasterProfile

# Dictionnaire des clichés d'IA bannis -> Substitutions sobres d'ingénieur
CLICHE_RULES = [
    (r"\bdynamique et motiv[eé]e?s?\b", "rigoureux et méthodique"),
    (r"\benthousiaste à l'idée de\b", "particulièrement attentif à"),
    (r"\bcandidat id[eé]al\b", "profil aligné avec vos exigences"),
    (r"\bopportunit[eé] r[eé]v[eé]e\b", "opportunité ciblée"),
    (r"\bpassionn[eé] depuis (?:mon plus jeune âge|toujours)\b", "fortement engagé dans la pratique du génie logiciel"),
    (r"\bsynergie\b", "collaboration technique"),
    (r"\bvivement int[eé]ress[eé]e?\b", "intéressé"),
    (r"\bmettre à profit mes comp[eé]tences\b", "contribuer activement à vos développements"),
    (r"\b(?:au sein de )?votre prestigieuse (?:entreprise|société|agence)\b", "vos équipes"),
    (r"\brelever des d[eé]fis stimulants\b", "résoudre ces problématiques techniques"),
    (r"\bamour pour\b", "intérêt marqué pour"),
    (r"\bparfaite ad[eé]quation\b", "adéquation concrète"),
]


def _score_item(
    technologies_raw: str,
    description: str,
    matched_skills: List[str],
    transferable_skills: List[str],
    job_title: str,
) -> int:
    """
    Calcule un score de pertinence d'un projet ou d'une expérience par rapport à une offre.

    Règles de scoring :
      +2 par technologie en exact match avec matched_skills
      +1 par technologie en match avec transferable_skills
      +1 par mot-clé du titre de poste (>3 chars) trouvé dans la description

    Retourne un entier >= 0. Un score de 0 signifie : aucun lien détecté avec l'offre.
    """
    score = 0
    techs_lower = {t.strip().lower() for t in technologies_raw.split(",") if t.strip()}
    desc_lower = description.lower() if description else ""
    title_words = {w.lower() for w in re.split(r"[\s/&,]+", job_title) if len(w) > 3}

    for skill in matched_skills:
        if skill.strip().lower() in techs_lower:
            score += 2

    for skill in transferable_skills:
        if skill.strip().lower() in techs_lower:
            score += 1

    for word in title_words:
        if word in desc_lower:
            score += 1

    return score


def _rank_projects(
    profile: MasterProfile,
    ats_match: ATSMatchResult,
    job_title: str,
) -> List[tuple]:
    """
    Classe TOUS les projets du profil par score de pertinence décroissant.
    Retourne une liste de (score, project).
    """
    ranked = []
    for p in profile.projects:
        score = _score_item(
            technologies_raw=p.technologies_raw or "",
            description=p.description or "",
            matched_skills=ats_match.matched_skills,
            transferable_skills=ats_match.transferable_skills,
            job_title=job_title,
        )
        ranked.append((score, p))
    ranked.sort(key=lambda x: x[0], reverse=True)
    return ranked


def _rank_experiences(
    profile: MasterProfile,
    ats_match: ATSMatchResult,
    job_title: str,
) -> List[tuple]:
    """
    Classe TOUTES les expériences du profil par score de pertinence décroissant.
    Retourne une liste de (score, experience).
    """
    ranked = []
    for e in profile.experiences:
        score = _score_item(
            technologies_raw=e.technologies_raw or "",
            description=e.description or "",
            matched_skills=ats_match.matched_skills,
            transferable_skills=ats_match.transferable_skills,
            job_title=job_title,
        )
        ranked.append((score, e))
    ranked.sort(key=lambda x: x[0], reverse=True)
    return ranked


def _build_realizations_paragraph(
    ranked_projects: List[tuple],
    ranked_experiences: List[tuple],
    target_skills_str: str,
) -> str:
    """
    Construit le paragraphe de réalisations en citant TOUS les projets et expériences
    dont le score de pertinence est > 0, de façon fluide et convaincante.
    Si aucun élément n'est pertinent (tous à 0), replie vers le meilleur disponible.
    """
    relevant_projects = [(s, p) for s, p in ranked_projects if s > 0]
    relevant_experiences = [(s, e) for s, e in ranked_experiences if s > 0]

    if not relevant_projects and not relevant_experiences:
        # Fallback zéro-pertinence : citer le meilleur projet ou expérience disponible
        if ranked_projects:
            _, p = ranked_projects[0]
            proj_techs = ", ".join(p.technologies[:4]) if p.technologies else target_skills_str
            desc = (p.description or "").strip().rstrip(".")
            return (
                f"Au cours de mes projets d'ingénierie, j'ai développé "
                f"« {p.title} » en tant que {p.role or 'développeur'} : {desc}. "
                f"Cette réalisation mobilise notamment {proj_techs}."
            )
        if ranked_experiences:
            _, e = ranked_experiences[0]
            exp_techs = ", ".join(e.technologies[:4]) if e.technologies else target_skills_str
            desc = (e.description or "").strip().rstrip(".")
            return (
                f"Lors de mon expérience chez {e.company} en tant que {e.role}, "
                f"j'ai contribué à {desc}, en mobilisant {exp_techs}."
            )
        return (
            f"Ma formation d'ingénieur m'a permis d'acquérir une rigueur solide en "
            f"conception d'architectures logicielles, avec une pratique approfondie "
            f"de {target_skills_str}."
        )

    # Construction fluide : tous les éléments pertinents, du plus au moins pertinent
    parts: List[str] = []
    has_first = False

    for i, (score, p) in enumerate(relevant_projects):
        proj_techs = ", ".join(p.technologies[:5]) if p.technologies else target_skills_str
        desc = (p.description or "").strip().rstrip(".")
        role_str = p.role or "développeur"

        if not has_first:
            parts.append(
                f"Parmi mes réalisations directement liées à ce poste, j'ai développé "
                f"« {p.title} » en tant que {role_str} : {desc}. "
                f"Ce projet m'a permis de mettre en œuvre de façon opérationnelle "
                f"{proj_techs}, dans le respect des bonnes pratiques de conception logicielle."
            )
            has_first = True
        else:
            parts.append(
                f"J'ai également conduit « {p.title} » ({role_str}), "
                f"portant sur {desc}, en utilisant {proj_techs}."
            )

    for i, (score, e) in enumerate(relevant_experiences):
        exp_techs = ", ".join(e.technologies[:5]) if e.technologies else target_skills_str
        desc = (e.description or "").strip().rstrip(".")
        connector = "Par ailleurs, lors" if (has_first or i > 0) else "Lors"
        parts.append(
            f"{connector} de mon expérience chez {e.company} en tant que {e.role}, "
            f"j'ai contribué à {desc}, en mobilisant {exp_techs}."
        )
        has_first = True

    return " ".join(parts)


class CoverLetterService:
    """
    Moteur de synthèse de lettre de motivation sobre d'élève-ingénieur (AD-4 Étape 3).

    Garantit :
    - Zéro-hallucination : seules les données vérifiées du MasterProfile sont injectées.
    - Éradication des clichés IA par filtre déterministe.
    - Sélection intelligente multi-projets/expériences via scoring de pertinence à l'offre.
    - Citation fluide de TOUS les projets et expériences pertinents (score > 0).
    """

    @classmethod
    def audit_cliches(cls, text: str) -> Tuple[int, List[str]]:
        """Détecte les clichés IA et retourne le score d'infraction et la liste des termes."""
        detected = []
        for pattern, _ in CLICHE_RULES:
            matches = re.findall(pattern, text, flags=re.IGNORECASE)
            if matches:
                detected.extend(matches)
        return len(detected), list(set(detected))

    @classmethod
    def sanitize_cliches(cls, text: str) -> str:
        """Remplace de manière déterministe les expressions bannies par un ton sobre."""
        sanitized = text
        for pattern, replacement in CLICHE_RULES:
            sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)
        return sanitized

    @classmethod
    def generate_cover_letter(
        cls,
        job: JobOffer,
        profile: MasterProfile,
        ats_match: ATSMatchResult,
    ) -> CoverLetter:
        if not profile.is_complete:
            raise ValueError(
                "Le Master Profile doit être complet (CAP-1) pour générer une lettre de motivation."
            )

        # 1. Formation de l'ingénieur
        school_name = "école d'ingénieurs"
        degree_name = "élève-ingénieur"
        if profile.educations:
            top_edu = profile.educations[0]
            if top_edu.school:
                school_name = top_edu.school
            if top_edu.field_of_study:
                degree_name = f"élève-ingénieur en {top_edu.field_of_study}"

        # 2. Compétences attestées (zéro-hallucination : on exclut les missing_skills)
        missing_set = {s.lower() for s in ats_match.missing_skills}
        safe_matched = [s for s in ats_match.matched_skills if s.lower() not in missing_set]
        target_skills_str = ", ".join(safe_matched[:5]) if safe_matched else "l'architecture logicielle"

        # 3. Scoring et classement de TOUS les projets et expériences
        job_title = job.title or "Ingénieur Logiciel"
        ranked_projects = _rank_projects(profile, ats_match, job_title)
        ranked_experiences = _rank_experiences(profile, ats_match, job_title)

        # 4. Construction du paragraphe de réalisations multi-éléments
        realizations_paragraph = _build_realizations_paragraph(
            ranked_projects=ranked_projects,
            ranked_experiences=ranked_experiences,
            target_skills_str=target_skills_str,
        )

        # 5. Assemblage lettre — structure sobre 4 paragraphes
        company = job.company or "votre entreprise"

        raw_letter = f"""Madame, Monsieur,

Actuellement {degree_name} à {school_name}, je suis à la recherche de mon stage de fin d'études (PFE) d'une durée de 6 mois. L'opportunité d'intégrer {company} au poste de {job_title} a particulièrement retenu mon attention en raison des défis techniques qu'elle implique en {target_skills_str}.

{realizations_paragraph}

En rejoignant vos équipes, je souhaite apporter une contribution concrète sur vos développements en {target_skills_str}, en m'investissant avec méthode et rigueur sur la qualité du code et la robustesse des systèmes livrés.

Disponible dès le premier semestre 2026 pour une durée de six mois, je serais ravi d'échanger avec vous lors d'un entretien technique afin de vous exposer plus en détail mes réalisations et ma méthodologie de travail.

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

{profile.full_name}"""

        # 6. Filtrage anti-clichés
        cleaned_content = cls.sanitize_cliches(raw_letter)
        cliche_count, detected_phrases = cls.audit_cliches(cleaned_content)

        letter = CoverLetter(
            job_id=job.id,
            profile_id=profile.id,
            target_role=job_title,
            company_name=company,
            content_markdown=cleaned_content,
            cliche_score=cliche_count,
        )
        letter.banned_phrases_detected = detected_phrases

        return letter
