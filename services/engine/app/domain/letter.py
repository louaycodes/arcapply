import re
from typing import Tuple, List
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


class CoverLetterService:
    """
    Moteur de synthèse de lettre de motivation sobre d'élève-ingénieur (AD-4 Étape 3).
    Garantit l'éradication des clichés IA et le respect strict du Master Profile.
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

        # 1. Identification de la formation de l'ingénieur
        school_name = "école d'ingénieurs"
        degree_name = "élève-ingénieur"
        if profile.educations:
            top_edu = profile.educations[0]
            if top_edu.school:
                school_name = top_edu.school
            if top_edu.field_of_study:
                degree_name = f"élève-ingénieur en {top_edu.field_of_study}"

        # 2. Sélection factuelle du projet ou de l'expérience la plus pertinente
        missing_set = {s.lower() for s in ats_match.missing_skills}
        safe_matched = [s for s in ats_match.matched_skills if s.lower() not in missing_set]

        target_skills_str = ", ".join(safe_matched[:3]) if safe_matched else "l'architecture logicielle"

        # Recherche d'un projet pertinent
        featured_project = None
        for p in profile.projects:
            if any(s.lower() in [t.lower() for t in p.technologies] for s in safe_matched):
                featured_project = p
                break
        if not featured_project and profile.projects:
            featured_project = profile.projects[0]

        project_paragraph = ""
        if featured_project:
            proj_techs = ", ".join(featured_project.technologies[:4]) if featured_project.technologies else target_skills_str
            project_paragraph = (
                f"Au cours de mes projets d'ingénierie, j'ai notamment développé le projet « {featured_project.title} » "
                f"en tant que {featured_project.role or 'développeur'}, axé sur {featured_project.description.strip()} "
                f"Cette réalisation m'a permis de mettre en œuvre de façon opérationnelle des technologies telles que {proj_techs} "
                f"dans le respect des bonnes pratiques de conception logicielle et de maintenabilité."
            )
        elif profile.experiences:
            exp = profile.experiences[0]
            exp_techs = ", ".join(exp.technologies[:4]) if exp.technologies else target_skills_str
            project_paragraph = (
                f"Lors de mon expérience chez {exp.company} en tant que {exp.role}, j'ai contribué à "
                f"{exp.description.strip()} en mobilisant principalement {exp_techs}."
            )
        else:
            project_paragraph = (
                f"Ma formation d'ingénieur m'a permis d'acquérir une rigueur solide en conception d'architectures logicielles, "
                f"avec une pratique approfondie des technologies {target_skills_str}."
            )

        # 3. Assemblage de la lettre au ton sobre d'ingénieur
        company = job.company or "votre entreprise"
        role_title = job.title or "Ingénieur Logiciel"

        raw_letter = f"""Madame, Monsieur,

Actuellement {degree_name} à {school_name}, je suis à la recherche de mon stage de fin d'études (PFE) d'une durée de 6 mois. L'opportunité d'intégrer {company} au poste de {role_title} a particulièrement retenu mon attention en raison des enjeux techniques de vos projets.

{project_paragraph}

En rejoignant vos équipes, je souhaite apporter une contribution concrète sur vos développements en {target_skills_str}, en m'investissant avec méthode et rigueur sur la qualité du code et la robustesse des systèmes livrés.

Disponible dès le premier semestre 2026 pour une durée de six mois, je serais ravi d'échanger avec vous lors d'un entretien technique afin de vous exposer plus en détail mes réalisations et ma méthodologie de travail.

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

{profile.full_name}"""

        # 4. Filtrage et assainissement anti-clichés
        cleaned_content = cls.sanitize_cliches(raw_letter)
        cliche_count, detected_phrases = cls.audit_cliches(cleaned_content)

        letter = CoverLetter(
            job_id=job.id,
            profile_id=profile.id,
            target_role=role_title,
            company_name=company,
            content_markdown=cleaned_content,
            cliche_score=cliche_count,
        )
        letter.banned_phrases_detected = detected_phrases

        return letter
