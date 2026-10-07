import logging
from typing import Any, Optional
from sqlmodel import Session, select

from app.domain.anti_rescrape import (
    clean_text_for_match,
    normalize_job_url,
    titles_match,
)
from app.domain.models import (
    AppliedJobSignature,
    ArchivedJobSignature,
    CoverLetter,
    EmailInteraction,
    JobOffer,
    ReconDossier,
    TargetedCV,
)

logger = logging.getLogger(__name__)

STATUS_PRIORITY: dict[str, int] = {
    "OFFER": 7,
    "INTERVIEW": 6,
    "SUBMITTED": 5,
    "READY": 4,
    "REVIEWING": 3,
    "DISCOVERED": 2,
    "ARCHIVED": 1,
    "REJECTED": 0,
}


def are_jobs_duplicate(
    job_a: JobOffer | dict[str, Any],
    job_b: JobOffer | dict[str, Any],
) -> bool:
    """
    Détermine si deux offres sont des doublons sémantiques ou techniques.
    Critères :
    1. Identifiant plateforme identique (platform + external_id)
    2. URL canonique nettoyée identique (sans tracking UTM ou paramètres de session)
    3. Entreprise nettoyée identique ET titre sémantiquement concordant (hors divergence de pays)
    """
    plat_a = job_a.platform if isinstance(job_a, JobOffer) else job_a.get("platform", "")
    plat_b = job_b.platform if isinstance(job_b, JobOffer) else job_b.get("platform", "")
    ext_a = str(job_a.external_id or "") if isinstance(job_a, JobOffer) else str(job_b.get("external_id", "") if not isinstance(job_a, dict) else job_a.get("external_id", ""))
    ext_b = str(job_b.external_id or "") if isinstance(job_b, JobOffer) else str(job_b.get("external_id", ""))

    # 1. Correspondance exacte sur platform + external_id
    if plat_a and plat_b and plat_a == plat_b and ext_a and ext_b and ext_a == ext_b:
        return True

    # 2. Correspondance sur URL normalisée
    url_raw_a = (job_a.apply_url or job_a.url) if isinstance(job_a, JobOffer) else (job_a.get("apply_url") or job_a.get("url", ""))
    url_raw_b = (job_b.apply_url or job_b.url) if isinstance(job_b, JobOffer) else (job_b.get("apply_url") or job_b.get("url", ""))
    norm_url_a = normalize_job_url(url_raw_a)
    norm_url_b = normalize_job_url(url_raw_b)

    if norm_url_a and norm_url_b and norm_url_a == norm_url_b:
        return True

    # 3. Correspondance sémantique Entreprise + Titre
    comp_a = job_a.company if isinstance(job_a, JobOffer) else job_a.get("company", "")
    comp_b = job_b.company if isinstance(job_b, JobOffer) else job_b.get("company", "")
    comp_clean_a = clean_text_for_match(comp_a)
    comp_clean_b = clean_text_for_match(comp_b)

    if comp_clean_a and comp_clean_b and comp_clean_a == comp_clean_b:
        title_a = job_a.title if isinstance(job_a, JobOffer) else job_a.get("title", "")
        title_b = job_b.title if isinstance(job_b, JobOffer) else job_b.get("title", "")
        title_clean_a = clean_text_for_match(title_a)
        title_clean_b = clean_text_for_match(title_b)

        if titles_match(title_clean_a, title_clean_b):
            # Ne pas fusionner si les pays sont renseignés et explicitement différents (France vs Tunisie)
            cntry_a = (job_a.country or "").strip().lower() if isinstance(job_a, JobOffer) else (job_a.get("country") or "").strip().lower()
            cntry_b = (job_b.country or "").strip().lower() if isinstance(job_b, JobOffer) else (job_b.get("country") or "").strip().lower()
            if cntry_a and cntry_b and cntry_a != cntry_b:
                if ("tunis" in cntry_a or "franc" in cntry_a) and ("tunis" in cntry_b or "franc" in cntry_b):
                    return False
            return True

    return False


