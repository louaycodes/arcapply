import json
import logging
import re
from typing import Any, Dict, List, Optional, Tuple, TypedDict

from langgraph.graph import END, START, StateGraph
from sqlmodel import Session, select

from app.adapters.database import get_engine
from app.config import settings
from app.domain.models import (
    AgentPlaybookRule,
    ATSMatchResult,
    CoverLetter,
    JobOffer,
    MasterProfile,
    ReconDossier,
)

logger = logging.getLogger(__name__)

# Règles anti-clichés d'ingénieur
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


class WriterState(TypedDict):
    job_id: str
    user_id: str
    language: str
    job_obj: Optional[Any]
    profile_obj: Optional[Any]
    job_offer: Optional[Dict[str, Any]]
    recon_dossier: Optional[Dict[str, Any]]
    master_profile: Optional[Dict[str, Any]]
    active_playbook_rules: List[Dict[str, Any]]
    ats_match: Optional[Dict[str, Any]]
    thinking_plan: Optional[str]
    draft_letter: Optional[str]
    final_letter: Optional[str]
    cliche_score: int
    banned_phrases: List[str]
    engine: Optional[Any]
    errors: List[str]


def _audit_cliches(text: str) -> Tuple[int, List[str]]:
    detected = []
    for pattern, _ in CLICHE_RULES:
        matches = re.findall(pattern, text, flags=re.IGNORECASE)
        if matches:
            detected.extend(matches)
    return len(detected), list(set(detected))


def _sanitize_cliches(text: str) -> str:
    sanitized = text
    for pattern, replacement in CLICHE_RULES:
        sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)
    return sanitized


# ============================================================================
# LangGraph Nodes for Writer Agent
# ============================================================================

def node_load_full_context(state: WriterState) -> dict:
    """Nœud 1 : Charge 100% du profil, le dossier Deep Recon et les directives du Playbook."""
    engine = state.get("engine") or get_engine()
    user_id = state.get("user_id", "louay")
    job_id = state.get("job_id")
    job_in = state.get("job_obj")
    profile_in = state.get("profile_obj")

    with Session(engine) as session:
        # 1. Job Offer
        job = job_in
        if not job and job_id:
            job = session.exec(select(JobOffer).where(JobOffer.id == job_id)).first()

        job_dict = {
            "title": job.title or "Ingénieur Logiciel" if job else "",
            "company": job.company or "votre entreprise" if job else "",
            "location": job.location if job else "",
            "description": job.description_raw if job else "",
            "offer_type": getattr(job, "offer_type", "PFE") if job else "PFE",
        } if job else {}

        # 2. Recon Dossier
        dossier = None
        if job_id:
            dossier = session.exec(select(ReconDossier).where(ReconDossier.job_id == job_id)).first()
        recon_dict = {
            "external_url": dossier.external_url if dossier else None,
            "full_description": dossier.full_description if dossier else "",
            "company_name": dossier.company_name if dossier else "",
            "company_mission": dossier.company_mission if dossier else "",
            "company_culture": dossier.company_culture if dossier else "",
            "tech_stack_detected": dossier.tech_stack_detected if dossier else [],
        } if dossier else {}

        # 3. Master Profile (100% des données)
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

        # 4. Playbook Rules actives de l'utilisateur
        rules = session.exec(
            select(AgentPlaybookRule).where(
                AgentPlaybookRule.user_id == user_id,
                AgentPlaybookRule.is_active == True,
            )
        ).all()
        playbook_list = [
            {
                "title": r.title,
                "category": r.category,
                "condition": r.condition_trigger,
                "action": r.action_instruction,
            }
            for r in rules
        ]

    return {
        "job_offer": job_dict,
        "recon_dossier": recon_dict,
        "master_profile": profile_dict,
        "active_playbook_rules": playbook_list,
    }


