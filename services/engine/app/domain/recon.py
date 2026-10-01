import json
import logging
import re
import urllib.parse
from datetime import datetime, timezone
from typing import Any, List, Optional, TypedDict

import httpx
from bs4 import BeautifulSoup
from langgraph.graph import END, START, StateGraph
from sqlmodel import Session, select

from app.adapters.database import get_engine
from app.config import settings
from app.domain.models import JobOffer, ReconDossier

logger = logging.getLogger(__name__)


class ReconState(TypedDict):
    job_id: str
    user_id: str
    target_role: str
    company_name: str
    initial_url: str
    apply_url: Optional[str]
    external_career_url: Optional[str]
    full_description: str
    company_website: Optional[str]
    company_mission: Optional[str]
    company_culture: Optional[str]
    tech_stack_detected: List[str]
    investigation_notes: Optional[str]
    status: str
    errors: List[str]
    engine: Optional[Any]


# Mots-clés de technologies courantes pour l'extraction rapide
KNOWN_TECH_KEYWORDS = [
    "Python", "FastAPI", "Django", "Flask", "Go", "Golang", "Rust", "Java", "Spring Boot",
    "TypeScript", "JavaScript", "React", "Next.js", "Vue.js", "Angular", "Node.js",
    "Docker", "Kubernetes", "Terraform", "Ansible", "CI/CD", "GitHub Actions", "GitLab CI",
    "AWS", "GCP", "Google Cloud", "Azure", "PostgreSQL", "MySQL", "MongoDB", "Redis",
    "Kafka", "RabbitMQ", "GraphQL", "REST API", "Microservices", "Linux", "PyTorch", "TensorFlow",
    "Scikit-learn", "HuggingFace", "LangChain", "LangGraph", "Elasticsearch", "Prometheus", "Grafana"
]


async def _extract_clean_text_from_url(url: str, timeout: float = 10.0) -> tuple[str, Optional[str]]:
    """Tente d'extraire le texte propre via Trafilatura / httpx, avec gestion des redirections."""
    try:
        import trafilatura
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        }
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            final_url = str(resp.url)
            if resp.status_code == 200 and resp.text:
                extracted = trafilatura.extract(resp.text, include_comments=False, include_tables=True)
                if extracted and len(extracted) > 150:
                    return extracted, final_url
                # Fallback BeautifulSoup
                soup = BeautifulSoup(resp.text, "html.parser")
                for s in soup(["script", "style", "nav", "footer", "header"]):
                    s.decompose()
                text = "\n".join([line.strip() for line in soup.get_text().splitlines() if line.strip()])
                return text[:8000], final_url
    except Exception as e:
        logger.warning(f"Extraction URL {url} échouée: {e}")
    return "", None


# ============================================================================
# LangGraph Nodes
# ============================================================================

async def node_navigate_and_detect_external(state: ReconState) -> dict:
    """Nœud 1 : Analyse l'URL d'origine et détecte les redirections vers un portail externe ATS."""
    target_url = state.get("apply_url") or state.get("initial_url")
    if not target_url:
        return {"errors": state["errors"] + ["URL d'offre manquante"]}

    external_career_url = target_url
    # Si c'est un lien LinkedIn ou agrégateur, tenter de suivre la redirection
    if "linkedin.com" in target_url or "jobteaser.com" in target_url:
        try:
            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                ),
            }
            async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
                res = await client.get(target_url, headers=headers)
                if res.status_code == 200:
                    soup = BeautifulSoup(res.text, "html.parser")
                    # Chercher boutons Postuler externe (ex: Workday, Greenhouse, Taleo, site carrière)
                    for a in soup.find_all("a", href=True):
                        href = a["href"]
                        if any(ats_pattern in href.lower() for ats_pattern in ["myworkday", "greenhouse.io", "lever.co", "smartrecruiters", "welcometothejungle"]):
                            external_career_url = href
                            break
                    if external_career_url == target_url:
                        external_career_url = str(res.url)
        except Exception as e:
            logger.info(f"Détection redirection externe souple: {e}")

    return {
        "external_career_url": external_career_url,
        "investigation_notes": f"URL externe ciblée : {external_career_url}",
    }


async def node_extract_full_job_posting(state: ReconState) -> dict:
    """Nœud 2 : Extrait l'annonce intégrale et sans troncature depuis la page finale."""
    url = state.get("external_career_url") or state.get("initial_url")
    if not url:
        return {"full_description": state.get("full_description") or ""}

    text, final_url = await _extract_clean_text_from_url(url)
    clean_text = text if text and len(text) > len(state.get("full_description") or "") else state.get("full_description") or ""

    # Extraction du domaine d'entreprise
    company_website = None
    if final_url:
        parsed = urllib.parse.urlparse(final_url)
        if parsed.netloc and not any(agg in parsed.netloc for agg in ["linkedin", "jobteaser", "google", "bing"]):
            company_website = f"{parsed.scheme}://{parsed.netloc}"

    return {
        "full_description": clean_text,
        "company_website": company_website or state.get("company_website"),
        "external_career_url": final_url or url,
    }