class JobDeduplicationIndex:
    """
    Index en mémoire haute-performance pour le CrawlerScheduler.
    Permet de tester en quelques microsecondes si une offre découverte est un doublon
    d'une offre déjà présente en base pour l'utilisateur, ou déjà scannée dans le batch en cours.
    """

    def __init__(self, existing_jobs: list[JobOffer] | None = None):
        self.by_ext_id: set[tuple[str, str]] = set()
        self.by_norm_url: set[str] = set()
        self.by_company: dict[str, list[dict[str, Any]]] = {}

        if existing_jobs:
            for job in existing_jobs:
                self.add(job)

    def add(self, job: JobOffer | dict[str, Any]) -> None:
        plat = job.platform if isinstance(job, JobOffer) else job.get("platform", "")
        ext_id = str(job.external_id or "") if isinstance(job, JobOffer) else str(job.get("external_id", ""))
        if plat and ext_id:
            self.by_ext_id.add((plat, ext_id))

        url_raw = (job.apply_url or job.url) if isinstance(job, JobOffer) else (job.get("apply_url") or job.get("url", ""))
        norm_url = normalize_job_url(url_raw)
        if norm_url:
            self.by_norm_url.add(norm_url)

        comp = job.company if isinstance(job, JobOffer) else job.get("company", "")
        title = job.title if isinstance(job, JobOffer) else job.get("title", "")
        cntry = job.country if isinstance(job, JobOffer) else job.get("country", "")

        comp_clean = clean_text_for_match(comp)
        title_clean = clean_text_for_match(title)
        if comp_clean and title_clean:
            if comp_clean not in self.by_company:
                self.by_company[comp_clean] = []
            self.by_company[comp_clean].append({
                "title_clean": title_clean,
                "country": (cntry or "").strip().lower(),
            })

    def is_duplicate(self, raw_job: dict[str, Any]) -> tuple[bool, str]:
        plat = raw_job.get("platform", "")
        ext_id = str(raw_job.get("external_id", ""))
        if plat and ext_id and (plat, ext_id) in self.by_ext_id:
            return True, f"Identifiant externe existant ({plat}:{ext_id})"

        url_raw = raw_job.get("apply_url") or raw_job.get("url", "")
        norm_url = normalize_job_url(url_raw)
        if norm_url and norm_url in self.by_norm_url:
            return True, f"URL normalisée existante ({norm_url})"

        comp_raw = raw_job.get("company", "")
        title_raw = raw_job.get("title", "")
        comp_clean = clean_text_for_match(comp_raw)
        title_clean = clean_text_for_match(title_raw)
        country_clean = (raw_job.get("country") or "").strip().lower()

        if comp_clean and title_clean and comp_clean in self.by_company:
            for item in self.by_company[comp_clean]:
                item_cntry = item["country"]
                if country_clean and item_cntry and country_clean != item_cntry:
                    if ("tunis" in country_clean or "franc" in country_clean) and ("tunis" in item_cntry or "franc" in item_cntry):
                        continue
                if titles_match(item["title_clean"], title_clean):
                    return True, f"Entreprise et titre concordants ('{comp_raw}' / '{title_raw}')"

        return False, ""


