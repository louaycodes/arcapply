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

# Pas de calcul de clichés ni de liste noire : règles strictes d'ingénieur
CLICHE_RULES = []


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
    return 0, []


def _sanitize_cliches(text: str) -> str:
    return text


def _serialize_full_profile(profile: dict, lang: str) -> str:
    """Serialise 100% du profil candidat en texte structure pour le prompt LLM."""
    is_en = lang == "en"
    lines = []

    lines.append(f"Nom complet : {profile.get('full_name', 'Candidat')}")
    lines.append(f"Email : {profile.get('email', '')}")

    bio = profile.get("bio_en" if is_en else "bio_fr") or profile.get("bio", "")
    if bio:
        lines.append(f"Bio / Accroche : {bio}")

    headline = profile.get("headline_en" if is_en else "headline_fr") or profile.get("headline", "")
    if headline:
        lines.append(f"Titre : {headline}")

    lines.append(f"Mode de recherche : {profile.get('search_mode', 'PFE')}")

    # Formations completes
    lines.append("\n--- FORMATIONS ---")
    for i, edu in enumerate(profile.get("educations", []), 1):
        school = edu.get("school", "")
        degree = edu.get("degree_fr" if not is_en else "degree_en") or edu.get("degree", "")
        field = edu.get("field_of_study_fr" if not is_en else "field_of_study_en") or edu.get("field_of_study", "")
        desc = edu.get("description", "")
        lines.append(f"  {i}. {degree} - {school} ({field})")
        if desc:
            lines.append(f"     Detail : {desc}")

    # Experiences completes avec TOUTES les descriptions
    lines.append("\n--- EXPERIENCES PROFESSIONNELLES ---")
    for i, exp in enumerate(profile.get("experiences", []), 1):
        company = exp.get("company", "")
        role = exp.get("role_fr" if not is_en else "role_en") or exp.get("role", "")
        desc = exp.get("description_fr" if not is_en else "description_en") or exp.get("description", "")
        techs = exp.get("technologies", "")
        lines.append(f"  {i}. {role} chez {company}")
        lines.append(f"     Description complete : {desc}")
        lines.append(f"     Technologies : {techs}")

    # Projets complets avec TOUTES les descriptions
    lines.append("\n--- PROJETS REALISES ---")
    for i, p in enumerate(profile.get("projects", []), 1):
        title = p.get("title_fr" if not is_en else "title_en") or p.get("title", "")
        role = p.get("role_fr" if not is_en else "role_en") or p.get("role", "")
        desc = p.get("description_fr" if not is_en else "description_en") or p.get("description", "")
        techs = p.get("technologies", "")
        lines.append(f"  {i}. Projet << {title} >> (Role : {role})")
        lines.append(f"     Description complete : {desc}")
        lines.append(f"     Technologies : {techs}")

    # Competences completes
    lines.append("\n--- COMPETENCES ---")
    for sk in profile.get("skills", []):
        lines.append(f"  - {sk.get('name', '')} ({sk.get('category', '')})")

    return "\n".join(lines)


def _serialize_recon_dossier(recon: dict) -> str:
    """Serialise 100% du dossier Deep Recon en texte structure."""
    lines = []

    full_desc = recon.get("full_description", "")
    if full_desc:
        lines.append(f"Description integrale de l'offre :\n{full_desc[:5000]}")

    company_name = recon.get("company_name", "")
    if company_name:
        lines.append(f"\nEntreprise : {company_name}")

    mission = recon.get("company_mission", "")
    if mission:
        lines.append(f"Mission de l'entreprise : {mission}")

    culture = recon.get("company_culture", "")
    if culture:
        lines.append(f"Culture & Valeurs : {culture}")

    tech_stack = recon.get("tech_stack_detected", [])
    if tech_stack:
        lines.append(f"Stack technique detectee : {', '.join(tech_stack)}")

    external_url = recon.get("external_url", "")
    if external_url:
        lines.append(f"URL source : {external_url}")

    return "\n".join(lines) if lines else "Dossier de reconnaissance non disponible."


# ============================================================================
# LangGraph Nodes for Writer Agent
# ============================================================================

