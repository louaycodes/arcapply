# Epic 1 Context: ArcApply MVP Copilote de Candidature PFE

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Permettre à l'élève-ingénieur de rechercher, cibler et postuler avec succès à des stages de fin d'études (PFE) en France et Tunisie en réduisant le cycle de préparation de chaque candidature de 45 minutes à moins de 3 minutes, grâce à un cockpit local découplé combinant agrégation d'offres, adaptation déterministe de CV sans hallucination, scoring ATS, génération de lettre sobre, sas de validation humaine et suivi de pipeline jusqu'aux entretiens.

## Stories

- Story 1.1: Initialiser le socle découplé et la gestion immuable du Master Profile
- Story 1.2: Ingestion automatisée et flux Radar d'offres de stage PFE
- Story 1.3: Calcul d'alignement ATS déterministe et inventaire des écarts de compétences
- Story 1.4: Génération de CV ciblé zéro-hallucination et rendu PDF ATS 1 page
- Story 1.5: Rédaction de lettre de motivation sur-mesure au ton sobre d'élève-ingénieur
- Story 1.6: Vue miroir de révision et déclencheur de soumission assistée en un clic
- Story 1.7: Suivi Kanban du cycle de vie des candidatures et métriques de conversion
- Story 1.8: Ingestion automatique des emails recruteurs et mise à jour dynamique du statut

## Requirements & Constraints

- **Zéro-hallucination Invariant :** Les générateurs de CV et de lettres s'appuient exclusivement sur les données validées du Master Profile. Aucune extrapolation, compétence non vérifiée ou affabulation n'est tolérée.
- **Validation humaine obligatoire (Human-in-the-Loop) :** Aucune candidature ne peut être soumise ni marquée envoyée sans action explicite et manuelle de l'utilisateur (délai d'annulation de 5 secondes).
- **Complétude du Master Profile :** Le système valide la complétude du Master Profile (formation, projets, compétences, expériences) et bloque toute génération tant que les champs obligatoires ne sont pas renseignés.
- **Formats & Standards :** Le CV généré doit être un document PDF vectoriel d'une seule page, lisible par les parseurs ATS (pas de multi-colonnes complexes perturbantes).
- **Scraping éthique et résilient :** Les connecteurs Playwright doivent appliquer un jitter aléatoire et un plafonnement de requêtes pour prévenir tout bannissement de compte.
- **Stockage souverain local :** L'ensemble des données, sessions et cookies est confiné localement sur la machine hôte dans `~/.arcapply/arcapply.db`. Pas de stockage cloud multi-tenant.

## Technical Decisions

- **Architecture découplée (Hexagonale / Ports-and-Adapters) :**
  - Frontend Cockpit : Next.js 15+ (App Router), Tailwind CSS, shadcn/ui, TanStack Query dans `apps/web/`.
  - Moteur Backend : FastAPI Python 3.12+, SQLModel / SQLite, Playwright, Instructor dans `services/engine/`.
- **Propriété exclusive de la persistance (AD-2) :** Seul le backend FastAPI lit et écrit dans `~/.arcapply/arcapply.db`. Le frontend communique uniquement par API REST et flux SSE.
- **Communication hybride REST + SSE (AD-3) :** Commandes et mutations par REST (avec codes HTTP RFC 7807), télémétrie asynchrone et progression par SSE (`/api/events`).
- **Pipeline IA déterministe en 3 étapes (AD-4) :**
  1. Extraction structurée Pydantic (`JobRequirements`) via Instructor + Grok.
  2. Matching déterministe hors-LLM (intersection stricte avec le Master Profile).
  3. Génération contrainte injectant uniquement les fragments validés à l'étape 2.
- **Rendu PDF ATS (AD-7) :** Modèle HTML/CSS imprimable converti en PDF vectoriel sélectionnable via `page.pdf()` de Playwright en mémoire.
- **Conventions :** Identifiants UUIDv7, horodatage ISO 8601 UTC, conventions `snake_case` (Python/JSON) et `camelCase` (TypeScript/React).

## UX & Interaction Patterns

- **Cockpit Desktop-First & Mobile Responsive :** Consultation rapide du radar d'offres et du Kanban sur mobile ; revue miroir et validation avancée optimisées pour desktop.
- **Vue Miroir Double Colonne :** Confrontation directe de l'offre originale à gauche et du dossier adapté (CV PDF + lettre) à droite avec mise en valeur des correspondances de mots-clés.
- **Badge d'Alignement ATS Interactif :** Score dynamique en pourcentage avec ventilation immédiate : compétences correspondantes (vert), transférables (jaune), manquantes (rouge).
- **Bouton d'action principale avec Sas de Sécurité :** Compte à rebours d'annulation de 5 secondes lors de la confirmation d'envoi.

## Cross-Story Dependencies

- **Story 1.1** constitue le prérequis absolu pour l'ensemble des stories suivantes (schéma SQLite, Master Profile, structure monorepo).
- **Story 1.2** alimente le flux d'offres nécessaire aux Stories 1.3, 1.4, 1.5 et 1.6.
- **Story 1.3** fournit les correspondances et le score ATS consommés par la génération de CV (1.4) et de lettre (1.5).
- **Stories 1.4 et 1.5** alimentent la vue miroir et la validation de la Story 1.6.
- **Story 1.6** alimente le Kanban de la Story 1.7 lors du passage à l'état Postulé.
- **Story 1.8** écoute les retours externes pour mettre à jour les cartes du Kanban de la Story 1.7.