def deduplicate_jobs_for_user(session: Session, user_id: str) -> int:
    """
    Détecte et fusionne les offres en doublon pour un utilisateur donné dans la base de données.
    Conserve l'offre canonique la plus avancée dans le cycle de vie et réassigne les dépendances.
    Retourne le nombre d'offres en doublon supprimées.
    """
    jobs = session.exec(
        select(JobOffer).where(JobOffer.user_id == user_id).order_by(JobOffer.collected_at.asc())
    ).all()

    if len(jobs) <= 1:
        return 0

    # Algorithme Union-Find pour partitionner les offres en composantes connexes de doublons
    parent: dict[str, str] = {j.id: j.id for j in jobs}

    def find(item_id: str) -> str:
        if parent[item_id] != item_id:
            parent[item_id] = find(parent[item_id])
        return parent[item_id]

    def union(id1: str, id2: str) -> None:
        root1 = find(id1)
        root2 = find(id2)
        if root1 != root2:
            parent[root2] = root1

    # Comparaison de chaque paire
    for i in range(len(jobs)):
        for j in range(i + 1, len(jobs)):
            if are_jobs_duplicate(jobs[i], jobs[j]):
                union(jobs[i].id, jobs[j].id)

    # Regroupement par racine
    clusters: dict[str, list[JobOffer]] = {}
    for job in jobs:
        root = find(job.id)
        if root not in clusters:
            clusters[root] = []
        clusters[root].append(job)

    total_deleted = 0

    for root, cluster in clusters.items():
        if len(cluster) <= 1:
            continue

        # Sélection de l'offre canonique
        def sort_key(j: JobOffer):
            status_score = STATUS_PRIORITY.get(j.status, 0)
            applied_score = 1 if j.is_applied else 0
            cv_count = len(session.exec(select(TargetedCV).where(TargetedCV.job_id == j.id)).all())
            letter_count = len(session.exec(select(CoverLetter).where(CoverLetter.job_id == j.id)).all())
            doc_score = cv_count + letter_count
            date_score = j.collected_at.timestamp() if j.collected_at else 0
            return (status_score, applied_score, doc_score, date_score)

        cluster.sort(key=sort_key, reverse=True)
        canonical = cluster[0]
        duplicates = cluster[1:]

        logger.info(
            f"[Deduplication] User '{user_id}': Conservation de l'offre canonique '{canonical.title}' ({canonical.id}) "
            f"chez '{canonical.company}', fusion de {len(duplicates)} doublon(s)."
        )

        for dup in duplicates:
            # Réassignation des dépendances vers l'offre canonique
            for cv in session.exec(select(TargetedCV).where(TargetedCV.job_id == dup.id)).all():
                cv.job_id = canonical.id
                session.add(cv)

            for let in session.exec(select(CoverLetter).where(CoverLetter.job_id == dup.id)).all():
                let.job_id = canonical.id
                session.add(let)

            for em in session.exec(select(EmailInteraction).where(EmailInteraction.job_id == dup.id)).all():
                em.job_id = canonical.id
                session.add(em)

            for rd in session.exec(select(ReconDossier).where(ReconDossier.job_id == dup.id)).all():
                rd.job_id = canonical.id
                session.add(rd)

            for sig in session.exec(select(AppliedJobSignature).where(AppliedJobSignature.job_id == dup.id)).all():
                sig.job_id = canonical.id
                session.add(sig)

            for sig in session.exec(select(ArchivedJobSignature).where(ArchivedJobSignature.job_id == dup.id)).all():
                sig.job_id = canonical.id
                session.add(sig)

            session.delete(dup)
            total_deleted += 1

    if total_deleted > 0:
        session.commit()

    return total_deleted


def deduplicate_all_jobs_in_db(engine) -> dict[str, Any]:
    """
    Parcourt l'ensemble des utilisateurs et nettoie les doublons existants dans la base de données SQLite.
    Appelée automatiquement lors de l'initialisation (_migrate_db) au démarrage du service en local et en production.
    """
    total_removed = 0
    users_cleaned = 0

    with Session(engine) as session:
        # Récupération de tous les utilisateurs distincts ayant des offres
        distinct_users = session.exec(select(JobOffer.user_id).distinct()).all()
        for u in distinct_users:
            if not u:
                continue
            removed = deduplicate_jobs_for_user(session, u)
            if removed > 0:
                total_removed += removed
                users_cleaned += 1

    logger.info(f"[Deduplication] Nettoyage terminé : {total_removed} offre(s) doublon(s) purgée(s) pour {users_cleaned} profil(s).")
    return {
        "status": "success",
        "duplicates_removed": total_removed,
        "users_cleaned": users_cleaned,
    }
