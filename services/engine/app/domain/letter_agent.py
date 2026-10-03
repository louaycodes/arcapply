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

# Regles anti-cliches d'ingenieur
CLICHE_RULES = [
    (r"\bdynamique et motiv[eé]e?s?\b", "rigoureux et methodique"),
    (r"\benthousiaste à l'idée de\b", "particulierement attentif a"),
    (r"\bcandidat id[eé]al\b", "profil aligne avec vos exigences"),
    (r"\bopportunit[eé] r[eé]v[eé]e\b", "opportunite ciblee"),
    (r"\bpassionn[eé] depuis (?:mon plus jeune âge|toujours)\b", "fortement engage dans la pratique du genie logiciel"),
    (r"\bsynergie\b", "collaboration technique"),
    (r"\bvivement int[eé]ress[eé]e?\b", "interesse"),
    (r"\bmettre à profit mes comp[eé]tences\b", "contribuer activement a vos developpements"),
    (r"\b(?:au sein de )?votre prestigieuse (?:entreprise|société|agence)\b", "vos equipes"),
    (r"\brelever des d[eé]fis stimulants\b", "resoudre ces problematiques techniques"),
    (r"\brelever ce challenge\b", "mener ce projet a bien"),
    (r"\bamour pour\b", "interet marque pour"),
    (r"\bparfaite ad[eé]quation\b", "adequation concrete"),
    (r"\bforce de proposition\b", "analytique et methodique"),
    (r"\bsoif d'apprendre\b", "volonte d'approfondissement technique"),
    (r"\bcouteau suisse\b", "ingenieur polyvalent"),
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
        # Truncate intelligemment pour rester dans les limites token
        lines.append(f"Description integrale de l'offre :\n{full_desc[:4000]}")

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
    """Noeud 2 : Phase de raisonnement strategique — analyse croisee profil/offre/recon pour identifier
    les points d'accroche uniques a cette offre et construire un plan d'argumentation sur-mesure."""
    api_key = settings.effective_groq_api_key
    lang = state.get("language", "fr")
    is_en = lang == "en"

    job = state.get("job_offer") or {}
    recon = state.get("recon_dossier") or {}
    profile = state.get("master_profile") or {}
    rules = state.get("active_playbook_rules") or []
    ats = state.get("ats_match") or {}

    # Serialisation complete du profil et du dossier recon
    profile_text = _serialize_full_profile(profile, lang)
    recon_text = _serialize_recon_dossier(recon)

    matched_skills = ats.get("matched_skills", [])
    missing_skills = ats.get("missing_skills", [])

    if api_key:
        try:
            from groq import Groq
            client = Groq(api_key=api_key, timeout=15.0)

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

=== ALIGNEMENT ATS ===
Competences matchees : {', '.join(matched_skills) if matched_skills else 'Aucune'}
Competences manquantes (NE PAS MENTIONNER) : {', '.join(missing_skills) if missing_skills else 'Aucune'}

=== DIRECTIVES DU PLAYBOOK ===
{rules_text or 'Aucune regle personnalisee.'}

=== CONSIGNE ===
Produis un plan d'attaque strategique en 5 points SPECIFIQUES a cette offre :
1. Besoin reel de l'entreprise : Qu'est-ce que {job.get('company', 'cette entreprise')} cherche VRAIMENT pour ce poste ? Quels sont les enjeux concrets ?
2. Points d'accroche uniques : Quels elements SPECIFIQUES de l'offre ou de l'entreprise (mission, culture, stack, projets) peuvent servir d'ancrage dans la lettre ?
3. Selection strategique des realisations : Quels projets/experiences du candidat resonnent le PLUS avec cette offre et POURQUOI ? Pour chaque choisi, indique l'angle de presentation.
4. Arguments differenciants : Qu'est-ce qui distingue ce candidat pour CE poste precis (pas un poste generique) ?
5. Structure argumentative Vous/Moi/Nous/Demain : Le fil conducteur specifique a cette candidature.

IMPORTANT : Pas de generalites. Chaque point doit mentionner des elements concrets de l'offre ou du profil."""

            resp = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "Tu es un stratege senior en recrutement d'ingenieurs. Tu raisonnes avec une rigueur absolue et une specificite maximale."},
                    {"role": "user", "content": thinking_prompt},
                ],
                model=settings.effective_groq_model,
                temperature=0.3,
                max_tokens=450,
            )
            plan = (resp.choices[0].message.content or "").strip()
            if plan:
                return {"thinking_plan": plan}
        except Exception as e:
            logger.warning(f"Thinking phase Groq echouee: {e}")

    # Fallback Thinking Plan structure
    comp = job.get("company", "l'entreprise")
    role = job.get("title", "Ingenieur Logiciel")
    top_proj = profile.get("projects", [{}])[0].get("title", "Projet Technique") if profile.get("projects") else "Projet Technique"
    recon_mission = recon.get("company_mission", "")
    recon_stack = ", ".join(recon.get("tech_stack_detected", []))

    plan = f"""### Plan d'attaque strategique de l'Agent
1. Diagnostic du besoin : {comp} recherche un profil solide pour {role}. Mission : {recon_mission[:200] if recon_mission else 'N/A'}. Stack detectee : {recon_stack or 'non identifiee'}.
2. Points d'accroche : stack technique de l'entreprise, culture d'ingenierie, enjeux du poste.
3. Projet priorise : << {top_proj} >> dont la realisation technique prouve la competence operationnelle.
4. Argument differenciateur : experience concrete et polyvalence technique demontree par les projets.
5. Schema narratif : Vous (enjeux {comp}) / Moi (projets cles) / Nous (apport operationnel) / Demain (disponibilite)."""

    return {"thinking_plan": plan}


