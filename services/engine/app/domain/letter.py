import logging
import re
from typing import List, Optional, Tuple

from app.config import settings
from app.domain.models import ATSMatchResult, CoverLetter, JobOffer, MasterProfile

logger = logging.getLogger(__name__)

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
    (r"\brelever ce challenge\b", "mener ce projet à bien"),
    (r"\bamour pour\b", "intérêt marqué pour"),
    (r"\bparfaite ad[eé]quation\b", "adéquation concrète"),
    (r"\bforce de proposition\b", "analytique et méthodique"),
    (r"\bsoif d'apprendre\b", "volonté d'approfondissement technique"),
    (r"\bcouteau suisse\b", "ingénieur polyvalent"),
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
    lang: str = "fr",
) -> str:
    """
    Construit le paragraphe de réalisations (« MOI ») en citant TOUS les projets et expériences
    dont le score de pertinence est > 0, de façon fluide et convaincante.
    Si aucun élément n'est pertinent (tous à 0), replie vers le meilleur disponible.
    Supporte le français et l'anglais.
    """
    is_en = lang == "en"
    relevant_projects = [(s, p) for s, p in ranked_projects if s > 0]
    relevant_experiences = [(s, e) for s, e in ranked_experiences if s > 0]

    if not relevant_projects and not relevant_experiences:
        if ranked_projects:
            _, p = ranked_projects[0]
            p_title = (p.title_en if is_en else p.title_fr) or p.title
            p_role = (p.role_en if is_en else p.role_fr) or p.role or ("Engineer" if is_en else "développeur")
            desc = ((p.description_en if is_en else p.description_fr) or p.description or "").strip().rstrip(".")
            proj_techs = ", ".join(p.technologies[:4]) if p.technologies else target_skills_str
            if is_en:
                return f'Throughout my engineering projects, I built "{p_title}" as a {p_role}: {desc}. This project heavily leverages {proj_techs}.'
            return (
                f"Au cours de mes projets d'ingénierie, j'ai développé "
                f"« {p_title} » en tant que {p_role} : {desc}. "
                f"Cette réalisation mobilise notamment {proj_techs}."
            )
        if ranked_experiences:
            _, e = ranked_experiences[0]
            e_role = (e.role_en if is_en else e.role_fr) or e.role
            desc = ((e.description_en if is_en else e.description_fr) or e.description or "").strip().rstrip(".")
            exp_techs = ", ".join(e.technologies[:4]) if e.technologies else target_skills_str
            if is_en:
                return f"During my time at {e.company} as {e_role}, I contributed to {desc}, working with {exp_techs}."
            return (
                f"Lors de mon expérience chez {e.company} en tant que {e_role}, "
                f"j'ai contribué à {desc}, en mobilisant {exp_techs}."
            )
        if is_en:
            return f"My engineering education gave me a strong foundation in software architecture and hands-on practice with {target_skills_str}."
        return (
            f"Ma formation d'ingénieur m'a permis d'acquérir une rigueur solide en "
            f"conception d'architectures logicielles, avec une pratique approfondie "
            f"de {target_skills_str}."
        )

    parts: List[str] = []
    has_first = False

    for i, (score, p) in enumerate(relevant_projects):
        p_title = (p.title_en if is_en else p.title_fr) or p.title
        p_role = (p.role_en if is_en else p.role_fr) or p.role or ("Engineer" if is_en else "développeur")
        desc = ((p.description_en if is_en else p.description_fr) or p.description or "").strip().rstrip(".")
        proj_techs = ", ".join(p.technologies[:5]) if p.technologies else target_skills_str

        if not has_first:
            if is_en:
                parts.append(
                    f'Among my projects directly relevant to this role, I developed "{p_title}" as {p_role}: {desc}. '
                    f"This experience provided concrete hands-on implementation of {proj_techs}, upholding best engineering practices."
                )
            else:
                parts.append(
                    f"Parmi mes réalisations directement liées à ce poste, j'ai développé "
                    f"« {p_title} » en tant que {p_role} : {desc}. "
                    f"Ce projet m'a permis de mettre en œuvre de façon opérationnelle "
                    f"{proj_techs}, dans le respect des bonnes pratiques de conception logicielle."
                )
            has_first = True
        else:
            if is_en:
                parts.append(
                    f'I also engineered "{p_title}" ({p_role}), focusing on {desc}, using {proj_techs}.'
                )
            else:
                parts.append(
                    f"J'ai également conduit « {p_title} » ({p_role}), "
                    f"portant sur {desc}, en utilisant {proj_techs}."
                )

    for i, (score, e) in enumerate(relevant_experiences):
        e_role = (e.role_en if is_en else e.role_fr) or e.role
        desc = ((e.description_en if is_en else e.description_fr) or e.description or "").strip().rstrip(".")
        exp_techs = ", ".join(e.technologies[:5]) if e.technologies else target_skills_str
        if is_en:
            connector = "Furthermore, during" if (has_first or i > 0) else "During"
            parts.append(
                f"{connector} my experience at {e.company} as {e_role}, I contributed to {desc}, utilizing {exp_techs}."
            )
        else:
            connector = "Par ailleurs, lors" if (has_first or i > 0) else "Lors"
            parts.append(
                f"{connector} de mon expérience chez {e.company} en tant que {e_role}, "
                f"j'ai contribué à {desc}, en mobilisant {exp_techs}."
            )
        has_first = True

    return " ".join(parts)


