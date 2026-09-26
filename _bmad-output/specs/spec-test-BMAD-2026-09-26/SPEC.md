---
id: SPEC-test-BMAD-2026-09-26
companions:
  - ../../planning-artifacts/architecture/architecture-test-BMAD-2026-09-26/ARCHITECTURE-SPINE.md
  - ../../planning-artifacts/ux-designs/ux-test-BMAD-2026-09-26/DESIGN.md
  - ../../planning-artifacts/ux-designs/ux-test-BMAD-2026-09-26/EXPERIENCE.md
sources:
  - ../../planning-artifacts/briefs/brief-test-BMAD-2026-09-26/brief.md
  - ../../planning-artifacts/briefs/brief-test-BMAD-2026-09-26/addendum.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Spec — ArcApply

## Why

La recherche d'un stage de fin d'études (PFE) d'excellence pour janvier 2027 (France et Tunisie) confronte l'étudiant ingénieur à une asymétrie critique : la démarche manuelle exige 30 à 45 minutes par offre (plafonnant le volume à 2-3 candidatures/jour), tandis que les bots existants spamment des candidatures génériques ou hallucinent des compétences conduisant au rejet ATS. ArcApply résout cette tension en réduisant le cycle à moins de 3 minutes par candidature ciblée grâce à un copilote web responsive local qui agrège les offres, adapte le CV à partir d'un Master Profile vérifié (zéro hallucination), calcule un score d'alignement ATS prédictif, rédige une lettre authentique sous contrôle d'une validation humaine en un clic, et trie automatiquement les réponses des recruteurs reçues par email.

## Capabilities

- **CAP-1**
  - **intent:** L'utilisateur peut renseigner, structurer et maintenir un profil personnel exhaustif (formations, projets techniques, compétences, expériences) qui sert de source unique et immuable de vérité pour toutes les générations.
  - **success:** Le système valide la complétude du profil maître et bloque toute génération de CV ou lettre tant que les champs obligatoires ne sont pas renseignés.

- **CAP-2**
  - **intent:** Le système collecte et centralise automatiquement les offres de stage PFE depuis les plateformes cibles (LinkedIn, Jobteaser) selon des critères configurés (mots-clés, localisations France/Tunisie).
  - **success:** Chaque exécution importe les nouvelles offres non dupliquées avec leurs métadonnées complètes (titre, entreprise, ville, description brute, URL source) dans le flux d'opportunités.

- **CAP-3**
  - **intent:** Le système confronte la description de l'offre au Master Profile pour calculer un score d'alignement ATS prédictif et catégoriser les compétences (correspondances exactes, compétences transférables, technologies absentes).
  - **success:** Pour toute offre inspectée, l'interface affiche le score en pourcentage et l'inventaire exhaustif des compétences couvertes et manquantes, sans inventer ni déduire arbitrairement des acquis absents du profil.

- **CAP-4**
  - **intent:** Le système compile un CV personnalisé sélectionnant et réordonnant uniquement les compétences et projets du Master Profile les plus pertinents pour l'offre ciblée.
  - **success:** Aucun terme ou compétence absent du Master Profile n'apparaît dans le CV généré, et un document PDF vectoriel d'une seule page conforme aux standards ATS est compilé.

- **CAP-5**
  - **intent:** Le système génère un projet de lettre de motivation adapté aux enjeux de l'offre en adoptant un ton sobre, technique et naturel d'élève-ingénieur.
  - **success:** La lettre met en valeur les réalisations réelles de l'étudiant en lien avec l'offre tout en éliminant les formulations IA stéréotypées (ex. « dynamique et motivé », « enthousiaste à l'idée de »).

- **CAP-6**
  - **intent:** L'utilisateur examine en vue miroir l'offre et les pièces générées, édite le contenu si nécessaire, et déclenche la soumission assistée en un clic ou prépare le package externe.
  - **success:** Aucune candidature n'est transmise ou marquée « envoyée » sans action explicite de validation de l'utilisateur (génération du package complet ou soumission assistée Easy Apply).

- **CAP-7**
  - **intent:** L'utilisateur visualise et orchestre l'avancement de chaque candidature à travers les phases de son cycle de vie (Découverte, À valider, Postulé, Réponse reçue, Entretien, Offre, Archivé/Rejeté).
  - **success:** Tout changement d'état persiste l'historique horodaté des actions et actualise les compteurs de conversion du tableau de bord.

- **CAP-8**
  - **intent:** Le système inspecte périodiquement la boîte de réception email de l'utilisateur pour détecter, classer (entretien, refus, accusé de réception) et associer automatiquement les réponses des recruteurs à la candidature correspondante.
  - **success:** Dès détection d'un email de retour recruteur, l'état de la candidature correspondante est automatiquement mis à jour dans le Kanban avec l'extrait pertinent archivé sans saisie manuelle.

## Constraints

- Le moteur de génération est strictement borné par le Master Profile de l'utilisateur : zéro hallucination, aucune extrapolation ni compétence non acquise n'est tolérée.
- Aucune soumission de candidature ni transition vers l'état « Envoyé » ne peut être exécutée de manière autonome sans validation manuelle explicite de l'utilisateur.
- L'interface web (Next.js) et le moteur d'automatisation/LLM (FastAPI/Python) s'exécutent dans des processus séparés via REST et flux SSE ; le frontend n'accède jamais directement à SQLite ni à Playwright.
- Toutes les données (profil maître, sessions, offres et candidatures) résident dans une base locale SQLite (`~/.arcapply/arcapply.db`) souveraine sans stockage cloud multi-tenant pour le MVP.
- Le CV généré doit être un PDF vectoriel d'une seule page conforme aux standards ATS (mise en page simple, lisible par les parseurs automatiques).
- Les connecteurs de scraping Playwright doivent appliquer un délai aléatoire (jitter) et un plafonnement de requêtes pour éviter les blocages de compte sur LinkedIn et Jobteaser.
- L'application web cockpit doit être responsive et utilisable sur navigateur mobile pour la consultation et le suivi du pipeline de candidatures.

## Non-goals

- Pas de candidature de masse autonome sans supervision (*no blind auto-apply*).
- Pas d'envoi automatique d'emails sortants de relance non supervisés (l'envoi reste manuel ou assisté).
- Pas d'intégration d'autres job boards que LinkedIn et Jobteaser dans le périmètre initial du MVP.
- Pas d'extension de navigateur autonome dédiée au franchissement de formulaires ATS tiers complexes (Workday, Taleo).
- Pas de mode multi-utilisateurs ni de déploiement cloud multi-tenant.

## Success signal

- L'étudiant prépare et valide une candidature ciblée (CV PDF adapté sans hallucination + lettre personnalisée + alignement ATS >= 75%) en moins de 3 minutes sur son cockpit web (desktop ou mobile), la transmet, puis, à réception de la réponse du recruteur, le connecteur email détecte la notification et fait basculer automatiquement la carte en « Entretien » dans le Kanban, aboutissant à la sécurisation d'un stage PFE d'excellence pour janvier 2027 avec un taux de conversion en entretien supérieur à 15%.
