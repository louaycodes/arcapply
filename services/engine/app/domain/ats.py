import re
from typing import Any
from app.domain.models import ATSMatchResult, JobOffer, MasterProfile

# Taxonomie normalisée des technologies et compétences d'ingénierie logicielle & cloud
TECH_TAXONOMY: set[str] = {
    "python", "fastapi", "django", "flask", "pydantic", "sqlalchemy", "sqlmodel",
    "react", "next.js", "typescript", "javascript", "vue", "angular", "node.js",
    "docker", "kubernetes", "linux", "bash", "git", "ci/cd", "devops",
    "sql", "postgresql", "sqlite", "mysql", "mongodb", "redis",
    "go", "golang", "c++", "c", "java", "rust", "aws", "gcp", "azure",
    "microservices", "rest", "graphql", "playwright", "selenium",
    "systèmes distribués", "cloud", "agile", "scrum"
}

# Règles de transférabilité sémantique (Technologies équivalentes ou sous-jacentes)
TRANSFERABLE_MAP: dict[str, list[str]] = {
    "react": ["next.js", "typescript", "javascript"],
    "next.js": ["react", "typescript", "javascript"],
    "fastapi": ["python", "flask", "django"],
    "flask": ["python", "fastapi"],
    "django": ["python", "fastapi"],
    "docker": ["podman", "conteneurs", "linux"],
    "kubernetes": ["helm", "cloud", "devops"],
    "postgresql": ["sql", "sqlite", "mysql", "databases"],
    "sqlite": ["sql", "postgresql", "mysql"],
    "sql": ["sqlite", "postgresql", "mysql", "sqlmodel", "sqlalchemy"],
    "typescript": ["javascript", "react", "next.js"],
    "javascript": ["typescript", "react", "next.js"],
    "linux": ["bash", "unix", "devops"],
    "ci/cd": ["git", "devops", "docker"],
    "microservices": ["rest", "fastapi", "docker", "python", "go"],
    "rest": ["fastapi", "microservices", "flask", "django"],
    "cloud": ["aws", "gcp", "azure", "docker", "devops"],
    "go": ["golang", "microservices"],
}


class ATSMatchingEngine:
    """
    Moteur d'alignement ATS déterministe (AD-4 Étape 2).
    Calcule mathématiquement le score et isole strictement les compétences manquantes.
    """

    @staticmethod
    def extract_required_skills(text: str) -> list[str]:
        """Extrait les compétences requises à partir d'un texte d'offre par matching lexical."""
        normalized_text = f" {text.lower()} "
        found_skills: list[str] = []

        for tech in sorted(TECH_TAXONOMY, key=len, reverse=True):
            # Utilisation de frontières de mots adaptées pour supporter des termes comme c++, c, next.js
            escaped = re.escape(tech)
            pattern = rf"(?:\b|\s){escaped}(?:\b|\s|[.,;:!?)])"
            if re.search(pattern, normalized_text):
                found_skills.append(tech)

        # Restitution avec casse standardisée pour l'affichage
        return sorted(list(set(found_skills)))

    @staticmethod
    def extract_profile_skills(profile: MasterProfile) -> set[str]:
        """Extrait l'ensemble exhaustif des compétences attestées dans le Master Profile."""
        verified_skills: set[str] = set()

        # Compétences déclarées
        for skill in profile.skills:
            if skill.name and skill.name.strip():
                verified_skills.add(skill.name.strip().lower())

        # Technologies déclarées dans les expériences
        for exp in profile.experiences:
            for tech in exp.technologies:
                if tech.strip():
                    verified_skills.add(tech.strip().lower())
            if exp.description:
                for word in ATSMatchingEngine.extract_required_skills(exp.description):
                    verified_skills.add(word)

        # Technologies déclarées dans les projets
        for proj in profile.projects:
            for tech in proj.technologies:
                if tech.strip():
                    verified_skills.add(tech.strip().lower())
            if proj.description:
                for word in ATSMatchingEngine.extract_required_skills(proj.description):
                    verified_skills.add(word)

        # Formations
        for edu in profile.educations:
            if edu.description:
                for word in ATSMatchingEngine.extract_required_skills(edu.description):
                    verified_skills.add(word)

        return verified_skills

    @classmethod
    def evaluate_alignment(
        cls,
        job: JobOffer,
        profile: MasterProfile,
    ) -> ATSMatchResult:
        """
        Confronte l'offre au profil et retourne le score mathématique
        et la ventilation stricte des compétences.
        """
        corpus = f"{job.title} {job.description_raw}"
        required_skills = cls.extract_required_skills(corpus)
        profile_skills = cls.extract_profile_skills(profile)

        matched: list[str] = []
        transferable: list[str] = []
        missing: list[str] = []

        for req in required_skills:
            # 1. Correspondance exacte
            if req in profile_skills:
                matched.append(req.capitalize())
                continue

            # 2. Compétence transférable (proximité sémantique)
            related = TRANSFERABLE_MAP.get(req, [])
            has_transferable = any(rel in profile_skills for rel in related)
            if has_transferable:
                transferable.append(req.capitalize())
            else:
                # 3. Compétence manquante (isolation formelle)
                missing.append(req.capitalize())

        # Calcul mathématique du score (0 à 100)
        total_req = len(required_skills)
        if total_req == 0:
            score = 75 if profile.is_complete else 40
        else:
            raw_score = ((len(matched) * 1.0) + (len(transferable) * 0.6)) / total_req * 100
            score = min(100, max(0, round(raw_score)))

        return ATSMatchResult(
            job_id=job.id,
            score=score,
            matched_skills=sorted(matched),
            transferable_skills=sorted(transferable),
            missing_skills=sorted(missing),
            total_required=total_req,
        )
