# ArcApply - Découpage des Epics et User Stories

## Overview

Ce document regroupe les epics et user stories pour le projet ArcApply, formalisés à partir des spécifications techniques et fonctionnelles (SPEC.md, ARCHITECTURE-SPINE.md, DESIGN.md, EXPERIENCE.md).

## Epic 1: ArcApply MVP Copilote de Candidature PFE

L'Epic 1 rassemble l'ensemble des capacités fondamentales permettant à l'étudiant ingénieur d'agréger des offres de stage PFE, d'adapter son CV et sa lettre de motivation sans hallucination, d'évaluer son adéquation ATS, de valider manuellement ses envois et de suivre son pipeline jusqu'aux entretiens.

### Story 1.1: Initialiser le socle découplé et la gestion immuable du Master Profile

En tant qu'étudiant ingénieur,
Je veux initialiser l'environnement monorepo et renseigner mon Master Profile immuable,
Afin de disposer d'une base de vérité fiable et souveraine pour toutes les futures générations de candidatures.

**Acceptance Criteria:**
- **Given** un environnement vierge,
  **When** le projet est configuré,
  **Then** l'architecture monorepo (apps/web en Next.js et services/engine en FastAPI) est opérationnelle avec persistance SQLite locale (~/.arcapply/arcapply.db).
- **Given** un Master Profile incomplet ou non renseigné,
  **When** l'utilisateur tente d'initialiser une candidature,
  **Then** le système bloque toute génération (CAP-1) et invite à compléter les champs obligatoires.

### Story 1.2: Ingestion automatisée et flux Radar d'offres de stage PFE

En tant qu'étudiant ingénieur,
Je veux collecter automatiquement des offres ciblées depuis LinkedIn et Jobteaser avec déduplication,
Afin de découvrir en temps réel les opportunités de stage pertinentes sans passer des heures à prospecter manuellement.

**Acceptance Criteria:**
- **Given** des critères de recherche configurés (mots-clés, localisations France/Tunisie),
  **When** la collecte est lancée,
  **Then** les offres sont scrappées via Playwright avec un jitter aléatoire et un rate limiting stricts, puis dédupliquées en base locale.
- **Given** de nouvelles offres détectées,
  **When** le cockpit web est ouvert,
  **Then** le flux d'opportunités Radar s'actualise en temps réel via Server-Sent Events (SSE).

### Story 1.3: Calcul d'alignement ATS déterministe et inventaire des écarts de compétences

En tant qu'étudiant ingénieur,
Je veux évaluer mathématiquement la correspondance entre mon profil et une offre d'emploi,
Afin de mesurer mes chances réelles et d'identifier immédiatement les compétences exactes, transférables ou manquantes.

**Acceptance Criteria:**
- **Given** une offre de stage sélectionnée et le Master Profile validé,
  **When** l'analyse d'adéquation est déclenchée,
  **Then** un score d'alignement ATS (0 à 100%) déterministe est calculé sans extrapolation.
- **Given** le résultat du scoring,
  **When** la ventilation s'affiche,
  **Then** les compétences sont classées sans ambiguïté en correspondances directes, transférables et lacunes réelles.

### Story 1.4: Génération de CV ciblé zéro-hallucination et rendu PDF ATS 1 page

En tant qu'étudiant ingénieur,
Je veux générer un CV sur-mesure au format PDF vectoriel 1 page strictement basé sur mes compétences réelles,
Afin de maximiser ma réussite aux filtres ATS sans risque d'affabulation lors de l'entretien technique.

**Acceptance Criteria:**
- **Given** une offre cible et les réalisations du Master Profile,
  **When** le CV est compilé,
  **Then** seules les expériences et compétences présentes dans le profil maître sont réordonnées et valorisées (zéro hallucination).
- **Given** le document produit,
  **When** il est exporté via Playwright,
  **Then** il génère un PDF vectoriel d'exactement 1 page conforme aux exigences typographiques ATS.

### Story 1.5: Rédaction de lettre de motivation sur-mesure au ton sobre d'élève-ingénieur

En tant qu'étudiant ingénieur,
Je veux rédiger une lettre de motivation personnalisée adoptant un ton sobre et crédible,
Afin de convaincre les recruteurs avec des arguments factuels sans recourir aux clichés IA stéréotypés.

**Acceptance Criteria:**
- **Given** l'analyse de l'offre et les projets pertinents de l'étudiant,
  **When** le projet de lettre est généré avec Grok / Instructor,
  **Then** le texte adopte un style d'élève-ingénieur concis, direct et ciblé.
- **Given** le filtre anti-clichés actif,
  **When** la lettre est examinée,
  **Then** aucune expression bannie (ex. « dynamique et motivé », « enthousiaste à l'idée de ») ne figure dans le contenu final.

### Story 1.6: Vue miroir de révision et déclencheur de soumission assistée sous contrôle humain

En tant qu'étudiant ingénieur,
Je veux relire et ajuster côte à côte l'offre, le CV et la lettre avant de valider l'envoi,
Afin de garder le contrôle absolu sur chaque candidature sans risquer un envoi automatique incontrôlé.

**Acceptance Criteria:**
- **Given** un package de candidature préparé,
  **When** l'utilisateur ouvre le tiroir d'inspection miroir,
  **Then** l'offre et les pièces générées sont éditables en ligne.
- **Given** une candidature prête,
  **When** aucune action manuelle explicite de l'utilisateur n'est intervenue,
  **Then** la candidature ne peut en aucun cas être transmise ni marquée « Postulé » (règle Human-in-the-loop).

### Story 1.7: Suivi Kanban du cycle de vie des candidatures et métriques de conversion

En tant qu'étudiant ingénieur,
Je veux piloter mes candidatures sur un tableau Kanban à 7 étapes responsive sur mobile,
Afin de suivre l'évolution de mes démarches et analyser mon taux de conversion en entretien.

**Acceptance Criteria:**
- **Given** le tableau de bord Kanban ouvert sur desktop ou smartphone,
  **When** une candidature progresse,
  **Then** les colonnes (Découverte, À valider, Postulé, Réponse reçue, Entretien, Offre, Archivé) se mettent à jour avec horodatage de transition persistant en base SQLite.
- **Given** l'ensemble des cartes,
  **When** les métriques sont consultées,
  **Then** le taux de conversion global et le volume de candidatures par étape sont actualisés.

### Story 1.8: Ingestion automatique des emails recruteurs et mise à jour de statut

En tant qu'étudiant ingénieur,
Je veux que les réponses des recruteurs reçues par email soient automatiquement détectées et catégorisées,
Afin d'actualiser immédiatement le statut de mes candidatures sans saisie manuelle.

**Acceptance Criteria:**
- **Given** une boîte mail configurée en IMAP/OAuth sécurisé local,
  **When** un nouvel email d'un recruteur est réceptionné,
  **Then** le connecteur l'analyse, le classe (entretien, refus, accusé) et l'associe à la candidature correspondante.
- **Given** la classification effectuée,
  **When** la candidature est mise à jour,
  **Then** sa carte bascule automatiquement dans l'étape appropriée (ex. « Entretien ») avec l'extrait pertinent archivé.