def node_load_full_context(state: WriterState) -> dict:
    """Noeud 1 : Charge 100% du profil, le dossier Deep Recon et les directives du Playbook."""
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
            "title": job.title or "Ingenieur Logiciel" if job else "",
            "company": job.company or "votre entreprise" if job else "",
            "location": job.location if job else "",
            "description": job.description_raw if job else "",
            "offer_type": getattr(job, "offer_type", "PFE") if job else "PFE",
        } if job else {}

        # 2. Recon Dossier — 100% des donnees
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

        # 3. Master Profile (100% des donnees sans omission)
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
                "bio_fr": profile.bio_fr,
                "bio_en": profile.bio_en,
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


def _call_groq_resilient(
    client,
    messages: list[dict],
    requested_model: str,
    target_max_tokens: int,
    temperature: float = 0.25,
) -> str:
    """Appelle Groq avec adaptation intelligente des quotas et repli multi-modèles.

    1. Si Qwen est demandé : limite max_tokens pour respecter le plafond strict de 1000 OTPM.
    2. Si rate limit (429) ou erreur : bascule automatiquement vers openai/gpt-oss-120b (quota illimité en tokens de sortie).
    """
    models_to_try = [requested_model]
    for fallback in ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]:
        if fallback not in models_to_try:
            models_to_try.append(fallback)

    last_error = None
    for model in models_to_try:
        is_qwen = "qwen" in model.lower()
        actual_tokens = min(target_max_tokens, 500) if is_qwen else target_max_tokens
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
            logger.warning(f"Appel Groq modèle {model} échoué ({e}), essai modèle de repli...")
            last_error = e
            continue

    err_str = str(last_error).lower() if last_error else ""
    if any(w in err_str for w in ["429", "rate_limit", "rate limit", "quota", "tokens"]):
        raise RuntimeError("Quota de tokens Groq atteint (Rate limit / Quota journalier épuisé). Veuillez patienter quelques instants ou renseigner votre propre clé Groq dans les Paramètres.")
    raise last_error or RuntimeError("Tous les modèles LLM ont échoué.")