def node_thinking_phase(state: WriterState) -> dict:
    """Nœud 2 : Phase de raisonnement stratégique autonome (Thinking Plan)."""
    api_key = settings.effective_groq_api_key
    lang = state.get("language", "fr")
    is_en = lang == "en"

    job = state.get("job_offer") or {}
    recon = state.get("recon_dossier") or {}
    profile = state.get("master_profile") or {}
    rules = state.get("active_playbook_rules") or []

    # Construction du plan par IA si la clé Groq est configurée
    if api_key:
        try:
            from groq import Groq
            client = Groq(api_key=api_key)

            rules_text = "\n".join([f"- [{r['title']}] SI {r['condition']} ➔ ALORS {r['action']}" for r in rules])
            projects_summary = "\n".join([
                f"- Projet « {p.get('title')} » : {p.get('description')} [Techs: {p.get('technologies')}]"
                for p in profile.get("projects", [])
            ])
            experiences_summary = "\n".join([
                f"- Expérience chez {e.get('company')} ({e.get('role')}) : {e.get('description')} [Techs: {e.get('technologies')}]"
                for e in profile.get("experiences", [])
            ])

            thinking_prompt = f"""Tu es un stratège senior en recrutement d'ingénieurs.
Analyse cette offre d'emploi et le profil réel du candidat pour établir un PLAN D'ATTAQUE STRATÉGIQUE (Thinking Process).

OFFRE CIBLE & DOSSIER RECON :
Poste : {job.get('title')}
Entreprise : {job.get('company')}
Description Offre : {recon.get('full_description') or job.get('description', '')[:2000]}
Mission Entreprise : {recon.get('company_mission', '')}
Culture Entreprise : {recon.get('company_culture', '')}
Stack détectée : {', '.join(recon.get('tech_stack_detected', []))}

DIRECTIVES DU PLAYBOOK CANDIDAT :
{rules_text or 'Aucune règle personnalisée.'}

RÉALISATIONS DU CANDIDAT (100% RÉELLES - ZÉRO INVENTION) :
Projets :
{projects_summary}

Expériences :
{experiences_summary}

CONSIGNE :
Rédige un plan de raisonnement concis en 4 points :
1. Diagnostic du besoin réel de l'entreprise et de sa stack.
2. Directives du Playbook déclenchées et angle stratégique retenu.
3. Projets / expériences du candidat sélectionnés en priorité et justification.
4. Synthèse de l'argumentation Vous - Moi - Nous - Demain."""

            resp = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "Tu es un directeur technique et stratège de candidature d'ingénieur. Tu raisonnes avec une rigueur absolue."},
                    {"role": "user", "content": thinking_prompt},
                ],
                model=settings.effective_groq_model,
                temperature=0.3,
                max_tokens=600,
            )
            plan = (resp.choices[0].message.content or "").strip()
            if plan:
                return {"thinking_plan": plan}
        except Exception as e:
            logger.warning(f"Thinking phase Groq échouée: {e}")

    # Fallback Thinking Plan structuré
    comp = job.get("company", "l'entreprise")
    role = job.get("title", "Ingénieur Logiciel")
    top_proj = profile.get("projects", [{}])[0].get("title", "Projet Technique")
    plan = f"""### 🧠 Plan d'attaque stratégique de l'Agent
1. **Diagnostic du besoin :** {comp} recherche un profil solide pour le poste de {role} avec un accent sur la rigueur d'ingénierie logicielle.
2. **Playbook appliqué :** Alignement sur les compétences clés détectées et valorisation des architectures robustes.
3. **Projet priorisé :** Mise en exergue du projet « {top_proj} » dont la réalisation technique prouve la compétence opérationnelle.
4. **Schéma narratif :** 4 actes Apec (Vous: enjeux techniques; Moi: projet {top_proj}; Nous: apport immédiat à l'équipe; Demain: disponibilité 6 mois pour un PFE et entretien)."""

    return {"thinking_plan": plan}


