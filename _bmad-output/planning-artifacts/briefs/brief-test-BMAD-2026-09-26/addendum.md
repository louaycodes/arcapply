# Addendum : ArcApply

Ce document rassemble les détails techniques, contraintes d'implémentation et éléments de cadrage approfondis recueillis lors de la phase de Product Brief, destinés aux étapes d'Architecture et de PRD.

---

## 1. Modèle du "Master Profile" (Source de vérité)

- **Principe fondamental** : L'étudiant saisit exhaustivement l'intégralité de son parcours une seule fois.
- **Contenu du Master Profile** :
  - Identité, liens (LinkedIn, GitHub, Portfolio).
  - Formations et diplômes (ArcTIC, cycle d'ingénieur, prépa, etc.).
  - Stages d'été et expériences professionnelles (missions, contexte, technos, résultats chiffrés).
  - Projets académiques et projets personnels (description détaillée, stack technique, liens vers repos).
  - Stack technique et compétences (langages, frameworks, outils, cloud, bases de données, niveaux réels).
  - Qualités, soft skills, méthodologies (Agile/Scrum, CI/CD, etc.).
  - Préférences de recherche : types de stage (PFE 6 mois, début janvier 2027), villes cibles (France & Tunisie), entreprises visées.
- **Règle absolue d'anti-hallucination** : Le module d'adaptation du CV et de génération de lettre ne doit **jamais** inventer ou extrapoler des compétences non présentes dans ce Master Profile.

---

## 2. Spécificités d'intégration des plateformes

### LinkedIn
- **Candidatures simplifiées (Easy Apply)** :
  - Détection automatique des questions récurrentes.
  - Pré-remplissage automatisé des formulaires modaux.
  - Pause systématique sur l'écran final avant le clic de soumission pour validation humaine.
- **Redirections externes** :
  - Détection de l'URL cible de redirection.
  - Génération immédiate du PDF du CV adapté + lettre prête à coller dans le presse-papier.
  - Suivi automatique de l'offre dans le Kanban avec statut "En cours de candidature externe".

### Jobteaser
- Accès aux offres via session authentifiée étudiant (flux partenaires écoles).
- Parsing des fiches de poste (dates de stage, gratification, compétences requises).
- Candidatures directes vs formulaires employeurs.

---

## 3. Mécanisme de scoring ATS et personnalisation

- **Extraction des mots-clés de l'offre** : Hard skills, outils, méthodologies et intitulés de postes.
- **Calcul du score ATS** : Comparaison sémantique et lexicale entre le CV ajusté et la fiche de poste (score cible $\ge$ 75-80%).
- **Recommandations de réorganisation** : Priorisation des projets ou compétences les plus pertinents en tête de section.
- **Génération de lettre** :
  - Ton naturel, professionnel, étudiant ingénieur enthousiaste mais factuel.
  - Éviter le jargon générique d'IA ("*Je me permets de vous contacter car j'ai l'intime conviction...*").
  - Structure concise : accroche ciblée sur l'entreprise, 2 preuves concrètes issues du Master Profile, disponibilité pour le stage PFE.

---

## 4. Roadmap & Fonctionnalités différées (V2)

- Relances automatiques d'emails après $N$ jours sans réponse.
- Intégration de plateformes supplémentaires : Welcome to the Jungle, Moovijob, Apec, Indeed.
- Module communautaire open-source : système de plugins/scrapers modulaires pour que d'autres étudiants puissent ajouter de nouveaux connecteurs d'offres.
- Extension navigateur complémentaire pour assister le remplissage des ATS lourds (Workday, Taleo, Greenhouse, Lever).
