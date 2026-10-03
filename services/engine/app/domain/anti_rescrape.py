import logging
import re
import unicodedata
from typing import Any, Dict, Optional
from urllib.parse import urlparse
from sqlmodel import Session, select

from app.domain.models import AppliedJobSignature, ArchivedJobSignature, JobOffer, utc_now

logger = logging.getLogger(__name__)


def clean_text_for_match(text: Optional[str]) -> str:
    """
    Normalise une chaîne pour comparaison robuste (minuscules, sans accents, sans ponctuation).
    """
    if not text:
        return ""
    # Décomposition Unicode pour retirer les accents
    nfkd_form = unicodedata.normalize("NFKD", text)
    only_ascii = "".join([c for c in nfkd_form if not unicodedata.combining(c)])
    # Minuscule et extraction des mots alphanumériques
    cleaned = re.sub(r"[^\w\s]", " ", only_ascii.lower())
    # Normalisation des espaces
    return " ".join(cleaned.split())


def titles_match(t1: str, t2: str) -> bool:
    """
    Compare deux titres nettoyés pour détecter une équivalence ou une inclusion sémantique
    en filtrant les mots d'arrêt génériques (stage, pfe, ingénieur, etc.).
    """
    if not t1 or not t2:
        return False
    if t1 == t2 or t1 in t2 or t2 in t1:
        return True
    stop_words = {"stage", "pfe", "internship", "intern", "ingenieur", "engineer", "de", "du", "et", "en", "pour", "la", "le"}
    tokens1 = set(t1.split()) - stop_words
    tokens2 = set(t2.split()) - stop_words
    if tokens1 and tokens2 and (tokens1.issubset(tokens2) or tokens2.issubset(tokens1)):
        return True
    return False


def normalize_job_url(url: Optional[str]) -> str:
    """
    Nettoie et normalise une URL pour comparaison sans biais de tracking (UTM, session, trailing slash).
    """
    if not url or not url.strip():
        return ""
    try:
        parsed = urlparse(url.strip())
        netloc = parsed.netloc.lower().replace("www.", "")
        path = parsed.path.rstrip("/")
        return f"{netloc}{path}"
    except Exception:
        return url.strip().lower().rstrip("/")


def record_applied_signature(session: Session, job: JobOffer) -> AppliedJobSignature:
    """
    Enregistre de manière pérenne la signature d'une offre postulée.
    Cette empreinte garantit qu'aucun crawler ne réinsérera ou ne re-scrappera ce poste.
    """
    company_clean = clean_text_for_match(job.company)
    title_clean = clean_text_for_match(job.title)
    url_norm = normalize_job_url(job.apply_url or job.url)

    # Vérification d'une signature existante pour ce job
    statement = select(AppliedJobSignature).where(
        AppliedJobSignature.user_id == job.user_id,
        AppliedJobSignature.job_id == job.id,
    )
    sig = session.exec(statement).first()

    if not sig:
        sig = AppliedJobSignature(
            user_id=job.user_id,
            job_id=job.id,
            platform=job.platform,
            external_id=job.external_id,
            company_clean=company_clean,
            title_clean=title_clean,
            url_normalized=url_norm if url_norm else None,
            applied_at=job.applied_at or utc_now(),
        )
        session.add(sig)
    else:
        sig.company_clean = company_clean
        sig.title_clean = title_clean
        sig.url_normalized = url_norm if url_norm else sig.url_normalized
        sig.applied_at = job.applied_at or utc_now()
        session.add(sig)

    session.commit()
    session.refresh(sig)
    return sig


def remove_applied_signature(session: Session, user_id: str, job_id: str) -> None:
    """
    Supprime la signature d'offre postulée si l'utilisateur annule le marquage.
    """
    statement = select(AppliedJobSignature).where(
        AppliedJobSignature.user_id == user_id,
        AppliedJobSignature.job_id == job_id,
    )
    signatures = session.exec(statement).all()
    for sig in signatures:
        session.delete(sig)
    session.commit()


