import json
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

# ============================================================================
# Dictionnaire Normalisé des Compétences Techniques (IT, Cloud, Data, Cyber)
# ============================================================================

TECH_SKILLS_DICTIONARY: dict[str, list[str]] = {
    # Langages
    "Python": [r"\bpython\b"],
    "Java": [r"\bjava\b(?!script)"],
    "TypeScript": [r"\btypescript\b", r"\bts\b"],
    "JavaScript": [r"\bjavascript\b", r"\bjs\b(?!on)"],
    "C++": [r"\bc\+\+\b"],
    "C#": [r"\bc#\b", r"\bcsharp\b"],
    "C": [r"\bc\b(?=\s*(?:langage|language|embedded|\/c\+\+))"],
    "Go": [r"\bgolang\b", r"\bgo\b(?=\s*(?:lang|developer|développeur|backend))"],
    "Rust": [r"\brust\b"],
    "PHP": [r"\bphp\b"],
    "Ruby": [r"\bruby\b"],
    "Swift": [r"\bswift\b"],
    "Kotlin": [r"\bkotlin\b"],
    "SQL": [r"\bsql\b"],
    # Web & Frameworks
    "React": [r"\breact(?:\.js)?\b"],
    "Next.js": [r"\bnext(?:\.js)?\b"],
    "Vue.js": [r"\bvue(?:\.js)?\b"],
    "Angular": [r"\bangular\b"],
    "Node.js": [r"\bnode(?:\.js)?\b"],
    "FastAPI": [r"\bfastapi\b"],
    "Django": [r"\bdjango\b"],
    "Flask": [r"\bflask\b"],
    "Spring Boot": [r"\bspring\s*boot\b", r"\bspring\b(?=\s*(?:framework|java|security|data))"],
    ".NET": [r"\b\.net\b", r"\bdotnet\b"],
    "NestJS": [r"\bnest(?:\.js)?\b"],
    "Symfony": [r"\bsymfony\b"],
    "Tailwind CSS": [r"\btailwind(?:\s*css)?\b"],
    "GraphQL": [r"\bgraphql\b"],
    # Cloud, DevOps & Containerisation
    "Docker": [r"\bdocker\b"],
    "Kubernetes": [r"\bkubernetes\b", r"\bk8s\b"],
    "AWS": [r"\baws\b", r"\bamazon\s*web\s*services\b"],
    "Azure": [r"\bazure\b"],
    "GCP": [r"\bgcp\b", r"\bgoogle\s*cloud\b"],
    "Terraform": [r"\bterraform\b"],
    "Ansible": [r"\bansible\b"],
    "CI/CD": [r"\bci\/cd\b", r"\bci-cd\b", r"\bintégration\s*continue\b"],
    "GitLab CI": [r"\bgitlab(?:\s*-?\s*ci)?\b"],
    "GitHub Actions": [r"\bgithub\s*actions\b"],
    "Jenkins": [r"\bjenkins\b"],
    "Linux": [r"\blinux\b", r"\bunix\b", r"\bbash\b", r"\bshell\b"],
    # Data, IA, ML
    "Machine Learning": [r"\bmachine\s*learning\b", r"\bml\b(?=\s*(?:ops|engineer|modèle|pipeline))"],
    "Deep Learning": [r"\bdeep\s*learning\b"],
    "LLM / GenAI": [r"\bllm\b", r"\bgenai\b", r"\bgpt\b", r"\brag\b", r"\btransformers?\b", r"\bia\s*générative\b"],
    "PyTorch": [r"\bpytorch\b"],
    "TensorFlow": [r"\btensorflow\b"],
    "Scikit-Learn": [r"\bscikit-learn\b", r"\bsklearn\b"],
    "Pandas": [r"\bpandas\b"],
    "NumPy": [r"\bnumpy\b"],
    "Spark": [r"\bapache\s*spark\b", r"\bspark\b(?=\s*(?:streaming|sql|data))"],
    "Kafka": [r"\bapache\s*kafka\b", r"\bkafka\b"],
    "Airflow": [r"\bapache\s*airflow\b", r"\bairflow\b"],
    "BigQuery": [r"\bbigquery\b"],
    "Databricks": [r"\bdatabricks\b"],
    # Bases de données
    "PostgreSQL": [r"\bpostgres(?:ql)?\b"],
    "MySQL": [r"\bmysql\b"],
    "MongoDB": [r"\bmongodb\b", r"\bmongo\b"],
    "Redis": [r"\bredis\b"],
    "Elasticsearch": [r"\belasticsearch\b", r"\belk\b"],
    # Cybersécurité
    "Cybersécurité": [r"\bcybersécurité\b", r"\bcybersecurity\b", r"\bpentest\b", r"\bsoc\b(?=\s*(?:analyst|alert))", r"\biem\b"],
    # Systèmes embarqués & IoT
    "Embedded / IoT": [r"\bembarqu[ée]s?\b", r"\bembedded\b", r"\biot\b", r"\brtos\b", r"\bmicrocontrôleur\b", r"\barm\b"],
}

