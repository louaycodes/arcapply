"""
Agent 2 — Redacteur de CV sur-mesure (cv_agent.py)

Agent LLM Groq qui redige chaque section du CV orientee vers le poste cible.
Contrairement au copier-coller du profil, cet agent reformule :
- Le summary/accroche pour le poste specifique
- Chaque description de projet pour mettre en avant les aspects pertinents
- Chaque description d'experience pour correspondre aux besoins de l'offre

Base sur le profil complet + le dossier Deep Recon + l'analyse ATS.
"""
import logging
import re
from typing import Any, Dict, List, Optional, Tuple, TypedDict

from langgraph.graph import END, START, StateGraph
from sqlmodel import Session, select

from app.adapters.database import get_engine
from app.config import settings
from app.domain.models import (
    ATSMatchResult,
    JobOffer,
    MasterProfile,
    ReconDossier,
)

logger = logging.getLogger(__name__)


class CVWriterState(TypedDict):
    job_id: str
    user_id: str
    language: str
    job_obj: Optional[Any]
    profile_obj: Optional[Any]
    job_offer: Optional[Dict[str, Any]]
    recon_dossier: Optional[Dict[str, Any]]
    master_profile: Optional[Dict[str, Any]]
    selected_experiences: Optional[List[Dict[str, Any]]]
    selected_projects: Optional[List[Dict[str, Any]]]
    ats_match: Optional[Dict[str, Any]]
    rewritten_headline: Optional[str]
    rewritten_summary: Optional[str]
    rewritten_experiences: Optional[List[Dict[str, str]]]
    rewritten_projects: Optional[List[Dict[str, str]]]
    engine: Optional[Any]
    errors: List[str]


class CVRewriteResult:
    """Resultat de l'agent redacteur de CV."""
    def __init__(
        self,
        headline: str = "",
        summary: str = "",
        experiences: Optional[List[Dict[str, str]]] = None,
        projects: Optional[List[Dict[str, str]]] = None,
    ):
        self.headline = headline
        self.summary = summary
        self.experiences = experiences or []
        self.projects = projects or []


def _build_cv_context(
    profile: dict,
    recon: dict,
    job: dict,
    ats: dict,
    lang: str,
    experiences: Optional[List[Dict[str, Any]]] = None,
    projects: Optional[List[Dict[str, Any]]] = None,
) -> str:
    """Construit le contexte complet pour le prompt LLM de redaction CV."""
    is_en = lang == "en"
    lines = []

    # Offre cible
    lines.append(f"=== POSTE CIBLE ===")
    lines.append(f"Titre : {job.get('title', '')}")
    lines.append(f"Entreprise : {job.get('company', '')}")
    lines.append(f"Localisation : {job.get('location', '')}")

    # Recon
    full_desc = recon.get("full_description", "")
    if full_desc:
        lines.append(f"\nDescription de l'offre (extraits) :\n{full_desc[:3000]}")

    mission = recon.get("company_mission", "")
    if mission:
        lines.append(f"\nMission entreprise : {mission}")

    tech_stack = recon.get("tech_stack_detected", [])
    if tech_stack:
        lines.append(f"Stack detectee : {', '.join(tech_stack)}")

    # ATS
    matched = ats.get("matched_skills", [])
    missing = ats.get("missing_skills", [])
    if matched:
        lines.append(f"\nCompetences matchees ATS : {', '.join(matched)}")
    if missing:
        lines.append(f"Competences manquantes (NE PAS INVENTER) : {', '.join(missing)}")

    # Profil complet
    lines.append(f"\n=== PROFIL CANDIDAT ===")
    lines.append(f"Nom : {profile.get('full_name', '')}")

    bio = profile.get("bio_fr" if not is_en else "bio_en") or profile.get("bio", "")
    if bio:
        lines.append(f"Bio actuelle : {bio}")

    headline = profile.get("headline_fr" if not is_en else "headline_en") or profile.get("headline", "")
    if headline:
        lines.append(f"Titre actuel : {headline}")

    # Experiences selectionnees pour le CV
    exp_list = experiences if experiences is not None else profile.get("experiences", [])
    lines.append(f"\n--- Experiences ({len(exp_list)} selectionnees pour le CV) ---")
    for i, exp in enumerate(exp_list, 1):
        company = exp.get("company", "")
        role = exp.get("role_fr" if not is_en else "role_en") or exp.get("role", "")
        desc = exp.get("description_fr" if not is_en else "description_en") or exp.get("description", "")
        techs = exp.get("technologies", "")
        if isinstance(techs, list):
            techs = ", ".join(str(t) for t in techs if t)
        lines.append(f"  EXP_{i} : {role} chez {company}")
        lines.append(f"     Description originale : {desc}")
        lines.append(f"     Technologies : {techs}")

    # Projets selectionnes pour le CV
    proj_list = projects if projects is not None else profile.get("projects", [])
    lines.append(f"\n--- Projets ({len(proj_list)} selectionnes pour le CV) ---")
    for i, p in enumerate(proj_list, 1):
        title = p.get("title_fr" if not is_en else "title_en") or p.get("title", "")
        role = p.get("role_fr" if not is_en else "role_en") or p.get("role", "")
        desc = p.get("description_fr" if not is_en else "description_en") or p.get("description", "")
        techs = p.get("technologies", "")
        if isinstance(techs, list):
            techs = ", ".join(str(t) for t in techs if t)
        lines.append(f"  PROJ_{i} : « {title} » ({role})")
        lines.append(f"     Description originale : {desc}")
        lines.append(f"     Technologies : {techs}")

    return "\n".join(lines)