class CoverLetterService:
    """
    Moteur de synthèse de lettre de motivation sobre d'élève-ingénieur et jeune diplômé (AD-4 Étape 3).

    Architecture :
    - Standard professionnel Apec & Harvard en 4 actes : VOUS - MOI - NOUS - DEMAIN.
    - Adaptation dynamique selon le mode : PFE (stage de fin d'études) vs JOB (emploi CDI/CDD).
    - Zéro-hallucination : seules les données vérifiées du MasterProfile sont injectées.
    - Éradication des clichés IA par filtre déterministe.
    - Sélection intelligente multi-projets/expériences via scoring ATS.
    - Rédaction augmentée par LLM Groq avec bascule transparente vers synthèse déterministe.
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
    def _is_job_target(cls, job: JobOffer, profile: MasterProfile) -> bool:
        """ArcApply est dédié à 100% aux stages PFE (Projet de Fin d'Études)."""
        return False

    @classmethod
    def _build_vous_paragraph(
        cls,
        job: JobOffer,
        is_job_mode: bool,
        school_name: str,
        degree_name: str,
        target_skills_str: str,
        lang: str = "fr",
    ) -> str:
        """Acte 1 (VOUS) : L'entreprise cible, le poste et ses défis techniques."""
        is_en = lang == "en"
        company = job.company or ("your company" if is_en else "votre entreprise")
        job_title = job.title or ("Software Engineer" if is_en else "Ingénieur Logiciel")

        if is_en:
            if is_job_mode:
                return (
                    f"Graduated with a {degree_name} from {school_name}, I am pleased to submit my application "
                    f"for the position of {job_title} at {company}. Your engineering challenges and focus "
                    f"on {target_skills_str} particularly resonated with me, "
                    f"providing an ideal setting to implement rigorous engineering standards."
                )
            else:
                return (
                    f"Currently an engineering student at {school_name} specializing in {degree_name}, "
                    f"I am actively seeking my graduation internship (PFE) for a duration of 6 months. "
                    f"The opportunity to join {company} as {job_title} "
                    f"caught my immediate attention given your high technical expectations in {target_skills_str}."
                )
        else:
            if is_job_mode:
                return (
                    f"Diplômé en {degree_name} de {school_name}, je vous soumets ma candidature "
                    f"au poste de {job_title} chez {company}. Votre dynamique technique et vos enjeux "
                    f"en {target_skills_str} ont particulièrement retenu mon attention, "
                    f"constituant un cadre idéal pour mettre en œuvre une pratique rigoureuse de l'ingénierie."
                )
            else:
                return (
                    f"Actuellement {degree_name} à {school_name}, je recherche activement mon projet de fin d'études "
                    f"(PFE) d'une durée de 6 mois. L'opportunité d'intégrer {company} au poste de {job_title} "
                    f"a retenu toute mon attention en raison de ses exigences techniques en {target_skills_str}."
                )

    @classmethod
    def _build_nous_paragraph(
        cls,
        job: JobOffer,
        is_job_mode: bool,
        target_skills_str: str,
        lang: str = "fr",
    ) -> str:
        """Acte 3 (NOUS) : Synergie et valeur ajoutée immédiate apportée à l'équipe."""
        is_en = lang == "en"
        company = job.company or ("your team" if is_en else "vos équipes")
        if is_en:
            if is_job_mode:
                return (
                    f"Joining {company}, I will bring an immediate operational contribution to your developments "
                    f"in {target_skills_str}. My methodical mindset will allow me to seamlessly integrate into your delivery "
                    f"cycles with a constant focus on code quality and system resilience."
                )
            else:
                return (
                    f"By joining your team for this graduation internship, I intend to deliver concrete value "
                    f"across your developments in {target_skills_str}, applying thorough rigor to code quality "
                    f"and system architecture."
                )
        else:
            if is_job_mode:
                return (
                    f"En rejoignant {company}, j'apporterai une contribution opérationnelle concrète à vos développements "
                    f"en {target_skills_str}. Mon engagement méthodique me permettra de m'intégrer rapidement dans vos cycles "
                    f"de livraison, avec un souci constant de qualité de code et de robustesse des systèmes."
                )
            else:
                return (
                    f"En rejoignant vos équipes pour ce stage PFE, je souhaite apporter une contribution concrète "
                    f"sur vos développements en {target_skills_str}, en m'investissant avec méthode et rigueur "
                    f"sur la qualité du code et la robustesse des systèmes livrés."
                )

    @classmethod
    def _build_demain_paragraph(
        cls,
        is_job_mode: bool,
        lang: str = "fr",
    ) -> str:
        """Acte 4 (DEMAIN) : Disponibilité et invitation à l'entretien technique."""
        is_en = lang == "en"
        if is_en:
            return (
                "Available for a six-month duration, I would be delighted to discuss my achievements "
                "and engineering methodology with you during a technical interview."
            )
        else:
            if is_job_mode:
                return (
                    "Disponible immédiatement, je serais ravi d'échanger avec vous lors d'un entretien technique "
                    "afin de vous exposer plus en détail mes réalisations et ma méthodologie de travail."
                )
            else:
                return (
                    "Disponible dès le premier semestre 2026 pour une durée de six mois, je serais ravi d'échanger "
                    "avec vous lors d'un entretien technique afin de vous exposer plus en détail mes réalisations "
                    "et ma méthodologie de travail."
                )

    @classmethod
    def _build_deterministic_letter(
        cls,
        job: JobOffer,
        profile: MasterProfile,
        ats_match: ATSMatchResult,
        is_job_mode: bool,
        degree_name: str,
        school_name: str,
        target_skills_str: str,
        realizations_paragraph: str,
        lang: str = "fr",
    ) -> str:
        """Générateur déterministe conforme Apec Vous-Moi-Nous-Demain bilingue."""
        is_en = lang == "en"
        vous_part = cls._build_vous_paragraph(
            job=job,
            is_job_mode=is_job_mode,
            school_name=school_name,
            degree_name=degree_name,
            target_skills_str=target_skills_str,
            lang=lang,
        )
        nous_part = cls._build_nous_paragraph(
            job=job,
            is_job_mode=is_job_mode,
            target_skills_str=target_skills_str,
            lang=lang,
        )
        demain_part = cls._build_demain_paragraph(is_job_mode=is_job_mode, lang=lang)

        if is_en:
            return f"""Dear Hiring Team,

{vous_part}

{realizations_paragraph}

{nous_part}

{demain_part}

Sincerely,

{profile.full_name}"""

        return f"""Madame, Monsieur,

{vous_part}

{realizations_paragraph}

{nous_part}

{demain_part}

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

{profile.full_name}"""

    @classmethod
    def _generate_with_ai(
        cls,
        job: JobOffer,
        profile: MasterProfile,
        ats_match: ATSMatchResult,
        is_job_mode: bool,
        degree_name: str,
        school_name: str,
        target_skills_str: str,
        ranked_projects: List[tuple],
        ranked_experiences: List[tuple],
        lang: str = "fr",
    ) -> Optional[str]:
        """
        Rédige la lettre via le modèle Groq (Qwen/Llama) en appliquant
        strictement le schéma Vous-Moi-Nous et les gardes-fous Zéro-Hallucination.
        Support bilingue FR / EN.
        """
        api_key = settings.effective_groq_api_key
        if not api_key:
            return None

        is_en = lang == "en"

        try:
            from groq import Groq

            client = Groq(api_key=api_key)

            # Préparation des réalisations autorisées
            allowed_projects = []
            for s, p in ranked_projects:
                if s > 0:
                    p_title = (p.title_en if is_en else p.title_fr) or p.title
                    p_role = (p.role_en if is_en else p.role_fr) or p.role or ("Engineer" if is_en else "développeur")
                    p_desc = (p.description_en if is_en else p.description_fr) or p.description
                    allowed_projects.append(f"- Project « {p_title} » ({p_role}) : {p_desc} [Technologies: {p.technologies_raw}]")

            allowed_experiences = []
            for s, e in ranked_experiences:
                if s > 0:
                    e_role = (e.role_en if is_en else e.role_fr) or e.role
                    e_desc = (e.description_en if is_en else e.description_fr) or e.description
                    allowed_experiences.append(f"- Experience at {e.company} ({e_role}) : {e_desc} [Technologies: {e.technologies_raw}]")

            realizations_text = "\n".join(allowed_projects + allowed_experiences)
            if not realizations_text:
                if is_en:
                    realizations_text = f"Academic engineering coursework at {school_name} focusing on {degree_name} and {target_skills_str}."
                else:
                    realizations_text = f"Formation académique en {degree_name} à {school_name} avec pratique de {target_skills_str}."

            mode_label = "GRADUATION INTERNSHIP (PFE - 6 months)" if is_en else "STAGE PFE (Projet de Fin d'Études 6 mois)"
            mode_prohibitions = "The candidate is actively seeking their 6-month graduation internship (PFE)." if is_en else "Le candidat recherche activement son stage de fin d'études PFE d'une durée de 6 mois."

            missing_prohibitions = ""
            if ats_match.missing_skills:
                missing_str = ", ".join(ats_match.missing_skills)
                if is_en:
                    missing_prohibitions = f"STRICTLY FORBIDDEN to mention these missing skills that the candidate does not have: {missing_str}."
                else:
                    missing_prohibitions = f"STRICTEMENT INTERDIT de citer les compétences suivantes que le candidat ne possède pas : {missing_str}."

            if is_en:
                prompt = f"""Write a professional, sober, impactful, and factual engineering cover letter (YOU - ME - US - TOMORROW) in 4 distinct paragraphs in English.

CANDIDATE GROUND TRUTH (ZERO HALLUCINATION):
- Name: {profile.full_name}
- Education: {degree_name} at {school_name}
- Target Company: {job.company or 'your company'}
- Target Role: {job.title or 'Software Engineer'}
- Verified Skills to highlight: {target_skills_str}
- Verified achievements to cite:
{realizations_text}
- Application mode: {mode_label}

MANDATORY RULES:
1. 4 distinct paragraphs (YOU: company & technical challenges; ME: concrete achievements with exact technologies; US: mutual value & day-one contribution; TOMORROW: 6-month availability & technical interview).
2. Exact project titles in quotation marks « Project Title » as listed above.
3. {mode_prohibitions}
4. {missing_prohibitions}
5. NEVER invent companies, projects, or statistics.
6. Avoid buzzwords and AI clichés.
7. Start with « Dear Hiring Team, » and conclude strictly with « Sincerely,\n\n{profile.full_name} ».
8. Concision: ~250-300 words total. Do not truncate the closing."""
                system_prompt = "You are an elite engineer application writer. You write in sober, impactful, and factual English."
            else:
                prompt = f"""Rédige une lettre de motivation d'ingénieur sobre, percutante et factuelle selon la méthode Apec (VOUS - MOI - NOUS - DEMAIN) en 4 paragraphes.

DONNÉES DU CANDIDAT (SOURCE UNIQUE DE VÉRITÉ - ZÉRO HALLUCINATION) :
- Nom : {profile.full_name}
- Formation : {degree_name} à {school_name}
- Entreprise ciblée : {job.company or 'votre entreprise'}
- Poste ciblé : {job.title or 'Ingénieur Logiciel'}
- Compétences vérifiées à valoriser : {target_skills_str}
- Réalisations vérifiées à citer :
{realizations_text}
- Statut / Mode de candidature : {mode_label}

RÈGLES IMPÉRATIVES DE RÉDACTION :
1. Structure en 4 paragraphes distincts selon la méthode Apec :
   - Paragraphe 1 (VOUS) : L'entreprise ciblée et ses enjeux techniques sur le poste.
   - Paragraphe 2 (MOI) : Les réalisations concrètes fournies ci-dessus avec leurs technologies exactes.
   - Paragraphe 3 (NOUS) : La valeur ajoutée et la contribution opérationnelle immédiate apportée à l'équipe.
   - Paragraphe 4 (DEMAIN) : Disponibilité (6 mois pour ce stage PFE) et invitation sobre à un entretien technique.
2. Tu DOIS obligatoirement citer le titre exact de chaque projet mentionné entre guillemets « Titre du Projet » tel qu'indiqué dans les données (sans inverser ni modifier les mots).
3. {mode_prohibitions}
4. {missing_prohibitions}
5. Ne JAMAIS inventer de projets, de chiffres ou d'entreprises non listés.
6. Proscrire les superlatifs et clichés (« dynamique », « passionné depuis toujours », « opportunité rêvée »).
7. Débuter par « Madame, Monsieur, » et conclure obligatoirement par les salutations professionnelles usuelles suivies du nom complet du candidat : « {profile.full_name} ».
8. Concision et complétude impérative : La lettre doit faire environ 250 à 300 mots au total (3 à 4 phrases bien construites par paragraphe). Tu DOIS impérativement achever entièrement le texte sans jamais laisser de phrase inachevée."""
                system_prompt = "Tu es un rédacteur d'élite de candidatures d'ingénieurs. Tu rédiges en français sobre, percutant et factuel."

            response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
                model=settings.effective_groq_model,
                temperature=0.2,
                max_tokens=1000,
            )

            choice = response.choices[0]
            finish_reason = getattr(choice, "finish_reason", None)
            if finish_reason == "length":
                logger.warning("Rejet génération IA : la génération a été tronquée par la limite max_tokens. Repli déterministe.")
                return None

            generated_text = (choice.message.content or "").strip()
            if not generated_text:
                return None

            # Garde-fou 1 : Invariant Zéro-Hallucination sur les missing_skills
            lower_text = generated_text.lower()
            for missing in ats_match.missing_skills:
                if len(missing) > 2 and missing.lower() in lower_text:
                    logger.warning(f"Rejet génération IA : détection de missing_skill '{missing}'.")
                    return None

            # Garde-fou 2 : Intégrité et complétude structurelle
            paragraphs = [p.strip() for p in generated_text.split("\n\n") if p.strip()]
            if len(paragraphs) < 3:
                logger.warning(f"Rejet génération IA : structure incomplète ({len(paragraphs)} paragraphes). Repli déterministe.")
                return None

            return generated_text

        except Exception as err:
            logger.warning(f"Échec de l'appel LLM Groq ({err}), repli déterministe automatique.")
            return None

    @classmethod
    def generate_cover_letter(
        cls,
        job: JobOffer,
        profile: MasterProfile,
        ats_match: ATSMatchResult,
        use_ai: bool = True,
        language: str = "fr",
    ) -> CoverLetter:
        if not profile.is_complete:
            raise ValueError(
                "Le Master Profile doit être complet (CAP-1) pour générer une lettre de motivation."
            )

        lang = "en" if language.lower().strip() == "en" else "fr"
        is_job_mode = cls._is_job_target(job, profile)

        # 1. Formation de l'ingénieur
        if lang == "en":
            school_name = "engineering school"
            degree_name = "software engineering"
            if profile.educations:
                top_edu = profile.educations[0]
                if top_edu.school:
                    school_name = top_edu.school
                if top_edu.field_of_study_en:
                    degree_name = top_edu.field_of_study_en
                elif top_edu.field_of_study:
                    degree_name = top_edu.field_of_study
        else:
            school_name = "école d'ingénieurs"
            degree_name = "diplôme d'ingénieur" if is_job_mode else "élève-ingénieur"
            if profile.educations:
                top_edu = profile.educations[0]
                if top_edu.school:
                    school_name = top_edu.school
                if top_edu.field_of_study_fr:
                    prefix = "ingénieur en" if is_job_mode else "élève-ingénieur en"
                    degree_name = f"{prefix} {top_edu.field_of_study_fr}"
                elif top_edu.field_of_study:
                    prefix = "ingénieur en" if is_job_mode else "élève-ingénieur en"
                    degree_name = f"{prefix} {top_edu.field_of_study}"

        # 2. Compétences attestées (zéro-hallucination : on exclut les missing_skills)
        missing_set = {s.lower() for s in ats_match.missing_skills}
        safe_matched = [s for s in ats_match.matched_skills if s.lower() not in missing_set]
        default_skills = "software architecture" if lang == "en" else "l'architecture logicielle"
        target_skills_str = ", ".join(safe_matched[:5]) if safe_matched else default_skills

        # 3. Scoring et classement de TOUS les projets et expériences
        job_title = job.title or ("Software Engineer" if lang == "en" else "Ingénieur Logiciel")
        ranked_projects = _rank_projects(profile, ats_match, job_title)
        ranked_experiences = _rank_experiences(profile, ats_match, job_title)

        # 4. Construction du paragraphe de réalisations multi-éléments (MOI)
        realizations_paragraph = _build_realizations_paragraph(
            ranked_projects=ranked_projects,
            ranked_experiences=ranked_experiences,
            target_skills_str=target_skills_str,
            lang=lang,
        )

        company = job.company or ("your company" if lang == "en" else "votre entreprise")

        # 5. Tentative de génération via IA Groq (si demandée et configurée)
        raw_letter: Optional[str] = None
        if use_ai:
            raw_letter = cls._generate_with_ai(
                job=job,
                profile=profile,
                ats_match=ats_match,
                is_job_mode=is_job_mode,
                degree_name=degree_name,
                school_name=school_name,
                target_skills_str=target_skills_str,
                ranked_projects=ranked_projects,
                ranked_experiences=ranked_experiences,
                lang=lang,
            )

        # Repli déterministe garanti si IA non activée, indisponible ou rejetée par garde-fous
        if not raw_letter:
            raw_letter = cls._build_deterministic_letter(
                job=job,
                profile=profile,
                ats_match=ats_match,
                is_job_mode=is_job_mode,
                degree_name=degree_name,
                school_name=school_name,
                target_skills_str=target_skills_str,
                realizations_paragraph=realizations_paragraph,
                lang=lang,
            )

        # 6. Filtrage anti-clichés déterministe
        cleaned_content = cls.sanitize_cliches(raw_letter)
        cliche_count, detected_phrases = cls.audit_cliches(cleaned_content)

        letter = CoverLetter(
            job_id=job.id,
            profile_id=profile.id,
            target_role=job_title,
            company_name=company,
            content_markdown=cleaned_content,
            cliche_score=cliche_count,
            language=lang,
        )
        letter.banned_phrases_detected = detected_phrases

        return letter
