---
id: SPEC-multi-tenant-isolation
companions:
  - isolation-architecture.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Spécification : Isolation Multi-Tenant et Étanchéité Stricte des Comptes

## Why

ArcApply accompagne des élèves-ingénieurs dans leur recherche d'emploi et de stage PFE. Lorsque plusieurs utilisateurs cohabitent sur une même instance, aucune fuite de données inter-comptes n'est admissible : un candidat ne doit jamais voir les offres scrapées par un autre, recevoir les notifications de découverte d'un tiers dans son radar, consulter les interactions recruteurs privées ou synthétiser des candidatures basées sur le profil d'un autre candidat. L'absence d'étanchéité stricte compromet la confidentialité des recherches, pollue les flux de veille et brise l'expérience d'un cockpit personnalisé et déterministe.

## Capabilities

- **CAP-1**
  - **intent:** L'utilisateur connecté peut déclencher des collectes de scraping et suivre leur progression sans impacter ni être impacté par les sessions de scraping des autres utilisateurs.
  - **success:** Lorsque deux utilisateurs déclenchent simultanément ou successivement un crawl, chacun reçoit son propre bilan de collecte et ses offres dédiées sans verrouillage croisé ni contamination des résultats.

- **CAP-2**
  - **intent:** L'utilisateur connecté reçoit en temps réel via le flux Server-Sent Events (SSE) uniquement les événements de télémétrie et d'offres découverts pour son propre compte.
  - **success:** Un test simulant deux abonnements SSE distincts prouve que les événements `JOB_DISCOVERED` et `SCRAPE_PROGRESS` émis pour le compte A n'apparaissent jamais dans le flux du compte B.

- **CAP-3**
  - **intent:** L'utilisateur accède, archive et fait progresser dans le pipeline Kanban uniquement les offres d'emploi rattachées à son identifiant de compte.
  - **success:** Une tentative d'accès, d'archivage ou de transition d'état sur une offre appartenant à un autre utilisateur retourne une réponse 404 Not Found sans modifier l'offre cible.

- **CAP-4**
  - **intent:** Le candidat génère ses CV ciblés, lettres de motivation sobre et scores d'alignement ATS exclusivement à partir de son propre Master Profile vérifié.
  - **success:** Les documents PDF compilés, lettres générées et scores ATS d'un compte ne comportent aucune mention, compétence ou expérience issue du profil d'un tiers.

- **CAP-5**
  - **intent:** L'utilisateur stocke ses brouillons dans Studio CV et consulte ses correspondances avec les recruteurs en parfaite isolation de tout autre compte.
  - **success:** La consultation des emails récents et des brouillons d'édition CV renvoie exclusivement les données enregistrées par l'utilisateur actif.

## Constraints

- Toute requête de consultation ou de mutation sur une entité propre à un tenant doit vérifier l'appartenance au compte actif (`user_id == username`).
- En cas de tentative d'accès à une ressource appartenant à un tiers, l'API doit renvoyer un code HTTP 404 pour prévenir l'énumération de ressources.
- L'isolation des flux Server-Sent Events doit supporter la contrainte native du protocole `EventSource` des navigateurs (authentification via paramètre de requête).
- Toutes les évolutions du schéma de base de données SQLite doivent intégrer des migrations additives idempotentes dans `_migrate_db(engine)` conformément à la politique de stabilité du dépôt.
- Les flux de tests et d'exécution locale mono-utilisateur doivent conserver leur rétrocompatibilité en retombant sur le compte par défaut (`louay`) en l'absence de contexte d'authentification explicite.

## Non-goals

- Implémentation d'une hiérarchie d'organisations multi-niveaux ou d'espaces de travail partagés (chaque candidat est un tenant autonome).
- Séparation physique en bases de données SQLite distinctes par utilisateur (la séparation est logique, indexée par `user_id` au sein de la base unifiée).
- Système de partage collaboratif d'offres ou de profils entre utilisateurs.

## Success signal

- Une suite de tests d'intégration automatisée démontre qu'un utilisateur A et un utilisateur B exécutant des collectes, des consultations d'offres, des générations de CV et des flux SSE fonctionnent en étanchéité totale, sans aucune fuite de données visible dans l'interface ou les logs.

## Assumptions

- L'identité du tenant est déterminée par le header `X-Username` ou le jeton porteur `Authorization: Bearer arcapply-token-<id>` pour les requêtes HTTP standard, et par le paramètre d'URL `token` ou `username` pour le flux SSE.
- Les identifiants utilisateurs du système sont uniques et traités de manière insensible à la casse.