# ============================================================================
# LangGraph Nodes
# ============================================================================

def node_load_cv_context(state: CVWriterState) -> dict:
    """Noeud 1 : Charge le profil complet, le dossier Deep Recon et l'offre."""
    engine = state.get("engine") or get_engine()
    user_id = state.get("user_id", "louay")
    job_id = state.get("job_id")
    job_in = state.get("job_obj")
    profile_in = state.get("profile_obj")

    with Session(engine) as session:
        job = job_in
        if not job and job_id:
            job = session.exec(select(JobOffer).where(JobOffer.id == job_id)).first()

        job_dict = {
            "title": job.title or "" if job else "",
            "company": job.company or "" if job else "",
            "location": job.location if job else "",
            "description": job.description_raw if job else "",
            "offer_type": getattr(job, "offer_type", "PFE") if job else "PFE",
        } if job else {}

        dossier = None
        if job_id:
            dossier = session.exec(select(ReconDossier).where(ReconDossier.job_id == job_id)).first()
        recon_dict = {
            "full_description": dossier.full_description if dossier else "",
            "company_name": dossier.company_name if dossier else "",
            "company_mission": dossier.company_mission if dossier else "",
            "company_culture": dossier.company_culture if dossier else "",
            "tech_stack_detected": dossier.tech_stack_detected if dossier else [],
        } if dossier else {}

        profile = profile_in
        if not profile:
            profile = session.exec(
                select(MasterProfile).where(
                    (MasterProfile.user_id == user_id) | (MasterProfile.id == "default-profile")
                )
            ).first()

        profile_dict = {}
        if profile:
            profile_dict = {
                "full_name": profile.full_name,
                "email": profile.email,
                "headline": profile.headline,
                "headline_fr": profile.headline_fr,
                "headline_en": profile.headline_en,
                "bio": profile.bio,
                "bio_fr": getattr(profile, "bio_fr", None),
                "bio_en": getattr(profile, "bio_en", None),
                "search_mode": profile.search_mode,
                "educations": [
                    {
                        "school": e.school,
                        "degree": e.degree,
                        "degree_fr": e.degree_fr,
                        "degree_en": e.degree_en,
                        "field_of_study": e.field_of_study,
                        "field_of_study_fr": e.field_of_study_fr,
                        "field_of_study_en": e.field_of_study_en,
                        "description": e.description,
                    }
                    for e in (profile.educations or [])
                ],
                "experiences": [
                    {
                        "company": e.company,
                        "role": e.role,
                        "role_fr": e.role_fr,
                        "role_en": e.role_en,
                        "technologies": e.technologies_raw,
                        "description": e.description,
                        "description_fr": e.description_fr,
                        "description_en": e.description_en,
                    }
                    for e in (profile.experiences or [])
                ],
                "projects": [
                    {
                        "title": p.title,
                        "title_fr": p.title_fr,
                        "title_en": p.title_en,
                        "role": p.role,
                        "role_fr": p.role_fr,
                        "role_en": p.role_en,
                        "technologies": p.technologies_raw,
                        "description": p.description,
                        "description_fr": p.description_fr,
                        "description_en": p.description_en,
                    }
                    for p in (profile.projects or [])
                ],
                "skills": [{"name": s.name, "category": s.category} for s in (profile.skills or [])],
                "groq_api_key": getattr(profile, "groq_api_key", None),
                "groq_model": getattr(profile, "groq_model", None),
            }

    return {
        "job_offer": job_dict,
        "recon_dossier": recon_dict,
        "master_profile": profile_dict,
    }