def is_job_already_applied(session: Session, user_id: str, raw_job: Dict[str, Any]) -> bool:
    """
    Vérifie si une offre brute issue d'un scraper/connecteur a déjà fait l'objet d'une candidature
    par l'utilisateur. Si c'est le cas, elle doit être immédiatement ignorée et JAMAIS insérée.

    Critères d'exclusion :
    1. Correspondance exacte sur (plateforme, external_id) dans les signatures ou offres postulées.
    2. Correspondance sur URL nettoyée (sans paramètres de tracking).
    3. Correspondance sémantique stricte sur Entreprise normalisée + similarité du Titre de poste.
    """
    platform = raw_job.get("platform", "")
    external_id = raw_job.get("external_id", "")
    company_raw = raw_job.get("company", "")
    title_raw = raw_job.get("title", "")
    url_raw = raw_job.get("url", "")
    apply_url_raw = raw_job.get("apply_url", "")

    company_clean = clean_text_for_match(company_raw)
    title_clean = clean_text_for_match(title_raw)
    url_norm = normalize_job_url(apply_url_raw or url_raw)

    # 1. Vérification contre les signatures persistantes
    # 1.a Par (platform, external_id)
    if platform and external_id:
        sig_by_ext = session.exec(
            select(AppliedJobSignature).where(
                AppliedJobSignature.user_id == user_id,
                AppliedJobSignature.platform == platform,
                AppliedJobSignature.external_id == external_id,
            )
        ).first()
        if sig_by_ext:
            logger.info(f"[Bouclier Anti-Rescrape] Ignoré par signature external_id: '{title_raw}' ({platform}:{external_id})")
            return True

    # 1.b Par URL normalisée
    if url_norm:
        sig_by_url = session.exec(
            select(AppliedJobSignature).where(
                AppliedJobSignature.user_id == user_id,
                AppliedJobSignature.url_normalized == url_norm,
            )
        ).first()
        if sig_by_url:
            logger.info(f"[Bouclier Anti-Rescrape] Ignoré par signature URL: '{title_raw}' ({url_norm})")
            return True

    # 1.c Par correspondance Entreprise + Titre
    if company_clean and title_clean:
        signatures = session.exec(
            select(AppliedJobSignature).where(
                AppliedJobSignature.user_id == user_id,
                AppliedJobSignature.company_clean == company_clean,
            )
        ).all()
        for sig in signatures:
            if titles_match(sig.title_clean, title_clean):
                logger.info(
                    f"[Bouclier Anti-Rescrape] Ignoré par signature entreprise/poste : '{title_raw}' chez '{company_raw}'."
                )
                return True

    # 2. Vérification contre les offres existantes déjà marquées comme postulées
    # (is_applied == True ou status in ('SUBMITTED', 'INTERVIEW', 'OFFER'))
    statement = select(JobOffer).where(
        JobOffer.user_id == user_id,
        (JobOffer.is_applied == True) | (JobOffer.status.in_(["SUBMITTED", "INTERVIEW", "OFFER"])),
    )
    applied_jobs = session.exec(statement).all()

    for job in applied_jobs:
        # Correspondance exacte platform + external_id
        if platform and external_id and job.platform == platform and job.external_id == external_id:
            logger.info(f"[Bouclier Anti-Rescrape] Déjà postulé (external_id existant): '{title_raw}' ({job.id})")
            return True

        # Correspondance URL
        if url_norm:
            job_url_norm = normalize_job_url(job.apply_url or job.url)
            if job_url_norm and job_url_norm == url_norm:
                logger.info(f"[Bouclier Anti-Rescrape] Déjà postulé (URL existante): '{title_raw}' ({job.id})")
                return True

        # Correspondance entreprise + titre
        job_company_clean = clean_text_for_match(job.company)
        job_title_clean = clean_text_for_match(job.title)
        if company_clean and job_company_clean == company_clean:
            if titles_match(title_clean, job_title_clean):
                logger.info(
                    f"[Bouclier Anti-Rescrape] Déjà postulé (Entreprise/Titre existant): '{title_raw}' chez '{company_raw}' ({job.id})"
                )
                return True

    return False


def record_archived_signature(session: Session, job: JobOffer) -> ArchivedJobSignature:
    """
    Enregistre de manière pérenne la signature d'une offre archivée par le candidat.
    Cette empreinte garantit qu'aucun crawler ne réinsérera ou ne re-scrappera ce poste.
    """
    company_clean = clean_text_for_match(job.company)
    title_clean = clean_text_for_match(job.title)
    url_norm = normalize_job_url(job.apply_url or job.url)

    statement = select(ArchivedJobSignature).where(
        ArchivedJobSignature.user_id == job.user_id,
        ArchivedJobSignature.job_id == job.id,
    )
    sig = session.exec(statement).first()

    if not sig:
        sig = ArchivedJobSignature(
            user_id=job.user_id,
            job_id=job.id,
            platform=job.platform,
            external_id=job.external_id,
            company_clean=company_clean,
            title_clean=title_clean,
            url_normalized=url_norm if url_norm else None,
            archived_at=utc_now(),
        )
        session.add(sig)
    else:
        sig.company_clean = company_clean
        sig.title_clean = title_clean
        sig.url_normalized = url_norm if url_norm else sig.url_normalized
        sig.archived_at = utc_now()
        session.add(sig)

    session.commit()
    session.refresh(sig)
    return sig