# ============================================================================
# Heuristiques de Détection Durée, Mode de Travail, Gratification, Département
# ============================================================================

DURATION_PATTERNS: list[tuple[str, str]] = [
    (r"\b(?:4\s*(?:à|-)\s*6|4-6)\s*mois\b", "4 à 6 mois"),
    (r"\b(?:5\s*(?:à|-)\s*6|5-6)\s*mois\b", "5 à 6 mois"),
    (r"\b6\s*mois\b", "6 mois"),
    (r"\b5\s*mois\b", "5 mois"),
    (r"\b4\s*mois\b", "4 mois"),
    (r"\b3\s*mois\b", "3 mois"),
    (r"\b(?:24|2\s*ans)\s*mois?\b", "24 mois (Alternance)"),
    (r"\b(?:12|1\s*an)\s*mois?\b", "12 mois (Alternance)"),
    (r"\bstage\s*de\s*fin\s*d['’]études?\b", "Stage 6 mois (PFE)"),
    (r"\bpfe\b", "Stage PFE"),
    (r"\bcdi\b", "CDI"),
    (r"\bcdd\b", "CDD"),
]

WORK_MODE_PATTERNS: list[tuple[str, str]] = [
    (r"\b(?:full\s*remote|100%\s*t[ée]l[ée]travail|t[ée]l[ée]travail\s*total)\b", "Télétravail total"),
    (r"\b(?:hybride|hybrid|2\s*jours\s*de\s*t[ée]l[ée]travail|3\s*jours\s*de\s*t[ée]l[ée]travail|t[ée]l[ée]travail\s*partiel)\b", "Hybride"),
    (r"\b(?:sur\s*site|pr[ée]sentiel|on-site|onsite)\b", "Sur site"),
]

SALARY_PATTERNS: list[str] = [
    r"\b(?:\d[\d\s\.,]*)\s*(?:€|eur|euros?)\s*(?:\/|\s*par\s*)?\s*(?:mois|m|an|annee|annuel)\b",
    r"\b(?:gratification|indemnit[ée])\s*l[ée]gale\b",
    r"\b(?:\d[\d\s\.,]*)\s*(?:dt|tnd|dinars?)\s*(?:\/|\s*par\s*)?\s*(?:mois|m)\b",
    r"\b\d{3,4}\s*€\s*-\s*\d{3,4}\s*€\b",
]

DEPARTMENT_PATTERNS: list[tuple[str, str]] = [
    (r"\b(?:ia|intelligence\s*artificielle|data\s*science|machine\s*learning|deep\s*learning|nlp|computer\s*vision|big\s*data|data\s*engineer)\b", "Data, IA & Machine Learning"),
    (r"\b(?:cloud|devops|sre|infrastructure|kubernetes|terraform|sysadmin|syst[èe]mes?\s*et\s*r[ée]seaux)\b", "Cloud, DevOps & Infra"),
    (r"\b(?:cyber|cybers[ée]curit[ée]|sécurité\s*informatique|pentest|soc|siem|audit\s*de\s*sécurité)\b", "Cybersécurité"),
    (r"\b(?:web|frontend|backend|fullstack|mobile|react|angular|node|spring|java|python|applicatif)\b", "Ingénierie Logicielle & Web"),
    (r"\b(?:embarqu[ée]|embedded|iot|automotive|a[ée]ronautique|robotique|rtos|firmware)\b", "Systèmes Embarqués & IoT"),
    (r"\b(?:conseil|consulting|transformation\s*digitale|strat[ée]gie\s*it|management|product\s*manager|product\s*owner)\b", "Conseil & Management IT"),
]