def node_thinking_phase(state: WriterState) -> dict:
    """Noeud 2 : Phase de raisonnement strategique — analyse croisee profil/offre/recon pour identifier
    les points d'accroche uniques a cette offre et construire un plan d'argumentation sur-mesure."""
    profile = state.get("master_profile") or {}
    api_key = (profile.get("groq_api_key") or "").strip() or settings.effective_groq_api_key
    model_name = (profile.get("groq_model") or "").strip() or settings.effective_groq_model
    lang = state.get("language", "fr")

    job = state.get("job_offer") or {}
    recon = state.get("recon_dossier") or {}
    rules = state.get("active_playbook_rules") or []
    ats = state.get("ats_match") or {}

    profile_text = _serialize_full_profile(profile, lang)
    recon_text = _serialize_recon_dossier(recon)
    matched_skills = ats.get("matched_skills", [])

    if not api_key:
        return {"errors": ["Le modèle IA rencontre un problème. Clé d'API non configurée. Veuillez réessayer ultérieurement."]}

    try:
        from groq import Groq
        client = Groq(api_key=api_key, timeout=30.0)

        rules_text = "\n".join([f"- [{r['title']}] SI {r['condition']} ALORS {r['action']}" for r in rules])

        thinking_prompt = f"""Tu es un directeur technique expert en recrutement d'ingenieurs logiciels.
Ton role : analyser en profondeur cette offre specifique et le profil reel du candidat pour construire
un PLAN D'ARGUMENTATION SUR-MESURE. Chaque point doit etre UNIQUE a cette offre, pas generique.

=== OFFRE CIBLE & DOSSIER DE RECONNAISSANCE COMPLET ===
Poste : {job.get('title', '')}
Entreprise : {job.get('company', '')}
Localisation : {job.get('location', '')}
{recon_text}

=== PROFIL COMPLET DU CANDIDAT (SOURCE UNIQUE DE VERITE) ===
{profile_text}

=== COMPETENCES CLES IDENTIFIEES ===
Competences matchees : {', '.join(matched_skills) if matched_skills else 'Technologies du profil'}

=== DIRECTIVES DU PLAYBOOK ===
{rules_text or 'Aucune regle personnalisee.'}

=== REGLES STRICTES D'ANALYSE ===
- Rigueur et verite : Base-toi strictement sur les faits reels du candidat. N'invente aucune competence, certification ou experience.
- Pertinence : Identifie les veritables defis techniques et problematiques que {job.get('company', 'l entreprise')} cherche a resoudre.

=== CONSIGNE ===
Produis un plan d'attaque strategique en 5 points SPECIFIQUES a cette offre :
1. Besoin reel de l'entreprise : Qu'est-ce que {job.get('company', 'cette entreprise')} cherche VRAIMENT pour ce poste ? Quels sont les enjeux concrets ?
2. Points d'accroche uniques : Quels elements SPECIFIQUES de l'offre ou de l'entreprise (mission, culture, stack, projets) peuvent servir d'ancrage dans la lettre ?
3. Selection strategique des realisations : Quels projets/experiences du candidat resonnent le PLUS avec cette offre et POURQUOI ? Pour chaque choisi, indique l'angle de presentation.
4. Arguments differenciants : Qu'est-ce qui distingue ce candidat pour CE poste precis ?
5. Structure argumentative Vous/Moi/Nous/Demain : Le fil conducteur specifique a cette candidature.

Sois precis, technique et exhaustif."""

        thinking_tokens = 320 if "qwen" in model_name.lower() else 800
        plan = _call_groq_resilient(
            client=client,
            messages=[
                {"role": "system", "content": "Tu es un stratege senior en recrutement d'ingenieurs. Tu raisonnes avec une rigueur absolue et une specificite maximale."},
                {"role": "user", "content": thinking_prompt},
            ],
            requested_model=model_name,
            target_max_tokens=thinking_tokens,
            temperature=0.3,
        )
        if plan:
            return {"thinking_plan": plan}
        return {"errors": ["Le modèle IA rencontre un problème. Réponse vide reçue. Veuillez réessayer ultérieurement."]}
    except Exception as e:
        logger.error(f"Thinking phase Groq echouee: {e}")
        return {"errors": ["Le modèle IA rencontre un problème. Veuillez réessayer ultérieurement."]}