def node_drafting_phase(state: WriterState) -> dict:
    """Noeud 3 : Redaction integrale de la lettre par le LLM, guidee par le Thinking Plan et le dossier recon.
    Chaque lettre est UNIQUE : pas de copier-coller du profil, pas de formules generiques."""
    api_key = settings.effective_groq_api_key
    lang = state.get("language", "fr")
    is_en = lang == "en"

    job = state.get("job_offer") or {}
    recon = state.get("recon_dossier") or {}
    profile = state.get("master_profile") or {}
    plan = state.get("thinking_plan") or ""
    ats = state.get("ats_match") or {}

    missing_skills = ats.get("missing_skills", [])
    matched_skills = ats.get("matched_skills", [])

    missing_prohibition = ""
    if missing_skills:
        missing_str = ", ".join(missing_skills)
        missing_prohibition = f"INTERDICTION ABSOLUE de mentionner ces competences que le candidat NE POSSEDE PAS : {missing_str}."

    full_name = profile.get("full_name", "Candidat")
    edu = profile.get("educations", [{}])[0] if profile.get("educations") else {}
    school = edu.get("school", "ecole d'ingenieurs")
    degree = edu.get("degree_fr" if not is_en else "degree_en") or edu.get("degree", "Ingenieur")
    comp = job.get("company", "votre entreprise")
    role = job.get("title", "Ingenieur")
    matched_skills_str = ", ".join(matched_skills[:5]) if matched_skills else "Python, architecture logicielle"

    # Serialisation complete pour le LLM redacteur
    profile_text = _serialize_full_profile(profile, lang)
    recon_text = _serialize_recon_dossier(recon)

    if api_key:
        try:
            from groq import Groq
            client = Groq(api_key=api_key, timeout=15.0)

            if is_en:
                draft_prompt = f"""You are an elite engineering cover letter writer. You write like a human recruiter who deeply understands both the candidate's profile and the company's needs.

STRATEGIC PLAN TO FOLLOW:
{plan}

=== COMPLETE CANDIDATE PROFILE (ZERO HALLUCINATION — USE ONLY THESE FACTS) ===
{profile_text}

=== COMPLETE COMPANY & JOB INTELLIGENCE (DEEP RECON) ===
{recon_text}

Target Company: {comp}
Target Role: {role}
Verified Matched Skills: {matched_skills_str}
{missing_prohibition}

=== WRITING DIRECTIVES ===

STRUCTURE: 4 paragraphs following YOU / ME / US / TOMORROW:

1. YOU (The Company): Demonstrate that you UNDERSTAND what {comp} does and what they need for this role. Reference SPECIFIC elements from the Deep Recon (their mission, their tech stack, their challenges). Do NOT write generic praise — show genuine understanding of their work.

2. ME (My Achievements): Select 2-3 projects/experiences from the profile that DIRECTLY answer the company's needs. Do NOT copy-paste descriptions. REWRITE each achievement to highlight the specific angle that matters for THIS position. Link each to concrete technologies from the matched skills.

3. US (Mutual Value): Explain the SPECIFIC contribution you would bring from day one. Reference concrete technical areas from the job description where your experience creates immediate value.

4. TOMORROW: Availability (6 months graduation internship) and invitation to a technical interview.

CRITICAL RULES:
- Each argument must be SPECIFIC to {comp} and this role — not recyclable for another company
- Quote project titles in guillemets << Project Title >>
- NEVER invent facts, statistics, or companies
- Write in a sober, professional, factual tone — no AI buzzwords
- Begin with "Dear Hiring Team," and end with "Sincerely,\n\n{full_name}"
- Target 280-320 words. Complete every sentence."""
                sys_prompt = "You are an elite software engineering application writer. You write sober, impactful, and deeply personalized cover letters. You never use generic formulations."
            else:
                draft_prompt = f"""Tu es un redacteur d'elite de candidatures d'ingenieurs. Tu ecris comme un recruteur senior qui comprend intimement le profil du candidat ET les besoins de l'entreprise.

PLAN STRATEGIQUE A SUIVRE :
{plan}

=== PROFIL COMPLET DU CANDIDAT (ZERO HALLUCINATION — UTILISE UNIQUEMENT CES FAITS) ===
{profile_text}

=== INTELLIGENCE COMPLETE SUR L'ENTREPRISE & L'OFFRE (DEEP RECON) ===
{recon_text}

Entreprise ciblee : {comp}
Poste cible : {role}
Competences verifiees matchees : {matched_skills_str}
{missing_prohibition}

=== DIRECTIVES DE REDACTION ===

STRUCTURE : 4 paragraphes selon la methode VOUS / MOI / NOUS / DEMAIN :

1. VOUS (L'Entreprise) : Demontre que tu COMPRENDS ce que fait {comp} et ce qu'ils cherchent pour ce poste. Reference des elements SPECIFIQUES du dossier Deep Recon (leur mission, leur stack, leurs enjeux). PAS de flatterie generique — montre une comprehension reelle de leur activite.

2. MOI (Mes Realisations) : Selectionne 2-3 projets/experiences du profil qui REPONDENT DIRECTEMENT aux besoins de l'entreprise. NE PAS copier-coller les descriptions du profil. REFORMULE chaque realisation pour mettre en avant l'angle specifique qui compte pour CE poste. Relie chaque realisation aux technologies du poste.

3. NOUS (Valeur Mutuelle) : Explique l'apport CONCRET et SPECIFIQUE que le candidat ferait des le premier jour. Reference des domaines techniques precis de l'offre ou l'experience du candidat cree une valeur immediate.

4. DEMAIN : Disponibilite (stage PFE 6 mois) et invitation sobre a un entretien technique.

REGLES CRITIQUES :
- Chaque argument doit etre SPECIFIQUE a {comp} et ce role — pas reutilisable pour une autre entreprise
- Cite les titres de projets entre guillemets << Titre du Projet >>
- NE JAMAIS inventer de faits, statistiques ou entreprises
- Ton sobre, professionnel et factuel — aucun cliche d'IA
- Debute par "Madame, Monsieur," et termine par les salutations professionnelles suivies de "{full_name}"
- Vise 280-320 mots. Acheve chaque phrase entierement."""
                sys_prompt = "Tu es un redacteur d'elite de candidatures d'ingenieurs. Tu rediges en francais sobre, percutant et profondement personnalise. Tu ne recycles jamais de formulations generiques."

            resp = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": draft_prompt},
                ],
                model=settings.effective_groq_model,
                temperature=0.25,
                max_tokens=900,
            )

            choice = resp.choices[0]
            finish_reason = getattr(choice, "finish_reason", None)
            if finish_reason == "length":
                logger.warning("Rejet generation IA : la generation a ete tronquee. Repli deterministe.")
            else:
                raw = (choice.message.content or "").strip()
                if raw and len(raw) > 150:
                    # Anti-hallucination check on missing skills
                    lower_raw = raw.lower()
                    hallucinated = any(len(m) > 2 and m.lower() in lower_raw for m in missing_skills)
                    if not hallucinated:
                        return {"draft_letter": raw}
                    else:
                        logger.warning("Rejet generation Groq : detection d'une competence manquante hallucinee. Repli deterministe.")
        except Exception as e:
            logger.warning(f"Drafting phase Groq echouee: {e}")

    # Fallback deterministe structure
    top_proj = profile.get("projects", [{}])[0].get("title", "Projet d'ingenierie") if profile.get("projects") else "Projet d'ingenierie"
    skills_cite = matched_skills_str or "Python"
    recon_mission = recon.get("company_mission", "")
    mission_snippet = f" Votre engagement en matiere de {recon_mission[:100].rstrip('.')}," if recon_mission else ""

    if is_en:
        fallback = f"""Dear Hiring Team,

Currently an engineering student at {school}, I am actively seeking my 6-month graduation internship (PFE). The opportunity to join {comp} as {role} caught my immediate attention.{' ' + mission_snippet.strip() if mission_snippet else ''} Your technical standards and development challenges align precisely with my engineering profile.

Among my achievements directly relevant to this position, I engineered << {top_proj} >>, implementing robust software design principles with {skills_cite}. This hands-on experience demonstrates my ability to deliver production-grade solutions.

By joining your team, I will bring an immediate operational contribution to your development cycles with thorough attention to code quality, system resilience, and engineering best practices in {skills_cite}.

Available for a 6-month duration, I would be pleased to discuss my background and projects during a technical interview.

Sincerely,

{full_name}"""
    else:
        fallback = f"""Madame, Monsieur,

Actuellement eleve-ingenieur a {school}, je recherche activement mon projet de fin d'etudes (PFE) d'une duree de 6 mois. L'opportunite d'integrer {comp} au poste de {role} a retenu toute mon attention.{mission_snippet} Vos exigences techniques et vos enjeux de developpement correspondent precisement a mon profil d'ingenieur.

Parmi mes realisations directement liees a ce poste, j'ai developpe << {top_proj} >>, en mettant en oeuvre une architecture logicielle rigoureuse avec {skills_cite}. Cette experience operationnelle demontre ma capacite a livrer des solutions robustes.

En rejoignant vos equipes, je souhaite apporter une contribution concrete sur vos developpements en {skills_cite}, avec une attention constante a la qualite du code et a la robustesse des systemes.

Disponible des le premier semestre pour une duree de 6 mois, je serais ravi d'echanger avec vous lors d'un entretien technique.

Je vous prie d'agreer, Madame, Monsieur, l'expression de mes salutations distinguees.

{full_name}"""

    return {"draft_letter": fallback}


def node_sanitize_and_fallback(state: WriterState) -> dict:
    """Noeud 4 : Injections d'entites manquantes, filtrage anti-cliches et validation finale."""
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

    job_data = final_state.get("job_offer") or {}
    role = job_data.get("title", "Ingenieur")
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
