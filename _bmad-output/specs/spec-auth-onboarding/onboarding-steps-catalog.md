# Catalogue des 12 Étapes d'Onboarding Profil

Ce document spécifie le découpage exhaustif, les données capturées, les validations requises et les correspondances avec le `MasterProfile` pour chaque étape du parcours d'onboarding.

---

## Vue d'Ensemble du Parcours

| Étape | Intitulé Fonctionnel | Champs Capturés | Caractère Obligatoire | Modèle Persistance |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Identité Civile | Prénom, Nom | Obligatoire | `MasterProfile.full_name` |
| **2** | Coordonnées & Liens | Email, Téléphone, Ville, Pays, LinkedIn, GitHub, Portfolio | Email obligatoire, reste optionnel | `MasterProfile.email`, `phone`, `location`, `linkedin_url`, `github_url`, `portfolio_url` |
| **3** | Mode de Recherche | Type (`PFE`, `STAGE`, `JOB`), Rôle visé, Date de début, Durée, Mobilité, Télétravail | Obligatoire | `MasterProfile.search_mode`, `target_role`, `availability_date`, `target_contract_duration`, `target_locations`, `remote_preference` |
| **4** | Moteur IA (Clé Groq) | Clé API Groq personnelle | Optionnel (avec test en direct) | `MasterProfile.groq_api_key` |
| **5** | Titre & Synthèse | Headline (FR/EN), Bio/Pitch (FR/EN) | Headline obligatoire | `MasterProfile.headline`, `headline_fr`, `headline_en`, `bio`, `bio_fr`, `bio_en` |
| **6** | Formations | Établissement, Diplôme/Filière, Années début/fin, Description | Au moins 1 formation requise | `MasterProfile.educations` (`List[Education]`) |
| **7** | Expériences & Stages | Entreprise, Poste, Localisation, Dates, Réalisations | Optionnel pour débutants | `MasterProfile.experiences` (`List[Experience]`) |
| **8** | Projets Ingénierie | Titre, Rôle, Description, Technologies, Lien repo/démo | Au moins 1 projet requis si 0 expérience | `MasterProfile.projects` (`List[Project]`) |
| **9** | Compétences Techniques | Compétences catégorisées (Langages, Frameworks, Bases de données, Cloud, Outils) | Au moins 3 compétences requises | `MasterProfile.skills` (`List[Skill]`) |
| **10** | Langues Maîtrisées | Langue, Niveau CECRL (A1 à C2, Langue Maternelle) | Au moins 1 langue requise | `MasterProfile.languages` (`List[Language]`) |
| **11** | Centres d'Intérêt | Activités, Engagements associatifs, Passions | Optionnel | `MasterProfile.interests` (`List[str]`) |
| **12** | Bilan & Activation | Score de complétude, Synchronisation miroir, Activation | Validation finale | `MasterProfile.is_complete`, `User.onboarding_completed` |

---

## Spécification Détaillée par Étape

### Étape 1 : Identité Civile (`/onboarding/step-1`)
- **Champs :** `firstName` (chaîne, min 2 car.), `lastName` (chaîne, min 2 car.).
- **Transformation :** Concaténation `${firstName} ${lastName}` persistée dans `MasterProfile.full_name`.
- **Validation :** Bloque la navigation si prénom ou nom est vide.

### Étape 2 : Coordonnées & Contact (`/onboarding/step-2`)
- **Champs :** `email` (format valide), `phone` (format international tolérant), `location` (ville, pays), `linkedin_url` (URL valide ou vide), `github_url` (URL valide ou vide), `portfolio_url` (URL valide ou vide).
- **Validation :** Vérification stricte du format email (RFC 5322). Les URLs doivent démarrer par `http://` ou `https://`.

### Étape 3 : Mode de Recherche & Disponibilité (`/onboarding/step-3`)
- **Champs :**
  - `search_mode` : Énumération stricte (`PFE`, `STAGE`, `JOB`).
  - `target_role` : Chaîne descriptive (ex. "Ingénieur Logiciel Full Stack").
  - `availability_date` : Date ISO (YYYY-MM-DD).
  - `target_contract_duration` : Mois (ex. 6 pour PFE).
  - `target_locations` : Liste de chaînes (ex. `["France", "Tunisie"]`).
  - `remote_preference` : Énumération (`ON_SITE`, `HYBRID`, `FULL_REMOTE`, `FLEXIBLE`).
- **Validation :** `target_role` et au moins une localisation cible obligatoires.

### Étape 4 : Moteur IA & Clé Groq (`/onboarding/step-4`)
- **Champs :** `groq_api_key` (chaîne masquée, optionnelle).
- **Comportement actif :**
  - Bouton "Tester la clé" appelant `POST /api/profile/test-groq-key`.
  - Retour visuel immédiat : succès de connexion ou code d'erreur détaillé (401 invalid key, rate limit, timeout).
  - L'étape peut être passée même sans clé renseignée (mode secours déterministe activé).

### Étape 5 : Titre Professionnel & Pitch (`/onboarding/step-5`)
- **Champs :**
  - `headline_fr` & `headline_en` : Titre percutant (max 120 caractères).
  - `bio_fr` & `bio_en` : Résumé professionnel / accroche (max 600 caractères).
- **Validation :** Le titre (`headline_fr` ou `headline`) est requis.

### Étape 6 : Formations Académiques (`/onboarding/step-6`)
- **Champs par entrée :** `school`, `degree`, `start_year`, `end_year`, `description`.
- **Validation :** Au moins une formation complète (`school` + `degree`) est obligatoire.

### Étape 7 : Expériences Professionnelles & Stages (`/onboarding/step-7`)
- **Champs par entrée :** `company`, `role`, `location`, `start_date`, `end_date`, `bullet_points` (réalisations mesurables sans invention).
- **Règle :** Optionnel si le candidat est un pur débutant disposant de projets d'ingénierie (étape 8).

### Étape 8 : Projets d'Ingénierie & Personnels (`/onboarding/step-8`)
- **Champs par entrée :** `title`, `role`, `description`, `technologies` (liste), `url`.
- **Validation :** Si le candidat n'a renseigné aucune expérience à l'étape 7, au moins un projet technique majeur est requis.

### Étape 9 : Compétences Techniques & Outils (`/onboarding/step-9`)
- **Catégories pré-remplies :** `Languages`, `Frameworks`, `Databases`, `DevOps & Cloud`, `Tools & Methodologies`.
- **Champs par compétence :** `name`, `category`, `level` (optionnel).
- **Validation :** Un minimum de 3 compétences techniques distinctes est exigé pour alimenter le moteur d'alignement ATS.

### Étape 10 : Langues Maîtrisées (`/onboarding/step-10`)
- **Champs par langue :** `name`, `level` (`A1`, `A2`, `B1`, `B2`, `C1`, `C2`, `Langue Maternelle`).
- **Validation :** Au moins une langue renseignée (par défaut Français ou Anglais).

### Étape 11 : Centres d'Intérêt & Engagements (`/onboarding/step-11`)
- **Champs :** Liste de libellés courts (ex. "Robotique amateur", "Hackathons", "Volontariat").
- **Caractère :** Purement optionnel.

### Étape 12 : Bilan, Vérification ATS & Activation (`/onboarding/step-12`)
- **Calculs et actions :**
  - Calcul du score de complétude (0 à 100%) basé sur les critères de complétude du Master Profile.
  - Déclenchement de `POST /api/auth/complete-onboarding` marquant `User.onboarding_completed = true`.
  - Déclenchement en tâche de fond de `syncProfileMirror` pour aligner les projections ATS.
  - Redirection automatique vers le Cockpit (`/`).