def remove_archived_signature(session: Session, user_id: str, job_id: str) -> None:
    """
    Supprime la signature d'offre archivée si l'offre est désarchivée ou réactivée.
    """
    statement = select(ArchivedJobSignature).where(
        ArchivedJobSignature.user_id == user_id,
        ArchivedJobSignature.job_id == job_id,
    )
    signatures = session.exec(statement).all()
    for sig in signatures:
        session.delete(sig)
    session.commit()


def is_job_already_archived(session: Session, user_id: str, raw_job: Dict[str, Any]) -> bool:
    """
    Vérifie si une offre brute issue d'un scraper/connecteur a déjà été archivée
    par l'utilisateur. Si c'est le cas, elle doit être immédiatement ignorée et JAMAIS réinsérée.

    Critères d'exclusion :
    1. Correspondance exacte sur (plateforme, external_id) dans les signatures d'archives.
    2. Correspondance sur URL nettoyée (sans paramètres de tracking).
    3. Correspondance sémantique stricte sur Entreprise normalisée + similarité du Titre de poste.
    4. Correspondance avec toute offre en base ayant le statut 'ARCHIVED'.
    """
    platform = raw_job.get("platform", "")
    external_id = raw_job.get("external_id", "")
    company_raw = raw_job.get("company", "")
    title_raw = raw_job.get("title", "")
    url_raw = raw_job.get("url", "")
    apply_url_raw = raw_job.get("apply_url", "")

    company_clean = clean_text_for_match(company_raw)
    title_clean = clean_text_for_match(title_raw)
    url_norm = normalize_job_url(apply_url_raw or url_raw)

    # 1. Vérification contre les signatures persistantes d'archives
    # 1.a Par (platform, external_id)
    if platform and external_id:
        sig_by_ext = session.exec(
            select(ArchivedJobSignature).where(
                ArchivedJobSignature.user_id == user_id,
                ArchivedJobSignature.platform == platform,
                ArchivedJobSignature.external_id == external_id,
            )
        ).first()
        if sig_by_ext:
            logger.info(f"[Bouclier Anti-Rescrape] Ignoré par archive (external_id): '{title_raw}' ({platform}:{external_id})")
            return True

    # 1.b Par URL normalisée
    if url_norm:
        sig_by_url = session.exec(
            select(ArchivedJobSignature).where(
                ArchivedJobSignature.user_id == user_id,
                ArchivedJobSignature.url_normalized == url_norm,
            )
        ).first()
        if sig_by_url:
            logger.info(f"[Bouclier Anti-Rescrape] Ignoré par archive (URL): '{title_raw}' ({url_norm})")
            return True

    # 1.c Par correspondance Entreprise + Titre
    if company_clean and title_clean:
        signatures = session.exec(
            select(ArchivedJobSignature).where(
                ArchivedJobSignature.user_id == user_id,
                ArchivedJobSignature.company_clean == company_clean,
            )
        ).all()
        for sig in signatures:
            if titles_match(sig.title_clean, title_clean):
                logger.info(
                    f"[Bouclier Anti-Rescrape] Ignoré par archive (Entreprise/Titre): '{title_raw}' chez '{company_raw}'."
                )
                return True

    # 2. Vérification contre les offres existantes déjà marquées comme ARCHIVED
    statement = select(JobOffer).where(
        JobOffer.user_id == user_id,
        JobOffer.status == "ARCHIVED",
    )
    archived_jobs = session.exec(statement).all()

    for job in archived_jobs:
        # Correspondance exacte platform + external_id
        if platform and external_id and job.platform == platform and job.external_id == external_id:
            logger.info(f"[Bouclier Anti-Rescrape] Déjà archivé (external_id existant): '{title_raw}' ({job.id})")
            return True

        # Correspondance URL
        if url_norm:
            job_url_norm = normalize_job_url(job.apply_url or job.url)
            if job_url_norm and job_url_norm == url_norm:
                logger.info(f"[Bouclier Anti-Rescrape] Déjà archivé (URL existante): '{title_raw}' ({job.id})")
                return True

        # Correspondance entreprise + titre
        job_company_clean = clean_text_for_match(job.company)
        job_title_clean = clean_text_for_match(job.title)
        if company_clean and job_company_clean == company_clean:
            if titles_match(title_clean, job_title_clean):
                logger.info(
                    f"[Bouclier Anti-Rescrape] Déjà archivé (Entreprise/Titre existant): '{title_raw}' chez '{company_raw}' ({job.id})"
                )
                return True

    return False


def is_job_excluded_from_scraping(session: Session, user_id: str, raw_job: Dict[str, Any]) -> bool:
    """
    Bouclier unifié anti-rescrape : Vérifie si une offre brute est exclue
    soit parce qu'elle a déjà été postulée, soit parce qu'elle a été archivée.
    """
    return is_job_already_applied(session, user_id, raw_job) or is_job_already_archived(session, user_id, raw_job)
