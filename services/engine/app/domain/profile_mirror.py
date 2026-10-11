import json
import logging
import re
from typing import Optional
from sqlmodel import Session

from app.config import settings
from app.domain.language_detector import detect_job_language
from app.domain.models import Education, Experience, MasterProfile, Project

logger = logging.getLogger(__name__)


class ProfileMirrorService:
    """
    Service de synchronisation et de traduction miroir du profil candidat.
    Permet à l'utilisateur de saisir son profil dans une seule langue (FR ou EN),
    et génère de manière fidèle et sans hallucination la version miroir.
    """

    @classmethod
    def sync_mirror_translations(
        cls,
        profile: MasterProfile,
        session: Session,
        target_lang: Optional[str] = None,
    ) -> MasterProfile:
        """
        Détecte la langue source du profil et traduit automatiquement vers la langue cible (en ou fr).
        Lève une RuntimeError explicite en cas d'échec du modèle IA.
        """
        api_key = (profile.groq_api_key or "").strip() or settings.effective_groq_api_key
        model_name = (profile.groq_model or "").strip() or settings.effective_groq_model

        if not api_key:
            raise RuntimeError(
                "Clé d'API Groq non configurée. Renseignez votre clé dans les Paramètres pour activer la synchronisation de la langue."
            )

        # 1. Détection de la langue principale saisie
        sample_text = " ".join([
            profile.headline or "",
            profile.bio or "",
            " ".join(e.description for e in profile.experiences if e.description),
            " ".join(p.description for p in profile.projects if p.description),
        ])
        detected_source = detect_job_language(description=sample_text)
        src_lang = "en" if detected_source == "en" else "fr"
        dest_lang = target_lang or ("en" if src_lang == "fr" else "fr")

        # 2. Collecte des éléments nécessitant une traduction
        payload_to_translate: dict = {
            "source_lang": src_lang,
            "target_lang": dest_lang,
            "profile": {},
            "educations": [],
            "experiences": [],
            "projects": [],
        }

        # Profil de base
        if src_lang == "fr":
            if profile.headline and not profile.headline_en:
                payload_to_translate["profile"]["headline"] = profile.headline
            if profile.bio and not profile.bio_en:
                payload_to_translate["profile"]["bio"] = profile.bio
        else:
            if profile.headline and not profile.headline_fr:
                payload_to_translate["profile"]["headline"] = profile.headline
            if profile.bio and not profile.bio_fr:
                payload_to_translate["profile"]["bio"] = profile.bio

        # Formations
        for idx, edu in enumerate(profile.educations):
            item: dict = {"index": idx}
            if src_lang == "fr":
                if edu.degree and (not edu.degree_en or edu.degree_en == edu.degree):
                    item["degree"] = edu.degree
                if edu.field_of_study and (not edu.field_of_study_en or edu.field_of_study_en == edu.field_of_study):
                    item["field_of_study"] = edu.field_of_study
                if edu.description and (not edu.description_en or edu.description_en == edu.description):
                    item["description"] = edu.description
            else:
                if edu.degree and (not edu.degree_fr or edu.degree_fr == edu.degree):
                    item["degree"] = edu.degree
                if edu.field_of_study and (not edu.field_of_study_fr or edu.field_of_study_fr == edu.field_of_study):
                    item["field_of_study"] = edu.field_of_study
                if edu.description and (not edu.description_fr or edu.description_fr == edu.description):
                    item["description"] = edu.description

            if len(item) > 1:
                payload_to_translate["educations"].append(item)

        # Expériences
        for idx, exp in enumerate(profile.experiences):
            item = {"index": idx}
            if src_lang == "fr":
                if exp.role and (not exp.role_en or exp.role_en == exp.role):
                    item["role"] = exp.role
                if exp.description and (not exp.description_en or exp.description_en == exp.description):
                    item["description"] = exp.description
            else:
                if exp.role and (not exp.role_fr or exp.role_fr == exp.role):
                    item["role"] = exp.role
                if exp.description and (not exp.description_fr or exp.description_fr == exp.description):
                    item["description"] = exp.description

            if len(item) > 1:
                payload_to_translate["experiences"].append(item)

        # Projets
        for idx, proj in enumerate(profile.projects):
            item = {"index": idx}
            if src_lang == "fr":
                if proj.title and (not proj.title_en or proj.title_en == proj.title):
                    item["title"] = proj.title
                if proj.role and (not proj.role_en or proj.role_en == proj.role):
                    item["role"] = proj.role
                if proj.description and (not proj.description_en or proj.description_en == proj.description):
                    item["description"] = proj.description
            else:
                if proj.title and (not proj.title_fr or proj.title_fr == proj.title):
                    item["title"] = proj.title
                if proj.role and (not proj.role_fr or proj.role_fr == proj.role):
                    item["role"] = proj.role
                if proj.description and (not proj.description_fr or proj.description_fr == proj.description):
                    item["description"] = proj.description

            if len(item) > 1:
                payload_to_translate["projects"].append(item)

        # Vérifier si quelque chose doit être traduit
        has_work = (
            bool(payload_to_translate["profile"])
            or bool(payload_to_translate["educations"])
            or bool(payload_to_translate["experiences"])
            or bool(payload_to_translate["projects"])
        )

        if not has_work:
            return profile

        # 3. Appel Groq strict & sans hallucination
        translated_data = cls._execute_translation_llm(
            payload=payload_to_translate,
            api_key=api_key,
            model_name=model_name,
            src_lang=src_lang,
            dest_lang=dest_lang,
        )

        # 4. Application des résultats traduits sur les entités SQLModel
        prof_res = translated_data.get("profile", {})
        if src_lang == "fr":
            if "headline" in prof_res:
                profile.headline_en = prof_res["headline"]
            if "bio" in prof_res:
                profile.bio_en = prof_res["bio"]
        else:
            if "headline" in prof_res:
                profile.headline_fr = prof_res["headline"]
            if "bio" in prof_res:
                profile.bio_fr = prof_res["bio"]

        for edu_tr in translated_data.get("educations", []):
            idx = edu_tr.get("index")
            if idx is not None and 0 <= idx < len(profile.educations):
                edu_entity = profile.educations[idx]
                if src_lang == "fr":
                    if "degree" in edu_tr:
                        edu_entity.degree_en = edu_tr["degree"]
                    if "field_of_study" in edu_tr:
                        edu_entity.field_of_study_en = edu_tr["field_of_study"]
                    if "description" in edu_tr:
                        edu_entity.description_en = edu_tr["description"]
                else:
                    if "degree" in edu_tr:
                        edu_entity.degree_fr = edu_tr["degree"]
                    if "field_of_study" in edu_tr:
                        edu_entity.field_of_study_fr = edu_tr["field_of_study"]
                    if "description" in edu_tr:
                        edu_entity.description_fr = edu_tr["description"]

        for exp_tr in translated_data.get("experiences", []):
            idx = exp_tr.get("index")
            if idx is not None and 0 <= idx < len(profile.experiences):
                exp_entity = profile.experiences[idx]
                if src_lang == "fr":
                    if "role" in exp_tr:
                        exp_entity.role_en = exp_tr["role"]
                    if "description" in exp_tr:
                        exp_entity.description_en = exp_tr["description"]
                else:
                    if "role" in exp_tr:
                        exp_entity.role_fr = exp_tr["role"]
                    if "description" in exp_tr:
                        exp_entity.description_fr = exp_tr["description"]

        for proj_tr in translated_data.get("projects", []):
            idx = proj_tr.get("index")
            if idx is not None and 0 <= idx < len(profile.projects):
                proj_entity = profile.projects[idx]
                if src_lang == "fr":
                    if "title" in proj_tr:
                        proj_entity.title_en = proj_tr["title"]
                    if "role" in proj_tr:
                        proj_entity.role_en = proj_tr["role"]
                    if "description" in proj_tr:
                        proj_entity.description_en = proj_tr["description"]
                else:
                    if "title" in proj_tr:
                        proj_entity.title_fr = proj_tr["title"]
                    if "role" in proj_tr:
                        proj_entity.role_fr = proj_tr["role"]
                    if "description" in proj_tr:
                        proj_entity.description_fr = proj_tr["description"]

        session.add(profile)
        session.commit()
        session.refresh(profile)
        return profile

    @classmethod
    def _execute_translation_llm(
        cls,
        payload: dict,
        api_key: str,
        model_name: str,
        src_lang: str,
        dest_lang: str,
    ) -> dict:
        """Exécute l'appel LLM pour traduire les éléments de profil."""
        from groq import Groq

        client = Groq(api_key=api_key, timeout=35.0)

        sys_prompt = f"""You are a professional software engineering resume translator and localizer.
Translate the provided profile fields from {src_lang.upper()} to {dest_lang.upper()}.

MANDATORY RULES:
1. Strict Output: Return ONLY a valid JSON object matching the input structure, preserving all integer 'index' values.
2. Zero Hallucination: Do NOT invent skills, certifications, company names, or achievements.
3. Keep metrics, tools, libraries, and numbers EXACT (e.g., Docker, Kubernetes, AWS, 99.9% uptime, -30% latency).
4. Standard Engineering Terminology:
   - 'Diplôme National d'Ingénieur' -> 'National Engineering Degree'
   - 'Élève-ingénieur' -> 'Engineering Student'
   - 'Stagiaire' -> 'Intern'
   - 'Stage' -> 'Internship'
   - 'Génie Logiciel' -> 'Software Engineering'
   - 'Systèmes et Réseaux' -> 'Systems and Networks'
5. Do NOT include markdown code fences (```json), return raw JSON only."""

        user_content = json.dumps(payload, ensure_ascii=False)

        try:
            resp = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": user_content},
                ],
                model=model_name,
                temperature=0.1,
                max_tokens=900,
            )
            raw = (resp.choices[0].message.content or "").strip()
            # Nettoyer d'éventuels wrappers markdown
            raw_clean = re.sub(r"^```(?:json)?\s*", "", raw)
            raw_clean = re.sub(r"\s*```$", "", raw_clean)
            return json.loads(raw_clean)
        except Exception as e:
            logger.error(f"Erreur lors de la traduction miroir du profil: {e}")
            err_str = str(e).lower()
            if any(w in err_str for w in ["quota", "token", "429", "rate_limit", "rate limit"]):
                raise RuntimeError(
                    "Quota de tokens Groq atteint (Rate limit). Veuillez réessayer ultérieurement ou renseigner une clé Groq personnelle."
                ) from e
            raise RuntimeError(f"Échec de la synchronisation linguistique du profil: {e}") from e