def node_drafting_phase(state: WriterState) -> dict:
    """Nœud 3 : Rédaction de la lettre par l'Agent Rédacteur guidée par le Thinking Plan."""
    api_key = settings.effective_groq_api_key
    lang = state.get("language", "fr")
    is_en = lang == "en"

    job = state.get("job_offer") or {}
    recon = state.get("recon_dossier") or {}
    profile = state.get("master_profile") or {}
    plan = state.get("thinking_plan") or ""
    ats = state.get("ats_match") or {}

    missing_skills = ats.get("missing_skills", [])
    missing_prohibition = ""
    if missing_skills:
        missing_str = ", ".join(missing_skills)
        missing_prohibition = f"INTERDICTION FORMELLE et ABSOLUE de mentionner ces compétences manquantes : {missing_str}."

    full_name = profile.get("full_name", "Candidat")
    edu = profile.get("educations", [{}])[0] if profile.get("educations") else {}
    school = edu.get("school", "école d'ingénieurs")
    degree = edu.get("degree_fr" if not is_en else "degree_en") or edu.get("degree", "Ingénieur")
    comp = job.get("company", "votre entreprise")
    role = job.get("title", "Ingénieur")

    projects_lines = []
    for p in profile.get("projects", []):
        p_title = p.get("title", "")
        p_desc = p.get("description", "")
        p_tech = p.get("technologies", "")
        projects_lines.append(f"- Projet « {p_title} » : {p_desc} [Technologies : {p_tech}]")
    projects_text = "\n".join(projects_lines)

    experiences_lines = []
    for e in profile.get("experiences", []):
        experiences_lines.append(f"- Expérience chez {e.get('company')} ({e.get('role')}) : {e.get('description')} [Technologies : {e.get('technologies')}]")
    experiences_text = "\n".join(experiences_lines)

    matched_skills = ats.get("matched_skills", [])
    matched_skills_str = ", ".join(matched_skills[:5]) if matched_skills else "Python, architecture logicielle"

    if api_key:
        try:
            from groq import Groq
            client = Groq(api_key=api_key)

            if is_en:
                draft_prompt = f"""Write an impactful, sober, and factual engineering cover letter in 4 distinct paragraphs in English.

STRATEGIC THINKING PLAN TO FOLLOW:
{plan}

CANDIDATE GROUND TRUTH:
- Full Name: {full_name}
- School & Degree: {degree} at {school}
- Target Company: {comp}
- Target Role: {role}
- Verified Skills: {matched_skills_str}
- Projects to cite:
{projects_text}
- Experiences:
{experiences_text}
- Application status: 6-month Graduation Internship (PFE)
{missing_prohibition}

MANDATORY RULES:
1. You MUST explicitly name the company « {comp} » and the school « {school} » in the first paragraph.
2. 4 distinct paragraphs (YOU: company challenges & mission; ME: concrete achievements with exact titles in quotation marks « Project Title »; US: operational day-one contribution; TOMORROW: 6-month availability & technical interview).
3. Mention verified skills: {matched_skills_str}.
4. NEVER invent facts, stats or companies.
5. Sober engineering tone, no AI buzzwords.
6. Begin with « Dear Hiring Team, » and end with « Sincerely,\n\n{full_name} »."""
                sys_prompt = "You are an elite software engineering writer. You write concise, sober, factual cover letters."
            else:
                draft_prompt = f"""Rédige une lettre de motivation d'ingénieur sobre, percutante et factuelle selon la méthode Apec (VOUS - MOI - NOUS - DEMAIN) en 4 paragraphes.

PLAN STRATÉGIQUE (THINKING PROCESS) À SUIVRE :
{plan}

DONNÉES DU CANDIDAT (ZÉRO HALLUCINATION) :
- Nom complet : {full_name}
- Formation & École : {degree} à {school}
- Entreprise ciblée : {comp}
- Poste ciblé : {role}
- Compétences vérifiées : {matched_skills_str}
- Projets à citer :
{projects_text}
- Expériences :
{experiences_text}
- Statut : Stage de fin d'études PFE d'une durée de 6 mois
{missing_prohibition}

RÈGLES IMPÉRATIVES :
1. Tu DOIS OBLIGATOIREMENT citer explicitement le nom de l'entreprise cible « {comp} » et l'école d'ingénieurs « {school} » dès le premier paragraphe (interdiction d'écrire seulement 'votre entreprise').
2. Tu DOIS OBLIGATOIREMENT citer les titres exacts des projets entre guillemets « Titre du Projet » tels qu'indiqués dans la liste ci-dessus.
3. 4 paragraphes Apec (VOUS: entreprise et défis; MOI: réalisations sélectionnées; NOUS: valeur ajoutée immédiate; DEMAIN: disponibilité 6 mois et entretien).
4. Ne JAMAIS inventer d'expériences ou de technologies non présentes.
5. Proscrire tout cliché d'IA.
6. Débuter par « Madame, Monsieur, » et conclure obligatoirement par les salutations professionnelles suivies de « {full_name} »."""
                sys_prompt = "Tu es un rédacteur d'élite de candidatures d'ingénieurs. Tu rédiges en français sobre et percutant."

            resp = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": draft_prompt},
                ],
                model=settings.effective_groq_model,
                temperature=0.2,
                max_tokens=900,
            )
            raw = (resp.choices[0].message.content or "").strip()
            if raw and len(raw) > 150:
                # Anti-hallucination check on missing skills
                lower_raw = raw.lower()
                hallucinated = any(len(m) > 2 and m.lower() in lower_raw for m in missing_skills)
                if not hallucinated:
                    return {"draft_letter": raw}
                else:
                    logger.warning("Rejet génération Groq : détection d'une compétence manquante hallucinée. Utilisation du repli déterministe.")
        except Exception as e:
            logger.warning(f"Drafting phase Groq échouée: {e}")

    # Fallback déterministe structuré
    top_proj = profile.get("projects", [{}])[0].get("title", "Distributed Queue Worker") if profile.get("projects") else "Projet d'ingénierie"
    skills_cite = matched_skills_str or "Python"

    if is_en:
        fallback = f"""Dear Hiring Team,

Currently an engineering student at {school}, I am actively seeking my 6-month graduation internship (PFE). The opportunity to join {comp} as {role} caught my immediate attention given your technical excellence and development standards.

Among my achievements directly relevant to this position, I engineered « {top_proj} », implementing robust software design principles with {skills_cite}.

By joining your team, I will bring an immediate operational contribution to your development cycles with thorough attention to code quality and system resilience.

Available for a 6-month duration, I would be pleased to discuss my background and projects during a technical interview.

Sincerely,

{full_name}"""
    else:
        fallback = f"""Madame, Monsieur,

Actuellement élève-ingénieur à {school}, je recherche activement mon projet de fin d'études (PFE) d'une durée de 6 mois. L'opportunité d'intégrer {comp} au poste de {role} a retenu toute mon attention en raison de vos exigences techniques et de vos projets ambitieux.

Parmi mes réalisations directement liées à ce poste, j'ai développé « {top_proj} », mettant en œuvre une architecture logicielle rigoureuse et des compétences en {skills_cite}.

En rejoignant vos équipes, je souhaite apporter une contribution concrète sur vos développements, en m'investissant avec méthode et rigueur sur la qualité du code et la robustesse des systèmes.

Disponible dès le premier semestre pour une durée de 6 mois, je serais ravi d'échanger avec vous lors d'un entretien technique.

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

{full_name}"""

    return {"draft_letter": fallback}