def _call_groq_resilient(
    client,
    messages: list[dict],
    requested_model: str,
    target_max_tokens: int,
    temperature: float = 0.2,
) -> str:
    """Appelle Groq avec adaptation intelligente des quotas et repli multi-modèles pour le CV."""
    models_to_try = [requested_model]
    for fallback in ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]:
        if fallback not in models_to_try:
            models_to_try.append(fallback)

    last_error = None
    for model in models_to_try:
        is_qwen = "qwen" in model.lower()
        actual_tokens = min(target_max_tokens, 750) if is_qwen else target_max_tokens
        try:
            resp = client.chat.completions.create(
                messages=messages,
                model=model,
                temperature=temperature,
                max_tokens=actual_tokens,
            )
            content = (resp.choices[0].message.content or "").strip()
            if content:
                return content
        except Exception as e:
            logger.warning(f"Appel Groq CV modèle {model} échoué ({e}), essai modèle de repli...")
            last_error = e
            continue

    raise last_error or RuntimeError("Tous les modèles LLM ont échoué pour la réécriture du CV.")


def node_rewrite_cv_sections(state: CVWriterState) -> dict:
    """Noeud 2 : Redige le summary, les descriptions de projets et d'experiences orientes vers le poste."""
    profile = state.get("master_profile") or {}
    api_key = (profile.get("groq_api_key") or "").strip() or settings.effective_groq_api_key
    model_name = (profile.get("groq_model") or "").strip() or settings.effective_groq_model
    lang = state.get("language", "fr")
    is_en = lang == "en"

    job = state.get("job_offer") or {}
    recon = state.get("recon_dossier") or {}
    ats = state.get("ats_match") or {}

    selected_exp = state.get("selected_experiences")
    selected_proj = state.get("selected_projects")

    exp_list = selected_exp if selected_exp is not None else profile.get("experiences", [])
    proj_list = selected_proj if selected_proj is not None else profile.get("projects", [])

    n_experiences = len(exp_list)
    n_projects = len(proj_list)

    context_text = _build_cv_context(
        profile=profile,
        recon=recon,
        job=job,
        ats=ats,
        lang=lang,
        experiences=exp_list,
        projects=proj_list,
    )

    comp = job.get("company", "")
    role = job.get("title", "")

    if not api_key:
        return {
            "rewritten_summary": None,
            "rewritten_experiences": None,
            "rewritten_projects": None,
            "errors": ["Le modèle IA rencontre un problème. Clé d'API non configurée. Veuillez réessayer ultérieurement."],
        }

    try:
        from groq import Groq
        client = Groq(api_key=api_key, timeout=30.0)

        if is_en:
            exp_prompt_lines = []
            for i, exp in enumerate(exp_list, 1):
                c = exp.get("company", "")
                r = exp.get("role_en" if is_en else "role_fr") or exp.get("role", "")
                exp_prompt_lines.append(f"EXP_{i} (for {r} at {c}):\n[Rewritten description of THIS specific experience for {role}. 1-2 concise sentences max.]")
            exp_prompt_str = "\n".join(exp_prompt_lines)

            proj_prompt_lines = []
            for i, p in enumerate(proj_list, 1):
                t = p.get("title_en" if is_en else "title_fr") or p.get("title", "")
                proj_prompt_lines.append(f"PROJ_{i} (for project << {t} >>):\n[Rewritten description of THIS specific project for {role}. 1-2 concise sentences max.]")
            proj_prompt_str = "\n".join(proj_prompt_lines)

            rewrite_prompt = f"""You are an expert CV writer for software engineers. Your job is to REWRITE CV content to perfectly target a specific position.

{context_text}

=== MANDATORY RULES ===
- Use ONLY facts from the candidate's real profile (zero hallucination, no invented skills or credentials).
- Exact item matching: NEVER mix up or swap experiences or projects. Each description must strictly match the indicated company or project.
- Emphasize the aspects of each project/experience that are MOST RELEVANT to this specific role.
- Be concise and impactful (CV style, not prose).
- Never copy-paste the original descriptions verbatim.
- HEADLINE RULE: The internship/job topic title is "{role}". Propose the best professional engineering profile title/headline for the candidate (2 to 5 words, e.g., "CI/CD Pipeline Developer", "Cloud & DevOps Engineer", "Embedded Systems Engineer"). NEVER use action nouns, tasks, or project titles (NEVER write "Development of a CI/CD pipeline...", "Designing...", "Implementation...").
- SUMMARY RULE (ABSOLUTE): NEVER mention the target company name ("{comp}") or phrases like "at {comp}", "for {comp}" in the SUMMARY. The CV is the candidate's personal resume. Mentioning the target company belongs exclusively in the cover letter, NEVER on the CV.

=== YOUR TASK ===
Rewrite the following CV sections oriented towards the engineering profile required for {role}.

Output in this EXACT format (use --- as separator):

HEADLINE:
[A concise 2-5 word professional candidate headline, e.g., CI/CD Pipeline Developer]

SUMMARY:
[Write a 2-3 sentence professional summary that positions the candidate specifically for this engineering profile. Highlight the most relevant skills and experience angles. NEVER mention "{comp}".]

---EXPERIENCES---
{exp_prompt_str}

---PROJECTS---
{proj_prompt_str}"""
            sys_prompt = "You are a precision CV writer. You rewrite content to target specific positions while maintaining absolute factual accuracy."
        else:
            exp_prompt_lines = []
            for i, exp in enumerate(exp_list, 1):
                c = exp.get("company", "")
                r = exp.get("role_fr" if not is_en else "role_en") or exp.get("role", "")
                exp_prompt_lines.append(f"EXP_{i} (pour {r} chez {c}) :\n[Description reecrite de CETTE experience precise pour le poste de {role}. 1-2 phrases concises max.]")
            exp_prompt_str = "\n".join(exp_prompt_lines)

            proj_prompt_lines = []
            for i, p in enumerate(proj_list, 1):
                t = p.get("title_fr" if not is_en else "title_en") or p.get("title", "")
                proj_prompt_lines.append(f"PROJ_{i} (pour le projet << {t} >>) :\n[Description reecrite de CE projet precis pour le poste de {role}. 1-2 phrases concises max.]")
            proj_prompt_str = "\n".join(proj_prompt_lines)

            rewrite_prompt = f"""Tu es un expert en redaction de CV d'ingenieurs logiciels. Ton role est de REECRIRE le contenu du CV pour cibler parfaitement un poste specifique.

{context_text}

=== DIRECTIVES IMPERATIVES ===
- Verite absolue : Utilise UNIQUEMENT les faits reels du profil du candidat (aucun ajout d'experience ou de technologie fictive).
- Association exacte : Ne permute ou ne melange JAMAIS les experiences ou projets. Chaque description doit correspondre strictement a l'entreprise ou au projet indique.
- Pertinence ciblee : Mets en avant les aspects de chaque projet/experience les PLUS PERTINENTS pour ce poste specifique.
- Style CV percutant : Sois concis, technique et percutant (style CV, pas de prose creuse).
- Pas de copier-coller : Ne JAMAIS copier-coller les descriptions originales mot pour mot.
- REGLE DU TITRE DU PROFIL (HEADLINE) : Le titre du poste ou sujet de stage PFE cible est "{role}". Propose le meilleur titre de profil d'ingenieur pour le candidat (2 a 5 mots, ex: "Developpeur de chaine CI/CD", "Ingenieur Cloud & DevOps", "Ingenieur DevOps & CI/CD", "Ingenieur Conception Logicielle"). Ce titre DOIT designer un profil professionnel d'ingenieur, JAMAIS un nom d'action, une tache ou un sujet de stage (NE JAMAIS ecrire "Developpement d'une chaine...", "Conception de...", "Mise en place...").
- REGLE ABSOLUE DU SUMMARY (ZERO NOM D'ENTREPRISE) : Ne mentionne JAMAIS le nom de l'entreprise cible ("{comp}") ni d'expressions comme "chez {comp}", "au sein de {comp}" ou "pour {comp}" dans le SUMMARY. Le CV est un document personnel centre sur le profil et les competences du candidat. La mention de l'entreprise cible est strictement interdite dans le CV (reservee a la lettre de motivation).

=== TA MISSION ===
Reecris les sections suivantes du CV orientees vers le profil d'ingenieur correspondant au besoin de "{role}".

Reponds dans ce format EXACT (utilise --- comme separateur) :

HEADLINE:
[Un intitule de profil professionnel d'ingenieur percutant de 2 a 5 mots, ex: Developpeur de chaine CI/CD]

SUMMARY:
[Redige une accroche professionnelle de 2-3 phrases qui positionne le candidat specifiquement pour ce profil d'ingenieur. Mets en avant les competences et angles d'experience les plus pertinents. NE MENTIONNE JAMAIS "{comp}".]

---EXPERIENCES---
{exp_prompt_str}

---PROJECTS---
{proj_prompt_str}"""
            sys_prompt = "Tu es un redacteur de CV de precision. Tu reecris le contenu pour cibler des postes specifiques tout en maintenant une exactitude factuelle absolue."

        cv_tokens = 750 if "qwen" in model_name.lower() else 2500
        raw = _call_groq_resilient(
            client=client,
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": rewrite_prompt},
            ],
            requested_model=model_name,
            target_max_tokens=cv_tokens,
            temperature=0.2,
        )

        if not raw or len(raw) < 100:
            logger.error("Reponse LLM CV trop courte ou vide.")
            return {
                "rewritten_headline": None,
                "rewritten_summary": None,
                "rewritten_experiences": None,
                "rewritten_projects": None,
                "errors": ["Le modèle IA rencontre un problème. Réponse incomplète reçue. Veuillez réessayer ultérieurement."],
            }

        # Parse le resultat structure
        result = _parse_cv_rewrite_response(raw, n_experiences, n_projects, company=comp)
        return {
            "rewritten_headline": result.headline or None,
            "rewritten_summary": result.summary or None,
            "rewritten_experiences": result.experiences or None,
            "rewritten_projects": result.projects or None,
        }

    except Exception as e:
        logger.error(f"CV rewrite Groq echoue: {e}")
        return {
            "rewritten_headline": None,
            "rewritten_summary": None,
            "rewritten_experiences": None,
            "rewritten_projects": None,
            "errors": ["Le modèle IA rencontre un problème. Veuillez réessayer ultérieurement."],
        }


