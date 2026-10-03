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
    ats_match: Optional[Dict[str, Any]]
    rewritten_summary: Optional[str]
    rewritten_experiences: Optional[List[Dict[str, str]]]
    rewritten_projects: Optional[List[Dict[str, str]]]
    engine: Optional[Any]
    errors: List[str]


class CVRewriteResult:
    """Resultat de l'agent redacteur de CV."""
    def __init__(
        self,
        summary: str = "",
        experiences: Optional[List[Dict[str, str]]] = None,
        projects: Optional[List[Dict[str, str]]] = None,
    ):
        self.summary = summary
        self.experiences = experiences or []
        self.projects = projects or []


def _build_cv_context(profile: dict, recon: dict, job: dict, ats: dict, lang: str) -> str:
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

    # Experiences
    lines.append(f"\n--- Experiences ---")
    for i, exp in enumerate(profile.get("experiences", []), 1):
        company = exp.get("company", "")
        role = exp.get("role_fr" if not is_en else "role_en") or exp.get("role", "")
        desc = exp.get("description_fr" if not is_en else "description_en") or exp.get("description", "")
        techs = exp.get("technologies", "")
        lines.append(f"  {i}. {role} chez {company}")
        lines.append(f"     Description originale : {desc}")
        lines.append(f"     Technologies : {techs}")

    # Projets
    lines.append(f"\n--- Projets ---")
    for i, p in enumerate(profile.get("projects", []), 1):
        title = p.get("title_fr" if not is_en else "title_en") or p.get("title", "")
        role = p.get("role_fr" if not is_en else "role_en") or p.get("role", "")
        desc = p.get("description_fr" if not is_en else "description_en") or p.get("description", "")
        techs = p.get("technologies", "")
        lines.append(f"  {i}. << {title} >> ({role})")
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
            }

    return {
        "job_offer": job_dict,
        "recon_dossier": recon_dict,
        "master_profile": profile_dict,
    }