def node_sanitize_and_fallback(state: WriterState) -> dict:
    """Nœud 4 : Injections d'entités manquantes, filtrage anti-clichés et validation finale."""
    draft = state.get("draft_letter") or ""
    job = state.get("job_offer") or {}
    profile = state.get("master_profile") or {}
    lang = state.get("language", "fr")
    is_en = lang == "en"

    # 1. Vérification & injection garantie de l'entreprise cible
    comp = (job.get("company") or "").strip()
    if comp and comp.lower() not in ["votre entreprise", "entreprise", "your company"]:
        if comp.lower() not in draft.lower():
            # Remplacement de la première mention générique
            draft_sub = re.sub(
                r"\b(?:[Vv]otre entreprise|[Vv]otre société|[Yy]our company)\b",
                comp,
                draft,
                count=1,
            )
            if comp.lower() in draft_sub.lower():
                draft = draft_sub
            else:
                parts = draft.split("\n\n")
                if len(parts) >= 2:
                    if is_en:
                        parts[1] = f"The opportunity to join {comp} holds my strongest interest. " + parts[1]
                    else:
                        parts[1] = f"L'opportunité d'intégrer {comp} retient toute mon attention. " + parts[1]
                    draft = "\n\n".join(parts)

    # 2. Vérification & injection garantie de l'école d'ingénieurs
    edu = profile.get("educations", [{}])[0] if profile.get("educations") else {}
    school = (edu.get("school") or "").strip()
    if school and school.lower() not in ["école d'ingénieurs", "engineering school"]:
        if school.lower() not in draft.lower():
            if "élève-ingénieur" in draft:
                draft = draft.replace("élève-ingénieur", f"élève-ingénieur à {school}", 1)
            elif "étudiant" in draft:
                draft = draft.replace("étudiant", f"étudiant à {school}", 1)
            elif "engineering student" in draft:
                draft = draft.replace("engineering student", f"engineering student at {school}", 1)
            else:
                parts = draft.split("\n\n")
                if len(parts) >= 2:
                    if is_en:
                        parts[1] = f"Currently an engineering student at {school}, " + parts[1]
                    else:
                        parts[1] = f"Actuellement élève-ingénieur à {school}, " + parts[1]
                    draft = "\n\n".join(parts)

    cleaned = _sanitize_cliches(draft)
    cliche_score, banned = _audit_cliches(cleaned)

    return {
        "final_letter": cleaned,
        "cliche_score": cliche_score,
        "banned_phrases": banned,
    }