def _parse_cv_rewrite_response(raw: str, n_exp: int, n_proj: int, company: str = "") -> CVRewriteResult:
    """Parse la reponse structuree du LLM pour extraire headline, summary, experiences et projets reecrits."""
    result = CVRewriteResult()

    # Extract headline
    headline_match = re.search(r"HEADLINE:\s*\n?(.*?)(?=SUMMARY:|---EXPERIENCES---|---PROJECTS---|$)", raw, re.DOTALL | re.IGNORECASE)
    if headline_match:
        hl = headline_match.group(1).strip().strip('"').strip("'").strip("«»[]")
        hl = hl.split("\n")[0].strip()
        if hl and len(hl) < 100:
            result.headline = hl

    # Extract summary
    summary_match = re.search(r"SUMMARY:\s*\n?(.*?)(?=---EXPERIENCES---|---PROJECTS---|$)", raw, re.DOTALL | re.IGNORECASE)
    if summary_match:
        result.summary = summary_match.group(1).strip()

    # Nettoyage systematique et absolu du nom de l'entreprise dans le summary
    if result.summary and company:
        comp_esc = re.escape(company.strip())
        if comp_esc:
            # 1. Phrases comme "chez <Entreprise>", "au sein de <Entreprise>", "pour <Entreprise>", "at <Company>"
            result.summary = re.sub(
                rf"(?i)\s+(?:chez|au sein de|pour|auprès de|at|with|in)\s+{comp_esc}\b[.]?",
                ".",
                result.summary,
            )
            # 2. Suppression residuelle du nom de l'entreprise seul
            result.summary = re.sub(rf"(?i)\b{comp_esc}\b", "", result.summary)
            # 3. Ponctuation propre
            result.summary = re.sub(r"\s+([.,;:!?])", r"\1", result.summary)
            result.summary = re.sub(r"\.\s*\.", ".", result.summary)
            result.summary = re.sub(r"\s{2,}", " ", result.summary).strip()

    # Extract experiences
    exp_section = re.search(r"---EXPERIENCES---\s*\n(.*?)(?=---PROJECTS---|$)", raw, re.DOTALL | re.IGNORECASE)
    if exp_section:
        exp_text = exp_section.group(1)
        for i in range(1, n_exp + 1):
            pattern = rf"EXP_{i}[^:\n]*:\s*\n(.*?)(?=EXP_{i+1}[^:\n]*:|---PROJECTS---|---|$)"
            match = re.search(pattern, exp_text, re.DOTALL | re.IGNORECASE)
            if match:
                desc = match.group(1).strip()
                if desc:
                    result.experiences.append({"index": i - 1, "description": desc})

    # Extract projects
    proj_section = re.search(r"---PROJECTS---\s*\n(.*?)$", raw, re.DOTALL | re.IGNORECASE)
    if proj_section:
        proj_text = proj_section.group(1)
        for i in range(1, n_proj + 1):
            pattern = rf"PROJ_{i}[^:\n]*:\s*\n(.*?)(?=PROJ_{i+1}[^:\n]*:|---|$)"
            match = re.search(pattern, proj_text, re.DOTALL | re.IGNORECASE)
            if match:
                desc = match.group(1).strip()
                if desc:
                    result.projects.append({"index": i - 1, "description": desc})

    return result