def node_drafting_phase(state: WriterState) -> dict:
    """Noeud 3 : Redaction integrale de la lettre par le LLM, guidee par le Thinking Plan et le dossier recon.
    Chaque lettre est UNIQUE : pas de copier-coller du profil, pas de formules generiques."""
    if state.get("errors"):
        return {"errors": state.get("errors")}

    profile = state.get("master_profile") or {}
    api_key = (profile.get("groq_api_key") or "").strip() or settings.effective_groq_api_key
    model_name = (profile.get("groq_model") or "").strip() or settings.effective_groq_model
    lang = state.get("language", "fr")
    is_en = lang == "en"

    job = state.get("job_offer") or {}
    recon = state.get("recon_dossier") or {}
    plan = state.get("thinking_plan") or ""
    ats = state.get("ats_match") or {}

    matched_skills = ats.get("matched_skills", [])
    full_name = profile.get("full_name", "Candidat")
    edu = profile.get("educations", [{}])[0] if profile.get("educations") else {}
    school = edu.get("school", "ecole d'ingenieurs")
    comp = job.get("company", "votre entreprise")
    role = job.get("title", "Ingenieur")
    matched_skills_str = ", ".join(matched_skills[:5]) if matched_skills else "conception logicielle et ingenierie"

    profile_text = _serialize_full_profile(profile, lang)
    recon_text = _serialize_recon_dossier(recon)

    if not api_key:
        return {"errors": ["Le modèle IA rencontre un problème. Clé d'API non configurée. Veuillez réessayer ultérieurement."]}

    try:
        from groq import Groq
        client = Groq(api_key=api_key, timeout=30.0)

        if is_en:
            draft_prompt = f"""You are an elite software engineering application writer. You write like a senior engineering manager who deeply understands both the candidate's profile and the company's technical roadmap.

STRATEGIC PLAN TO FOLLOW:
{plan}

=== COMPLETE CANDIDATE PROFILE (SOURCE OF TRUTH) ===
{profile_text}

=== COMPLETE COMPANY & JOB INTELLIGENCE (DEEP RECON) ===
{recon_text}

Target Company: {comp}
Target Role: {role}
Key Technical Skills: {matched_skills_str}

=== MANDATORY WRITING RULES ===
1. Absolute Truthfulness: Use ONLY real facts, projects, technologies, and achievements from the candidate's profile above. Never invent facts, certifications, or companies.
2. High Specificity: Every single paragraph must directly address {comp} and the exact engineering challenges mentioned in the reconnaissance dossier.
3. Structure: 4 substantive, articulate paragraphs following YOU / ME / US / TOMORROW:
   - 1. YOU (The Company): Demonstrate thorough understanding of what {comp} builds, their mission, architecture, and current engineering challenges. No generic platitudes.
   - 2. ME (My Achievements): Select 2-3 projects and experiences from the profile that directly provide evidence of your ability to solve their technical needs. Quote project titles in guillemets << Project Title >>. Rewrite and re-angle the achievements specifically for this role—do NOT copy-paste profile descriptions.
   - 3. US (Mutual Value): Detail your immediate operational contribution from day one, connecting your skill set to their codebase, infrastructure, or processes.
   - 4. TOMORROW (Next Step): Availability (graduation internship or immediate availability) and invitation to an in-depth technical interview.
4. Tone: Rigorous, articulate, confident engineer. No cliché filler words.
5. Salutation: Start with "Dear Hiring Team," and conclude with professional sign-off followed by "{full_name}".
6. Completeness: Ensure all thoughts and sentences are fully finished and well-crafted."""
            sys_prompt = "You are an elite engineering application writer. You produce sober, highly technical, deeply targeted cover letters."
        else:
            draft_prompt = f"""Tu es un redacteur d'elite de candidatures d'ingenieurs. Tu rediges comme un responsable technique senior qui comprend intimement le profil de l'ingenieur ET les enjeux techniques de l'entreprise.

PLAN STRATEGIQUE A SUIVRE :
{plan}

=== PROFIL COMPLET DU CANDIDAT (SOURCE DE VERITE) ===
{profile_text}

=== DOSSIER D'ANALYSE PROFONDE DE L'ENTREPRISE & DU POSTE ===
{recon_text}

Entreprise ciblee : {comp}
Poste cible : {role}
Competences cles matchees : {matched_skills_str}

=== REGLES IMPERATIVES DE REDACTION ===
1. Verite et integrite : Utilise UNIQUEMENT les faits reels, formations, experiences et projets du profil ci-dessus. N'invente JAMAIS d'experiences ou de competences non attestees.
2. Specificite maximale : Chaque paragraphe doit etre profondement ancre dans les defis techniques et l'activite de {comp}. Pas de lettre interchangeable.
3. Structure : 4 paragraphes percutants et developpes selon la methode VOUS / MOI / NOUS / DEMAIN :
   - 1. VOUS (L'Entreprise) : Demontre que tu comprends precisement les projets, la mission et l'architecture technique de {comp}. Fais reference aux elements concrets du dossier d'analyse profonde. Pas d'eloge superficiel.
   - 2. MOI (Mes Realisations) : Selectionne 2-3 projets/experiences du candidat qui repondent aux defis du poste. Cite les titres de projets entre guillemets << Titre du Projet >>. Ne fais pas de copier-coller des descriptions brutes : reformule chaque realisation sous l'angle technique qui interesse ce recruteur.
   - 3. NOUS (Valeur Mutuelle) : Expose l'apport operationnel concret des les premieres semaines sur leurs cycles de developpement ou leur infrastructure.
   - 4. DEMAIN (Disponibilite & Entretien) : Disponibilite (stage de fin d'etudes PFE ou embauche selon recherche) et proposition sobre d'un entretien technique.
4. Ton : Rigueur d'ingenieur, vocabulaire precis, style percutant et professionnel. Proscrire les superlatifs creux.
5. Formules : Debute par "Madame, Monsieur," et termine par des salutations professionnelles suivies de "{full_name}".
6. Completude : Developpe des phrases completes et des arguments aboutis sans laisser de texte tronque."""
            sys_prompt = "Tu es un redacteur d'elite de candidatures d'ingenieurs. Tu rediges en francais technique, sobre et rigoureusement personnalise."

        drafting_tokens = 580 if "qwen" in model_name.lower() else 1800
        raw = _call_groq_resilient(
            client=client,
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": draft_prompt},
            ],
            requested_model=model_name,
            target_max_tokens=drafting_tokens,
            temperature=0.25,
        )

        if raw and len(raw) > 150:
            return {"draft_letter": raw}

        return {"errors": ["Le modèle IA rencontre un problème. Réponse trop courte ou incomplète. Veuillez réessayer ultérieurement."]}
    except Exception as e:
        logger.error(f"Drafting phase Groq echouee: {e}")
        return {"errors": ["Le modèle IA rencontre un problème. Veuillez réessayer ultérieurement."]}