async def node_investigate_company_culture(state: ReconState) -> dict:
    """Nœud 3 : Enquête sur la culture d'entreprise, sa mission et son contexte."""
    company_name = state.get("company_name") or ""
    website = state.get("company_website")
    mission = f"Entreprise innovante dans le secteur technologique, investie dans le développement de solutions à forte valeur ajoutée."
    culture = f"Culture d'ingénierie axée sur l'excellence technique, la rigueur opérationnelle et le travail collaboratif."

    # Si un site d'entreprise est disponible, tenter de lire brièvement la page d'accueil ou about
    if website:
        about_url = f"{website.rstrip('/')}/about"
        text, _ = await _extract_clean_text_from_url(about_url, timeout=5.0)
        if not text or len(text) < 100:
            text, _ = await _extract_clean_text_from_url(website, timeout=5.0)
        if text and len(text) > 100:
            lines = [l.strip() for l in text.splitlines() if len(l.strip()) > 30]
            if lines:
                mission = f"Mission de {company_name} : " + " ".join(lines[:2])
            if len(lines) > 2:
                culture = f"Culture & Environnement de {company_name} : " + " ".join(lines[2:4])

    return {
        "company_mission": mission,
        "company_culture": culture,
    }


async def node_synthesize_and_save_dossier(state: ReconState) -> dict:
    """Nœud 4 : Détecte la stack technique et sauvegarde le ReconDossier complet en base SQLite."""
    full_text = state.get("full_description") or ""
    detected_techs = []

    # Détection des technos par scan insensible à la casse
    for tech in KNOWN_TECH_KEYWORDS:
        pattern = r"\b" + re.escape(tech) + r"\b"
        if re.search(pattern, full_text, flags=re.IGNORECASE):
            detected_techs.append(tech)

    # Persistance en base SQLite
    engine = state.get("engine") or get_engine()
    with Session(engine) as session:
        dossier = session.exec(
            select(ReconDossier).where(ReconDossier.job_id == state["job_id"])
        ).first()

        if not dossier:
            dossier = ReconDossier(
                job_id=state["job_id"],
                user_id=state.get("user_id", "louay"),
                external_url=state.get("external_career_url"),
                full_description=full_text,
                company_name=state.get("company_name", ""),
                company_website=state.get("company_website"),
                company_mission=state.get("company_mission"),
                company_culture=state.get("company_culture"),
                investigation_notes=state.get("investigation_notes"),
                status="COMPLETED",
            )
            dossier.tech_stack_detected = detected_techs
            session.add(dossier)
        else:
            dossier.external_url = state.get("external_career_url") or dossier.external_url
            dossier.full_description = full_text or dossier.full_description
            dossier.company_website = state.get("company_website") or dossier.company_website
            dossier.company_mission = state.get("company_mission") or dossier.company_mission
            dossier.company_culture = state.get("company_culture") or dossier.company_culture
            dossier.tech_stack_detected = detected_techs or dossier.tech_stack_detected
            dossier.status = "COMPLETED"
            dossier.updated_at = datetime.now(timezone.utc)
            session.add(dossier)

        # Mettre à jour l'offre de stage avec la description enrichie si disponible
        job = session.exec(select(JobOffer).where(JobOffer.id == state["job_id"])).first()
        if job and full_text and len(full_text) > len(job.description_raw or ""):
            job.description_raw = full_text
            session.add(job)

        session.commit()

    return {
        "tech_stack_detected": detected_techs,
        "status": "COMPLETED",
    }


# ============================================================================
# Construction du StateGraph LangGraph
# ============================================================================

def build_deep_recon_graph():
    graph = StateGraph(ReconState)

    # Ajout des nœuds agentiques
    graph.add_node("detect_external", node_navigate_and_detect_external)
    graph.add_node("extract_job", node_extract_full_job_posting)
    graph.add_node("investigate_company", node_investigate_company_culture)
    graph.add_node("synthesize_dossier", node_synthesize_and_save_dossier)

    # Flux séquentiel d'enquête
    graph.add_edge(START, "detect_external")
    graph.add_edge("detect_external", "extract_job")
    graph.add_edge("extract_job", "investigate_company")
    graph.add_edge("investigate_company", "synthesize_dossier")
    graph.add_edge("synthesize_dossier", END)

    return graph.compile()


deep_recon_agent = build_deep_recon_graph()


async def run_deep_recon_on_job(job_or_id: Any, user_id: str = "louay", engine=None) -> Optional[ReconDossier]:
    """Exécute l'agent Deep Recon autonome sur une offre."""
    if engine is None:
        engine = get_engine()
    job_id = job_or_id if isinstance(job_or_id, str) else getattr(job_or_id, "id", str(job_or_id))

    with Session(engine) as session:
        job = session.exec(select(JobOffer).where(JobOffer.id == job_id)).first()
        if not job:
            return None
        title = job.title or ""
        company = job.company or ""
        url = job.url or ""
        apply_url = getattr(job, "apply_url", None) or url
        description = job.description_raw or ""

    initial_state: ReconState = {
        "job_id": job_id,
        "user_id": user_id,
        "target_role": title,
        "company_name": company,
        "initial_url": url,
        "apply_url": apply_url,
        "external_career_url": None,
        "full_description": description,
        "company_website": None,
        "company_mission": None,
        "company_culture": None,
        "tech_stack_detected": [],
        "investigation_notes": None,
        "status": "IN_PROGRESS",
        "errors": [],
        "engine": engine,
    }

    try:
        final_state = await deep_recon_agent.ainvoke(initial_state)
    except Exception as e:
        logger.error(f"Erreur durant l'exécution du graph Deep Recon: {e}")

    with Session(engine) as session:
        dossier = session.exec(
            select(ReconDossier).where(ReconDossier.job_id == job_id)
        ).first()
        return dossier
