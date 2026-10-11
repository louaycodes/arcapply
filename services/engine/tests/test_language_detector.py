import pytest
from app.domain.language_detector import detect_job_language


def test_detect_job_language_french():
    title = "Stage PFE Ingénieur Logiciel Fullstack (H/F)"
    desc = "Nous recherchons un stagiaire de fin d'études pour rejoindre notre équipe à Paris. Missions : concevoir et développer une application web avec FastAPI et Vue.js."
    assert detect_job_language(title, desc, country="France") == "fr"


def test_detect_job_language_english():
    title = "Software Engineer Intern - Distributed Systems"
    desc = "We are looking for an ambitious engineering student to join our team in Helsinki. You will work on scalable backend services and cloud infrastructure."
    assert detect_job_language(title, desc, country="Finland") == "en"


def test_detect_job_language_english_in_france():
    # Multinational or tech startup in France posting in English
    title = "DevSecOps Engineering Intern"
    desc = "Join our platform engineering squad in Paris. You will build automated CI/CD pipelines, manage Kubernetes clusters, and enhance telemetry."
    assert detect_job_language(title, desc, country="France") == "en"


def test_detect_job_language_short_fallbacks():
    assert detect_job_language("Internship", "", country="Germany") == "en"
    assert detect_job_language("Stage PFE", "", country="Tunisie") == "fr"
