import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from app.adapters.database import get_engine
from app.domain.models import (
    MasterProfile,
    Education,
    Experience,
    Project,
    Skill,
    utc_now,
)
from app.domain.validation import evaluate_profile_completeness

def main():
    engine = get_engine()
    with Session(engine) as session:
        # 1. Récupérer ou créer le profil de Louay
        profile = session.exec(
            select(MasterProfile).where(
                (MasterProfile.user_id == "louay") | (MasterProfile.id == "default-profile")
            )
        ).first()

        if not profile:
            profile = MasterProfile(
                id="default-profile",
                user_id="louay",
            )
            session.add(profile)
            session.commit()
            session.refresh(profile)

        # Mise à jour des informations de base
        profile.user_id = "louay"
        profile.full_name = "Louay Zorai"
        profile.headline = "Etudiant ingénieur en Architectures Cloud / DevOps"
        profile.email = "contact@louaycodes.tn"
        profile.phone = "+21698202263"
        profile.location = "Tunis, Tunisia"
        profile.website_url = "https://www.louaycodes.tn/"
        profile.linkedin_url = "https://www.linkedin.com/in/louay-zorai-aa5583262/"
        profile.github_url = "https://github.com/louaycodes"
        profile.search_mode = "PFE"
        profile.bio = (
            "Étudiant en ingénierie informatique spécialisé en architecture cloud à l'ESPRIT, Tunis. "
            "Je développe des applications web fullstack, des applications mobiles et des systèmes cloud-native, "
            "et j'accompagne d'autres étudiants pour transformer leurs projets académiques en réalité. "
            "Je suis animé par une curiosité profonde, le goût des défis techniques et une véritable passion pour "
            "transformer des idées innovantes en produits fonctionnels. Toujours en train d'apprendre, toujours en train de construire."
        )

        # Langues
        languages = [
            {"name": "Arabe", "level": "Langue maternelle"},
            {"name": "Français", "level": "Courant"},
            {"name": "Anglais", "level": "Technique"},
        ]
        profile.languages_raw = json.dumps(languages, ensure_ascii=False)

        # Activités extra-professionnelles
        extracurriculars = [
            {
                "organization": "Enactus EMC",
                "role": "Membre du Département Projets",
                "date": "2022 – 2023",
                "description": (
                    "En tant que membre d'Enactus, j'ai contribué à des projets collaboratifs axés sur l'innovation, "
                    "l'impact social et la résolution de problèmes entrepreneuriaux. Cette expérience a renforcé mon "
                    "esprit d'équipe, ma coordination de projet et mon sens de l'initiative, tout en travaillant vers "
                    "des solutions concrètes à valeur mesurable."
                ),
            },
            {
                "organization": "Lycée Pilote Bizerte Youth Club",
                "role": "Directeur de la Communication",
                "date": "2018 – 2019",
                "description": (
                    "J'ai occupé le poste de Directeur de communication dans un club lycéen, où j'ai développé des "
                    "compétences en organisation et en communication stratégique en assurant la promotion d'événements "
                    "et la gestion de campagnes médiatiques. Cette expérience a renforcé mon esprit d'équipe, ma créativité "
                    "et ma capacité à respecter des délais serrés tout en adaptant mes messages à différents publics."
                ),
            },
            {
                "organization": "Association sportive de BasketBall Cimenterie de Bizerte",
                "role": "Joueur Pro",
                "date": "2015 – 2022",
                "description": (
                    "Grâce à ma progression des catégories Benjamin jusqu'à Senior en basketball, j'ai développé "
                    "la discipline, la constance et la capacité à performer sous pression. Cette expérience a renforcé "
                    "mon esprit d'équipe, ma communication et ma capacité d'adaptation, des compétences que j'applique "
                    "aujourd'hui en collaborant avec des clients internationaux et en construisant des solutions cloud évolutives."
                ),
            },
        ]
        profile.extracurriculars_raw = json.dumps(extracurriculars, ensure_ascii=False)

        # Vider les anciennes sous-entités pour une mise à jour propre
        for edu in session.exec(select(Education).where(Education.profile_id == profile.id)).all():
            session.delete(edu)
        for exp in session.exec(select(Experience).where(Experience.profile_id == profile.id)).all():
            session.delete(exp)
        for proj in session.exec(select(Project).where(Project.profile_id == profile.id)).all():
            session.delete(proj)
        for sk in session.exec(select(Skill).where(Skill.profile_id == profile.id)).all():
            session.delete(sk)
        session.commit()

        # 2. Formations (Education)
        session.add(
            Education(
                profile_id=profile.id,
                school="ESPRIT",
                degree="Ingénieur en informatique",
                field_of_study="Architectures Cloud",
                start_date="2022",
                end_date="2027",
                description="Formation d'ingénieur d'excellence spécialisée en architectures cloud, virtualisation et devops.",
            )
        )

        # 3. Expériences (Stages & Emplois)
        experiences_data = [
            {
                "company": "Natilait",
                "role": "Stagiaire",
                "location": "Tunisie",
                "start_date": "07/2024",
                "end_date": "08/2024",
                "experience_type": "stage",
                "technologies_raw": "",
                "description": (
                    "Lors d'un stage d'immersion chez Natilait, j'ai intégré un environnement professionnel pour "
                    "la première fois et découvert le fonctionnement interne d'une entreprise. Cette expérience "
                    "m'a aidé à développer mon professionnalisme, ma capacité d'adaptation et ma communication "
                    "en milieu de travail, tout en observant des processus réels et la collaboration en équipe."
                ),
            },
            {
                "company": "Capgemini Tunisie",
                "role": "Stagiaire DevOps",
                "location": "Tunisie",
                "start_date": "06/2025",
                "end_date": "07/2025",
                "experience_type": "stage",
                "technologies_raw": "Jenkins, NLP, Transformers, CI/CD",
                "description": (
                    "Lors d'un stage d'un mois et demi chez Capgemini en Tunisie, j'ai réalisé mon premier projet DevOps "
                    "et acquis une expérience pratique dans un environnement informatique professionnel. Cette expérience "
                    "a renforcé mes compétences techniques en DevOps, ainsi que ma capacité à travailler dans une équipe "
                    "structurée, à suivre des flux de production et à m'adapter aux standards du secteur. A part la "
                    "configuration d'une pipeline CI/CD avec Jenkins, j'ai contribué au développement d'un model de NLP "
                    "qui résume les logs du build en utilisant les transformers et la tokenérisation."
                ),
            },
            {
                "company": "EY Tunisie",
                "role": "Stagiaire AI/DATA",
                "location": "Tunisie",
                "start_date": "08/2026",
                "end_date": "09/2026",
                "experience_type": "stage",
                "technologies_raw": "Python, NetworkX, PowerBI, Isolation Forest",
                "description": (
                    "J'ai dirigé une mission de conseil simulée sur la détection de fraude fournisseurs, en jouant à la "
                    "fois le rôle du client et celui du consultant EY. J'ai cadré le problème métier et rédigé la charte "
                    "de projet, généré un jeu de données relationnel réaliste, puis effectué des diagnostics de qualité "
                    "des données et un nettoyage avant de construire un pipeline de détection à trois couches : des "
                    "règles métier avec des seuils spécifiques par fournisseur, un modèle non supervisé Isolation Forest "
                    "pour détecter des fraudes subtiles à signaux multiples, et une analyse de réseau (NetworkX, Louvain) "
                    "pour révéler des collusions entre employés et fournisseurs. J'ai ensuite validé le pipeline via "
                    "des tests de généralisation, de stabilité et de sensibilité aux seuils, orchestré le tout en un workflow "
                    "réutilisable unique, et livré les résultats via un tableau de bord Power BI interactif destiné aux "
                    "parties prenantes métier."
                ),
            },
            {
                "company": "Capgemini Tunisie",
                "role": "Stagiaire FinOps",
                "location": "Tunisie",
                "start_date": "06/2026",
                "end_date": "08/2026",
                "experience_type": "stage",
                "technologies_raw": "Angular, Docker, Python, TypeScript, GitHub, AWS, ChromaDB, Flask, LangGraph",
                "description": (
                    "J'ai développé une plateforme FinOps autonome construite sur une architecture multi-agents orchestrée "
                    "par LangGraph. Le système découvre automatiquement toutes les ressources d'un compte AWS via Resource "
                    "Explorer, collecte les données de coûts et les métriques techniques, détecte les anomalies de dépenses "
                    "à l'aide d'un LLM Groq, prévoit les coûts futurs, et génère des recommandations d'optimisation en "
                    "langage naturel. Toutes les analyses sont exposées via une API REST Flask consommée par un tableau "
                    "de bord Angular interactif. Parmi les fonctionnalités : un chatbot RAG (ChromaDB), des alertes Slack "
                    "automatiques pour les anomalies critiques, des rapports PDF hebdomadaires, et un déploiement complet "
                    "sur AWS (EC2, S3, Lambda, EventBridge)."
                ),
            },
            {
                "company": "Tache-Lik",
                "role": "Tuteur",
                "location": "Tunisie",
                "start_date": "10/2025",
                "end_date": "Présent",
                "experience_type": "job",
                "technologies_raw": "FlutterFlow, Mentoring, Mobile",
                "description": (
                    "En tant que tuteur sur Tachelik, une plateforme qui aide les étudiants à réaliser leurs projets "
                    "académiques, j'ai accompagné des apprenants dans le développement mobile avec FlutterFlow. J'ai créé "
                    "des vidéos de démonstration et animé des séances de mentorat individuel, renforçant mes compétences "
                    "en pédagogie, en communication et en résolution de problèmes, tout en aidant les étudiants à atteindre "
                    "les objectifs de leurs projets."
                ),
            },
        ]
        for exp in experiences_data:
            session.add(Experience(profile_id=profile.id, **exp))

        # 4. Projets Sélectionnés
        projects_data = [
            {
                "title": "Skill Sphere - Simulateur d'entretien IA",
                "role": "Lead Fullstack Developer",
                "description": (
                    "AI Interview Simulator est une application web fullstack construite avec Next.js et PostgreSQL, "
                    "qui aide les professionnels et étudiants en informatique à se préparer aux entretiens techniques. "
                    "Alimentée par l'API Grok AI, elle simule des scénarios d'entretien réalistes et fournit des indicateurs "
                    "de performance détaillés — mettant en avant les points forts, identifiant les points faibles et "
                    "offrant des retours concrets pour aider les candidats à progresser à chaque session."
                ),
                "technologies_raw": "NextJS, PostgreSQL, Grok",
            },
            {
                "title": "Fast Agil - Application mobile de gestion de queue",
                "role": "Mobile Developer",
                "description": (
                    "Une plateforme mobile au service d'Agil, un fournisseur tunisien de pétrole et de carburant, permettant "
                    "aux utilisateurs de réserver des rendez-vous et de suivre leur position dans la file d'attente à distance "
                    "grâce à des notifications en temps réel. Comprend un tableau de bord de gestion pour les responsables "
                    "et opérateurs, permettant de gérer les affectations du personnel, les guichets, ainsi que le statut des tickets et rendez-vous."
                ),
                "technologies_raw": "Firebase, Flutterflow",
            },
            {
                "title": "Insightify - Application de bureau de gestion pour les créateurs de podcasts",
                "role": "Desktop Software Developer",
                "description": (
                    "Une application de bureau offrant une gestion complète pour les podcasteurs, couvrant les ressources, "
                    "les employés, les transactions et les sponsors. Elle regroupe de nombreuses fonctionnalités, dont la "
                    "reconnaissance faciale et vocale, la messagerie interne, des statistiques détaillées et un suivi complet "
                    "de l'historique à des fins de traçabilité."
                ),
                "technologies_raw": "Arduino, C, C++, QtDesigner, Python, SqlDevelopper",
            },
            {
                "title": "Mon portfolio personnel",
                "role": "Fullstack Developer",
                "url": "https://www.louaycodes.tn/",
                "description": (
                    "Un site web personnel où je présente mes projets, les technologies que j'ai apprises, et mes stages. "
                    "Il comprend également une section d'avis clients et un panneau d'administration privé permettant de "
                    "gérer facilement tout le contenu, avec un déploiement automatique à chaque mise à jour."
                ),
                "technologies_raw": "Angular, Springboot, GitHub Actions, Azure, MySQL",
            },
            {
                "title": "Pipeline CI/CD auto-hébergé",
                "role": "DevOps Engineer",
                "description": (
                    "J'ai construit un pipeline CI/CD complet pour une application Spring Boot et Angular, s'exécutant "
                    "de bout en bout sur un serveur Linux auto-géré. Chaque push sur GitHub déclenche automatiquement "
                    "Jenkins via un webhook, qui exécute la compilation, teste le code, l'analyse avec SonarQube et "
                    "OWASP Dependency-Check, construit une image Docker, la pousse sur Docker Hub, et la déploie sur un "
                    "cluster Kubernetes. Prometheus et Grafana surveillent la santé du cluster, et Jenkins envoie un résumé "
                    "de build au format HTML par email après chaque exécution."
                ),
                "technologies_raw": "Jenkins, OWASP, Grafana, Prometheus, Kubernetes, Docker, SonarQube, Spring, Linux, MySQL",
            },
            {
                "title": "Cluverse - Plateforme SaaS de gestion de clubs universitaires",
                "role": "Fullstack & AI Engineer",
                "description": (
                    "Cluverse est une plateforme SaaS fullstack conçue pour centraliser la gestion complète des clubs universitaires. "
                    "Dans le cadre de ce projet, j'ai conçu et développé de bout en bout tout le pipeline intelligent de "
                    "recrutement — depuis la création de campagnes personnalisables avec un générateur de formulaires dynamique "
                    "et un tableau Kanban pour la gestion visuelle des candidats, jusqu'à une salle d'entretien entièrement "
                    "pilotée par l'IA intégrant la reconnaissance vocale en temps réel, la synthèse vocale, un avatar vidéo "
                    "dynamique et une évaluation automatisée des candidats alimentée par un grand modèle de langage."
                ),
                "technologies_raw": "Angular, SpringBoot, MySQL, Grok, GitHub",
            },
            {
                "title": "FinOps Agent - Système multi-agents autonome pour l'optimisation des coûts cloud AWS",
                "role": "Cloud Architect & AI Engineer",
                "description": (
                    "Une plateforme FinOps autonome construite sur une architecture multi-agents orchestrée par LangGraph. "
                    "Le système découvre automatiquement toutes les ressources d'un compte AWS via Resource Explorer, collecte "
                    "les données de coûts et les métriques techniques, détecte les anomalies de dépenses à l'aide d'un LLM Groq, "
                    "prévoit les coûts futurs, et génère des recommandations d'optimisation en langage naturel. Toutes les "
                    "analyses sont exposées via une API REST Flask consommée par un tableau de bord Angular interactif. Parmi "
                    "les fonctionnalités : un chatbot RAG (ChromaDB), des alertes Slack automatiques pour les anomalies "
                    "critiques, des rapports PDF hebdomadaires, et un déploiement complet sur AWS (EC2, S3, Lambda, EventBridge)."
                ),
                "technologies_raw": "LangGraph, Flask, ChromaDB, AWS, TypeScript, Python, Docker, Angular",
            },
            {
                "title": "Infrastructure de cloud privé distribuée de niveau entreprise avec observabilité en temps réel",
                "role": "Cloud Infrastructure Engineer",
                "description": (
                    "Plateforme de cloud privé de niveau entreprise, construite sur un cluster physique distribué de 7 nœuds, "
                    "combinant la virtualisation IaaS avec OpenStack, l'orchestration de conteneurs avec Kubernetes et un "
                    "provisionnement entièrement automatisé via Ansible (Infrastructure as Code). Une application full-stack "
                    "Spring Boot / Angular a été conteneurisée avec Docker et déployée sur le cluster, démontrant un pipeline "
                    "DevOps de bout en bout, du bare-metal jusqu'à la charge de travail en production. L'ensemble de la plateforme "
                    "est supervisé par une stack d'observabilité Prometheus et Grafana, avec des tableaux de bord personnalisés "
                    "suivant la santé du cluster, l'utilisation des ressources OpenStack et les métriques au niveau des pods "
                    "Kubernetes. Réalisé en équipe de 7 personnes, le projet reproduit à plus petite échelle l'architecture "
                    "d'un véritable cloud privé d'entreprise."
                ),
                "technologies_raw": "OpenStack, Docker, Kubernetes, Ansible, Prometheus, Grafana, ProphetAI, GitHub Actions, Python",
            },
        ]
        for proj in projects_data:
            session.add(Project(profile_id=profile.id, **proj))

        # 5. Compétences Techniques (Skills)
        skills_by_category = {
            "Cloud & DevOps": [
                "OpenStack", "Kubernetes", "Docker", "Ansible", "Prometheus", "Grafana", "Zabbix", "AWS", "Azure"
            ],
            "Réseaux & Systèmes": [
                "TCP/IP", "VMware Networking", "Cisco CCNA2", "NetworkX", "Linux (Ubuntu)"
            ],
            "Backend": [
                "Spring Boot", "Symfony", "REST API", "GraphQL", "Node.js", "Flask", ".NET", "C#"
            ],
            "Frontend": [
                "Angular", "Next.js", "TypeScript", "JavaScript", "Flutterflow", "JavaFX", "QtDesigner"
            ],
            "Langages": [
                "Python", "Java", "C", "C++", "PHP", "SQL"
            ],
            "Outils & Méthodes": [
                "Git", "GitHub Actions", "Jenkins", "SonarQube", "OWASP", "ChromaDB", "LangGraph", "PowerBI", "Firebase", "Agile/Scrum", "PostgreSQL", "MySQL", "Arduino"
            ],
        }

        for cat, sk_list in skills_by_category.items():
            for sk_name in sk_list:
                session.add(Skill(profile_id=profile.id, name=sk_name, category=cat, level="Avancé"))

        # Re-calcul de la complétude
        session.commit()
        session.refresh(profile)
        status = evaluate_profile_completeness(profile)
        profile.is_complete = status.is_complete
        profile.updated_at = utc_now()
        session.add(profile)
        session.commit()

        print(f"[OK] Profil de Louay Zorai mis à jour avec succès !")
        print(f"Nom : {profile.full_name}")
        print(f"Complétude : {status.completion_percentage}% (Complet: {status.is_complete})")
        print(f"Formations : {len(profile.educations)}")
        print(f"Expériences : {len(profile.experiences)}")
        print(f"Projets : {len(profile.projects)}")
        print(f"Compétences : {len(profile.skills)}")

if __name__ == "__main__":
    main()