def node_rewrite_cv_sections(state: CVWriterState) -> dict:
    """Noeud 2 : Redige le summary, les descriptions de projets et d'experiences orientes vers le poste."""
    api_key = settings.effective_groq_api_key
    lang = state.get("language", "fr")
    is_en = lang == "en"

    job = state.get("job_offer") or {}
    recon = state.get("recon_dossier") or {}
    profile = state.get("master_profile") or {}
    ats = state.get("ats_match") or {}

    missing_skills = ats.get("missing_skills", [])
    matched_skills = ats.get("matched_skills", [])

    context_text = _build_cv_context(profile, recon, job, ats, lang)

    # Nombre de projets et experiences a rediger
    n_experiences = len(profile.get("experiences", []))
    n_projects = len(profile.get("projects", []))

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
            rewrite_prompt = f"""You are an expert CV writer for software engineers. Your job is to REWRITE CV content to perfectly target a specific position.

{context_text}

=== MANDATORY RULES ===
- Use ONLY facts from the candidate's real profile (zero hallucination, no invented skills or credentials).
- Emphasize the aspects of each project/experience that are MOST RELEVANT to this specific role.
- Be concise and impactful (CV style, not prose).
- Never copy-paste the original descriptions verbatim.

=== YOUR TASK ===
Rewrite the following CV sections oriented towards the position of {role} at {comp}.

Output in this EXACT format (use --- as separator):

SUMMARY:
[Write a 2-3 sentence professional summary that positions the candidate specifically for this {role} role at {comp}. Highlight the most relevant skills and experience angles.]

---EXPERIENCES---
[For each of the {n_experiences} experiences, write:]
EXP_1:
[Rewritten description oriented towards {role}. 1-2 concise sentences max. Focus on the aspects relevant to this position.]
EXP_2:
[...]
(continue for all {n_experiences} experiences)

---PROJECTS---
[For each of the {n_projects} projects, write:]
PROJ_1:
[Rewritten description oriented towards {role}. 1-2 concise sentences max. Highlight the technical aspects that matter for this specific position.]
PROJ_2:
[...]
(continue for all {n_projects} projects)"""
            sys_prompt = "You are a precision CV writer. You rewrite content to target specific positions while maintaining absolute factual accuracy."
        else:
            rewrite_prompt = f"""Tu es un expert en redaction de CV d'ingenieurs logiciels. Ton role est de REECRIRE le contenu du CV pour cibler parfaitement un poste specifique.

{context_text}

=== DIRECTIVES IMPERATIVES ===
- Verite absolue : Utilise UNIQUEMENT les faits reels du profil du candidat (aucun ajout d'experience ou de technologie fictive).
- Pertinence ciblee : Mets en avant les aspects de chaque projet/experience les PLUS PERTINENTS pour ce poste specifique.
- Style CV percutant : Sois concis, technique et percutant (style CV, pas de prose creuse).
- Pas de copier-coller : Ne JAMAIS copier-coller les descriptions originales mot pour mot.

=== TA MISSION ===
Reecris les sections suivantes du CV orientees vers le poste de {role} chez {comp}.

Reponds dans ce format EXACT (utilise --- comme separateur) :

SUMMARY:
[Redige une accroche professionnelle de 2-3 phrases qui positionne le candidat specifiquement pour ce poste de {role} chez {comp}. Mets en avant les competences et angles d'experience les plus pertinents.]

---EXPERIENCES---
[Pour chacune des {n_experiences} experiences, ecris :]
EXP_1:
[Description reecrite orientee vers {role}. 1-2 phrases concises max. Focus sur les aspects pertinents pour ce poste.]
EXP_2:
[...]
(continue pour les {n_experiences} experiences)

---PROJECTS---
[Pour chacun des {n_projects} projets, ecris :]
PROJ_1:
[Description reecrite orientee vers {role}. 1-2 phrases concises max. Mets en avant les aspects techniques qui comptent pour ce poste specifique.]
PROJ_2:
[...]
(continue pour les {n_projects} projets)"""
            sys_prompt = "Tu es un redacteur de CV de precision. Tu reecris le contenu pour cibler des postes specifiques tout en maintenant une exactitude factuelle absolue."

        resp = client.chat.completions.create(
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": rewrite_prompt},
            ],
            model=settings.effective_groq_model,
            temperature=0.2,
            max_tokens=2500,
        )

        raw = (resp.choices[0].message.content or "").strip()
        if not raw or len(raw) < 100:
            logger.error("Reponse LLM CV trop courte ou vide.")
            return {
                "rewritten_summary": None,
                "rewritten_experiences": None,
                "rewritten_projects": None,
                "errors": ["Le modèle IA rencontre un problème. Réponse incomplète reçue. Veuillez réessayer ultérieurement."],
            }

        # Parse le resultat structure
        result = _parse_cv_rewrite_response(raw, n_experiences, n_projects)
        return {
            "rewritten_summary": result.summary or None,
            "rewritten_experiences": result.experiences or None,
            "rewritten_projects": result.projects or None,
        }

    except Exception as e:
        logger.error(f"CV rewrite Groq echoue: {e}")
        return {
            "rewritten_summary": None,
            "rewritten_experiences": None,
            "rewritten_projects": None,
            "errors": ["Le modèle IA rencontre un problème. Veuillez réessayer ultérieurement."],
        }


def _parse_cv_rewrite_response(raw: str, n_exp: int, n_proj: int) -> CVRewriteResult:
    """Parse la reponse structuree du LLM pour extraire summary, experiences et projets reecrits."""
    result = CVRewriteResult()

    # Extract summary
    summary_match = re.search(r"SUMMARY:\s*\n(.*?)(?=---EXPERIENCES---|$)", raw, re.DOTALL | re.IGNORECASE)
    if summary_match:
        result.summary = summary_match.group(1).strip()

    # Extract experiences
    exp_section = re.search(r"---EXPERIENCES---\s*\n(.*?)(?=---PROJECTS---|$)", raw, re.DOTALL | re.IGNORECASE)
    if exp_section:
        exp_text = exp_section.group(1)
        for i in range(1, n_exp + 1):
            pattern = rf"EXP_{i}:\s*\n(.*?)(?=EXP_{i+1}:|---PROJECTS---|$)"
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
            pattern = rf"PROJ_{i}:\s*\n(.*?)(?=PROJ_{i+1}:|$)"
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
        "ats_match": ats_dict,
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
        summary=final_state.get("rewritten_summary") or "",
        experiences=final_state.get("rewritten_experiences") or [],
        projects=final_state.get("rewritten_projects") or [],
    )