class JobDeepExtractor:
    """
    Moteur de Deep Extraction et Normalisation d'offres d'emploi et de stage.
    Extrait le maximum d'informations structurées à partir du texte brut, HTML ou métadonnées :
    - Compétences / Stack technique
    - Durée et type de contrat
    - Modalité de travail (Remote / Hybride / Sur site)
    - Gratification / Rémunération
    - Département métier
    - Date de publication normalisée (UTC)
    """

    @staticmethod
    def clean_text(raw_text: str) -> str:
        """Nettoie le texte en retirant le balisage HTML, les scripts et les espaces superflus."""
        if not raw_text:
            return ""
        # Retrait balises script et style
        cleaned = re.sub(r"<(?:script|style)[^>]*>[\s\S]*?<\/(?:script|style)>", " ", raw_text, flags=re.IGNORECASE)
        # Retrait balises HTML résiduelles
        cleaned = re.sub(r"<[^>]+>", " ", cleaned)
        # Remplacement entités HTML courantes
        cleaned = (
            cleaned.replace("&nbsp;", " ")
            .replace("&amp;", "&")
            .replace("&quot;", '"')
            .replace("&#39;", "'")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
        )
        # Normalisation des sauts de ligne et espaces
        cleaned = re.sub(r"\r\n|\r", "\n", cleaned)
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
        cleaned = re.sub(r"[ \t]+", " ", cleaned)
        return cleaned.strip()

    @classmethod
    def extract_skills(cls, title: str, description: str) -> list[str]:
        """Détecte les compétences et technologies mentionnées dans le titre et la description."""
        combined = f"{title}\n{description}".lower()
        detected: set[str] = set()

        for skill_name, patterns in TECH_SKILLS_DICTIONARY.items():
            for pat in patterns:
                if re.search(pat, combined, re.IGNORECASE):
                    detected.add(skill_name)
                    break

        # Tri déterministe pour stabilité
        return sorted(list(detected))

    @classmethod
    def extract_contract_duration(cls, title: str, description: str, offer_type: str = "PFE") -> str:
        """Extrait la durée du stage ou type de contrat."""
        combined = f"{title} {description}".lower()
        for pat, duration in DURATION_PATTERNS:
            if re.search(pat, combined, re.IGNORECASE):
                return duration

        if offer_type == "PFE":
            return "6 mois (PFE)"
        elif offer_type == "JOB":
            return "CDI / Temps plein"
        return "Non spécifié"

    @classmethod
    def extract_work_mode(cls, location: str, description: str) -> str:
        """Détecte si l'offre propose du full remote, du travail hybride ou du présentiel."""
        combined = f"{location} {description}".lower()
        for pat, mode in WORK_MODE_PATTERNS:
            if re.search(pat, combined, re.IGNORECASE):
                return mode
        return "Sur site / Non précisé"

    @classmethod
    def extract_salary_stipend(cls, description: str) -> str:
        """Détecte les mentions de rémunération ou de gratification."""
        for pat in SALARY_PATTERNS:
            match = re.search(pat, description, re.IGNORECASE)
            if match:
                val = match.group(0).strip()
                # Nettoyage
                val = re.sub(r"\s+", " ", val)
                return val
        return ""

    @classmethod
    def extract_department(cls, title: str, description: str) -> str:
        """Identifie le pôle technologique ou département."""
        combined = f"{title}\n{description}".lower()
        for pat, dept in DEPARTMENT_PATTERNS:
            if re.search(pat, combined, re.IGNORECASE):
                return dept
        return "Génie Logiciel / IT Généraliste"

    @classmethod
    def parse_relative_published_at(cls, date_str: str, base_time: Optional[datetime] = None) -> Optional[datetime]:
        """
        Convertit une date relative (ex: 'il y a 2 heures', 'publié il y a 3 jours',
        'hier', '2 days ago', '2026-03-15') en datetime UTC.
        """
        if not date_str or not date_str.strip():
            return None

        now = base_time or datetime.now(timezone.utc)
        d_lower = date_str.lower().strip()

        # Format ISO ou standard YYYY-MM-DD
        iso_match = re.search(r"(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?", d_lower)
        if iso_match:
            try:
                year, month, day = int(iso_match.group(1)), int(iso_match.group(2)), int(iso_match.group(3))
                hour = int(iso_match.group(4) or 0)
                minute = int(iso_match.group(5) or 0)
                sec = int(iso_match.group(6) or 0)
                return datetime(year, month, day, hour, minute, sec, tzinfo=timezone.utc)
            except Exception:
                pass

        # "Aujourd'hui" / "today" / "à l'instant"
        if any(w in d_lower for w in ["aujourd'hui", "today", "à l'instant", "just posted"]):
            return now

        # "Hier" / "yesterday"
        if any(w in d_lower for w in ["hier", "yesterday"]):
            return now - timedelta(days=1)

        # "il y a X heures" / "X hours ago"
        hours_match = re.search(r"(?:il\s*y\s*a\s*)?(\d+)\s*(?:heure|heures|h|hour|hours|hr|hrs)(?:\s*ago)?", d_lower)
        if hours_match:
            val = int(hours_match.group(1))
            return now - timedelta(hours=val)

        # "il y a X jours" / "X days ago"
        days_match = re.search(r"(?:il\s*y\s*a\s*)?(\d+)\s*(?:jour|jours|j|day|days)(?:\s*ago)?", d_lower)
        if days_match:
            val = int(days_match.group(1))
            return now - timedelta(days=val)

        # "il y a X semaines" / "X weeks ago"
        weeks_match = re.search(r"(?:il\s*y\s*a\s*)?(\d+)\s*(?:semaine|semaines|sem|week|weeks)(?:\s*ago)?", d_lower)
        if weeks_match:
            val = int(weeks_match.group(1))
            return now - timedelta(weeks=val)

        # "il y a X mois" / "X months ago"
        months_match = re.search(r"(?:il\s*y\s*a\s*)?(\d+)\s*(?:mois|month|months)(?:\s*ago)?", d_lower)
        if months_match:
            val = int(months_match.group(1))
            return now - timedelta(days=val * 30)

        return None

    @classmethod
    def enrich_job_data(
        cls,
        raw_job: dict[str, Any],
        base_time: Optional[datetime] = None,
    ) -> dict[str, Any]:
        """
        Enrichit complètement les données d'une offre collectée avec toutes les métadonnées extraites.
        """
        title = raw_job.get("title", "")
        raw_desc = raw_job.get("description_raw", "")
        clean_desc = cls.clean_text(raw_desc) or raw_desc
        location = raw_job.get("location", "")
        offer_type = raw_job.get("offer_type", "PFE")

        skills = cls.extract_skills(title, clean_desc)
        duration = raw_job.get("contract_duration") or cls.extract_contract_duration(title, clean_desc, offer_type)
        work_mode = raw_job.get("work_mode") or cls.extract_work_mode(location, clean_desc)
        salary = raw_job.get("salary_stipend") or cls.extract_salary_stipend(clean_desc)
        department = raw_job.get("department") or cls.extract_department(title, clean_desc)

        # Date de publication
        pub_date = raw_job.get("published_at")
        if isinstance(pub_date, str):
            pub_date = cls.parse_relative_published_at(pub_date, base_time)
        elif not isinstance(pub_date, datetime):
            pub_date = cls.parse_relative_published_at(raw_job.get("published_date_raw", ""), base_time)

        # Si aucune date n'a pu être extraite, fallback propre sur l'heure actuelle
        if not pub_date:
            pub_date = base_time or datetime.now(timezone.utc)

        enriched = dict(raw_job)
        enriched["description_raw"] = clean_desc
        enriched["skills_required"] = json.dumps(skills, ensure_ascii=False)
        enriched["contract_duration"] = duration
        enriched["work_mode"] = work_mode
        enriched["salary_stipend"] = salary
        enriched["department"] = department
        enriched["published_at"] = pub_date
        enriched["apply_url"] = raw_job.get("apply_url") or raw_job.get("url", "")
        enriched["is_direct_career_site"] = bool(raw_job.get("is_direct_career_site", False))

        return enriched