# ============================================================================
# Assemblage du Graphe LangGraph
# ============================================================================

def build_cv_agent_graph():
    graph = StateGraph(CVWriterState)

    graph.add_node("load_context", node_load_cv_context)
    graph.add_node("rewrite_sections", node_rewrite_cv_sections)

    graph.add_edge(START, "load_context")
    graph.add_edge("load_context", "rewrite_sections")
    graph.add_edge("rewrite_sections", END)

    return graph.compile()


cv_writer_agent = build_cv_agent_graph()


def execute_cv_writer_agent(
    job_id: str,
    user_id: str = "louay",
    language: str = "fr",
    engine: Optional[Any] = None,
    ats_match: Optional[ATSMatchResult] = None,
    job_offer: Optional[JobOffer] = None,
    master_profile: Optional[MasterProfile] = None,
    selected_experiences: Optional[List[Dict[str, Any]]] = None,
    selected_projects: Optional[List[Dict[str, Any]]] = None,
    **kwargs: Any,
) -> CVRewriteResult:
    """Point d'entree synchrone pour executer l'Agent Redacteur de CV."""
    ats_dict = {
        "score": ats_match.score if ats_match else 0,
        "matched_skills": ats_match.matched_skills if ats_match else [],
        "missing_skills": ats_match.missing_skills if ats_match else [],
    } if ats_match else {}

    initial_state: CVWriterState = {
        "job_id": job_id,
        "user_id": user_id,
        "language": language,
        "job_obj": job_offer,
        "profile_obj": master_profile,
        "job_offer": None,
        "recon_dossier": None,
        "master_profile": None,
        "selected_experiences": selected_experiences,
        "selected_projects": selected_projects,
        "ats_match": ats_dict,
        "rewritten_headline": None,
        "rewritten_summary": None,
        "rewritten_experiences": None,
        "rewritten_projects": None,
        "engine": engine,
        "errors": [],
    }

    final_state = cv_writer_agent.invoke(initial_state)

    if final_state.get("errors"):
        raise RuntimeError(final_state["errors"][0])

    return CVRewriteResult(
        headline=final_state.get("rewritten_headline") or "",
        summary=final_state.get("rewritten_summary") or "",
        experiences=final_state.get("rewritten_experiences") or [],
        projects=final_state.get("rewritten_projects") or [],
    )
