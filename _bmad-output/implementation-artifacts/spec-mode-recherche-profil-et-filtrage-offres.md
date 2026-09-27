---
title: 'Mode de Recherche dans le Profil et Filtrage Corrélé des Offres'
type: 'feature'
created: '2026-09-27'
status: 'done'
route: 'dispatch'
baseline_commit: '292b2a4698bb620f14d6097aa232e0fc1e078a66'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem :** L'étudiant-ingénieur peut rechercher indifféremment un PFE ou un emploi, mais le Radar d'offres actuel affiche toutes les offres sans distinction de type, rendant le flux non pertinent et bruyant.

**Approach :** Ajouter un champ `search_mode` (`"PFE"` | `"JOB"`) dans le `MasterProfile`, taguer chaque offre scrapée avec un `offer_type` inféré automatiquement à l'ingestion via heuristique sur le titre/description, et filtrer le Radar côté backend pour n'exposer que les offres correspondant au choix actif du profil.

## Boundaries & Constraints

**Always:**
- Le champ `search_mode` est un paramètre de préférence utilisateur persisté dans `MasterProfile` (source de vérité unique, AD-2).
- Chaque offre persistée dans `job_offers` doit avoir un `offer_type` (`"PFE"` | `"JOB"`) inféré à la collecte, jamais NULL.
- L'API `GET /api/jobs` lit automatiquement le `search_mode` du profil `"default-profile"` et filtre sans paramètre client requis ; le query param optionnel `offer_type` reste disponible pour les surcharges de test.
- Respect du découplage strict (AD-1) : le frontend ne lit jamais SQLite directement.
- La migration SQLite est additive uniquement (deux nouvelles colonnes, pas de suppression ni de renommage).
- Commits conventionnels (`feat(engine):`, `feat(web):`) et push distant obligatoire après complétion.

**Never:**
- Ne pas modifier la signature de `search_jobs()` dans les connecteurs existants.
- Ne pas bloquer la génération de CV/lettre si `search_mode` n'est pas renseigné (défaut `"PFE"`).
- Ne jamais afficher simultanément des offres PFE et JOB dans le même flux Radar.

## I/O & Edge-Case Matrix

| Scenario | Input / État | Sortie / Comportement attendu | Gestion d'erreur |
|----------|-------------|-------------------------------|------------------|
| Profil `search_mode = "PFE"` | `GET /api/jobs` | Uniquement `offer_type = "PFE"` retournées | — |
| Profil `search_mode = "JOB"` | `GET /api/jobs` | Uniquement `offer_type = "JOB"` retournées | — |
| `search_mode` absent (profil neuf) | `GET /api/jobs` | Défaut à `"PFE"` côté API | — |
| Mise à jour `search_mode` | `PUT /api/profile` avec `search_mode: "JOB"` | Profil mis à jour, prochain GET retourne les offres JOB | HTTP 422 si valeur invalide |
| Offre ambiguë sans mot-clé discriminant | Titre générique | `offer_type = "PFE"` par défaut (safe default) | Pas d'erreur |
| Surcharge de test | `GET /api/jobs?offer_type=JOB` | Ignore `search_mode` du profil, filtre par query param | HTTP 422 si valeur invalide |

</frozen-after-approval>

## Code Map

- `services/engine/app/domain/models.py` -- Ajouter `search_mode: str = Field(default="PFE")` dans `MasterProfileBase` et `MasterProfileUpdate` ; ajouter `offer_type: str = Field(default="PFE", index=True)` dans `JobOfferBase`
- `services/engine/app/adapters/connectors/__init__.py` -- Créer `infer_offer_type(title: str, description: str) -> Literal["PFE", "JOB"]` : heuristique mots-clés (pfe/stage/internship → PFE ; cdi/cdd/emploi/developer → JOB ; égalité → PFE par défaut)
- `services/engine/app/ports/connectors.py` -- Documenter la responsabilité d'`offer_type` dans la docstring du port (aucune modification de signature)
- `services/engine/app/api/jobs.py` -- `list_jobs()` : lire le `search_mode` du profil et appliquer le filtre `offer_type` automatiquement ; query param `offer_type` override si présent ; mapper de collecte : appeler `infer_offer_type()` avant persistance
- `services/engine/app/api/profile.py` -- `update_profile()` : valider `search_mode in {"PFE", "JOB"}` ; inclure `search_mode` dans `MasterProfileRead`
- `apps/web/app/profile/` -- Ajouter toggle « Je cherche un PFE / un Emploi » dans le formulaire profil
- `apps/web/app/components/radar/` -- Afficher badge de mode actif (ex: « 🎓 Mode PFE ») dans le header du Radar avec lien vers les paramètres
- `services/engine/tests/test_jobs.py` -- Tests : filtrage PFE/JOB selon search_mode, inférence offer_type, override query param, défaut si search_mode absent