def node_sanitize_and_fallback(state: WriterState) -> dict:
    """Noeud 4 : Injections d'entites manquantes et validation finale."""
    if state.get("errors"):
        return {
            "final_letter": "",
            "cliche_score": 0,
            "banned_phrases": [],
            "errors": state.get("errors"),
        }

    draft = state.get("draft_letter") or ""
    job = state.get("job_offer") or {}
    profile = state.get("master_profile") or {}
    lang = state.get("language", "fr")
    is_en = lang == "en"

    # 1. Verification & injection garantie de l'entreprise cible
    comp = (job.get("company") or "").strip()
    if comp and comp.lower() not in ["votre entreprise", "entreprise", "your company"]:
        if comp.lower() not in draft.lower():
            draft_sub = re.sub(
                r"\b(?:[Vv]otre entreprise|[Vv]otre societe|[Yy]our company)\b",
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
                        parts[1] = f"L'opportunite d'integrer {comp} retient toute mon attention. " + parts[1]
                    draft = "\n\n".join(parts)

    # 2. Verification & injection garantie de l'ecole d'ingenieurs
    edu = profile.get("educations", [{}])[0] if profile.get("educations") else {}
    school = (edu.get("school") or "").strip()
    if school and school.lower() not in ["ecole d'ingenieurs", "engineering school"]:
        if school.lower() not in draft.lower():
            if "eleve-ingenieur" in draft:
                draft = draft.replace("eleve-ingenieur", f"eleve-ingenieur a {school}", 1)
            elif "etudiant" in draft:
                draft = draft.replace("etudiant", f"etudiant a {school}", 1)
            elif "engineering student" in draft:
                draft = draft.replace("engineering student", f"engineering student at {school}", 1)
            else:
                parts = draft.split("\n\n")
                if len(parts) >= 2:
                    if is_en:
                        parts[1] = f"Currently an engineering student at {school}, " + parts[1]
                    else:
                        parts[1] = f"Actuellement eleve-ingenieur a {school}, " + parts[1]
                    draft = "\n\n".join(parts)

    return {
        "final_letter": draft,
        "cliche_score": 0,
        "banned_phrases": [],
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
    """Point d'entree synchrone pour executer l'Agent Redacteur LangGraph."""
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

    if final_state.get("errors") or not final_state.get("final_letter"):
        err_msg = (final_state.get("errors") or ["Le modèle IA rencontre un problème. Veuillez réessayer ultérieurement."])[0]
        raise RuntimeError(err_msg)

    job_data = final_state.get("job_offer") or {}
    role = job_data.get("title", "Ingenieur")
    company = job_data.get("company", "Entreprise")

    letter = CoverLetter(
        job_id=job_id,
        profile_id="default-profile",
        target_role=role,
        company_name=company,
        content_markdown=final_state.get("final_letter", ""),
        cliche_score=0,
        thinking_plan=final_state.get("thinking_plan"),
        language=language,
        user_id=user_id,
    )
    letter.banned_phrases_detected = []
    return letter