# ============================================================================
# Assemblage du Graphe LangGraph
# ============================================================================

def build_writer_agent_graph():
    graph = StateGraph(WriterState)

    graph.add_node("load_context", node_load_full_context)
    graph.add_node("thinking", node_thinking_phase)
    graph.add_node("drafting", node_drafting_phase)
    graph.add_node("sanitize", node_sanitize_and_fallback)

    graph.add_edge(START, "load_context")
    graph.add_edge("load_context", "thinking")
    graph.add_edge("thinking", "drafting")
    graph.add_edge("drafting", "sanitize")
    graph.add_edge("sanitize", END)

    return graph.compile()


writer_agent = build_writer_agent_graph()


def execute_writer_agent(
    job_id: str,
    user_id: str = "louay",
    language: str = "fr",
    engine: Optional[Any] = None,
    ats_match: Optional[ATSMatchResult] = None,
    job_offer: Optional[JobOffer] = None,
    master_profile: Optional[MasterProfile] = None,
) -> CoverLetter:
    """Point d'entrée synchrone pour exécuter l'Agent Rédacteur LangGraph."""
    ats_dict = {
        "score": ats_match.score if ats_match else 0,
        "matched_skills": ats_match.matched_skills if ats_match else [],
        "missing_skills": ats_match.missing_skills if ats_match else [],
    } if ats_match else {}

    initial_state: WriterState = {
        "job_id": job_id,
        "user_id": user_id,
        "language": language,
        "job_obj": job_offer,
        "profile_obj": master_profile,
        "job_offer": None,
        "recon_dossier": None,
        "master_profile": None,
        "active_playbook_rules": [],
        "ats_match": ats_dict,
        "thinking_plan": None,
        "draft_letter": None,
        "final_letter": None,
        "cliche_score": 0,
        "banned_phrases": [],
        "engine": engine,
        "errors": [],
    }

    final_state = writer_agent.invoke(initial_state)

    job_data = final_state.get("job_offer") or {}
    role = job_data.get("title", "Ingénieur")
    company = job_data.get("company", "Entreprise")

    letter = CoverLetter(
        job_id=job_id,
        profile_id="default-profile",
        target_role=role,
        company_name=company,
        content_markdown=final_state.get("final_letter", ""),
        cliche_score=final_state.get("cliche_score", 0),
        thinking_plan=final_state.get("thinking_plan"),
        language=language,
        user_id=user_id,
    )
    letter.banned_phrases_detected = final_state.get("banned_phrases", [])
    return letter