## Tasks & Acceptance

**Exécution :**
- [x] `services/engine/app/domain/models.py` -- Ajouter `search_mode` dans `MasterProfileBase`/`MasterProfileUpdate` et `offer_type` dans `JobOfferBase` — modèles persistance et DTOs
- [x] `services/engine/app/adapters/connectors/__init__.py` -- Implémenter `infer_offer_type(title, description)` avec heuristiques sur mots-clés — utilitaire partagé par tous les connecteurs
- [x] `services/engine/app/api/jobs.py` -- Modifier `list_jobs()` pour filtrage auto par `search_mode` du profil ; injecter `infer_offer_type()` dans le mapper de collecte
- [x] `services/engine/app/api/profile.py` -- Valider `search_mode` et l'exposer dans `MasterProfileRead`
- [x] `apps/web/app/profile/` -- Ajouter le toggle PFE/JOB dans le formulaire profil cockpit
- [x] `apps/web/app/components/radar/` -- Ajouter badge de mode actif dans le Radar avec lien vers les paramètres
- [x] `services/engine/tests/test_jobs.py` -- Couvrir les 6 scénarios de la matrice I/O

**Critères d'Acceptation :**
- Étant donné un profil avec `search_mode = "JOB"`, quand `GET /api/jobs` est appelé, alors seules les offres `offer_type = "JOB"` sont retournées.
- Étant donné une offre « Stage PFE Ingénieur Data », quand elle est collectée, alors `offer_type = "PFE"` est persisté.
- Étant donné une offre « CDI Développeur Fullstack », quand elle est collectée, alors `offer_type = "JOB"` est persisté.
- Étant donné un profil neuf sans `search_mode`, quand `GET /api/jobs` est appelé, alors le résultat est identique à `search_mode = "PFE"`.
- Étant donné `GET /api/jobs?offer_type=JOB`, quel que soit le `search_mode` du profil, alors les offres JOB sont retournées.
- Étant donné `PUT /api/profile` avec `search_mode: "INVALIDE"`, alors HTTP 422 est retourné.
- Étant donné le Radar ouvert dans le cockpit, quand `search_mode = "PFE"`, alors un badge « 🎓 Mode PFE » est visible dans le header du Radar.

## Implementation Notes

- Backend FastAPI : Modèles SQLModel étendus de façon additive avec index (`search_mode`, `offer_type`). Inférence automatique à la collecte par pondération de mots-clés discriminants (avec priorité PFE par défaut en cas d'égalité). Filtrage transparent dans `GET /api/jobs` basé sur le `default-profile` ou paramètre de requête.
- Frontend Next.js : Sélecteur visuel interactif dans `apps/web/app/profile/page.tsx` avec persistance SQLite automatique. Badge interactif et réactif dans le header de `apps/web/app/radar/page.tsx` avec redirection vers le profil, badge sur les `JobCard`.
- Tests : 11 tests unitaires et d'intégration validés dans `test_jobs.py`, 39 tests au total sans régression sur l'ensemble de l'engine backend.
- Build frontend : `next build` valide sans erreur TypeScript.

## Spec Change Log

## Review Triage Log

## Design Notes

**Heuristique `infer_offer_type` :**
- Mots-clés PFE (insensible à la casse) : `pfe`, `stage`, `internship`, `intern`, `fin d'études`, `alternance`
- Mots-clés JOB : `cdi`, `cdd`, `emploi`, `poste`, `engineer`, `développeur`, `developer`, `ingénieur`
- Règle : si score PFE ≥ score JOB → `"PFE"` ; sinon `"JOB"`. Égalité ou zéro → `"PFE"` (safe default).

## Verification

**Commands :**
- `cd services/engine && uv run pytest tests/test_jobs.py -v` -- expected: tous les tests passent
- `cd services/engine && uv run pytest tests/ -v --tb=short` -- expected: suite complète verte
