# Architecture d'Isolation Multi-Tenant — ArcApply

Ce document constitue le compagnon technique de `SPEC-multi-tenant-isolation`. Il détaille l'audit des vecteurs de fuite actuels, les spécifications de données, l'architecture de routage des événements SSE et les invariants de sécurité.

---

## 1. Cartographie des Failles Actuelles de Cloisonnement

| Composant | Fichier source | Problème constaté | Risque de fuite |
|---|---|---|---|
| **Flux SSE** | `app/api/events.py` | `_subscribers: set[asyncio.Queue]` global sans distinction d'utilisateur. | Toute découverte (`JOB_DISCOVERED`) ou progression (`SCRAPE_PROGRESS`) est diffusée à tous les navigateurs connectés. |
| **Scheduler Scraping** | `app/adapters/scheduler.py` | `_is_running: bool` global au niveau classe. | Un utilisateur bloque le scraping de tous les autres, ou le scraping d'un utilisateur pollue l'état global. |
| **Détail & FSM Offres** | `app/api/jobs.py` | `/api/jobs/{id}`, `/archive`, `/transition` n'intègrent pas de filtre `JobOffer.user_id == username`. | IDOR (Insecure Direct Object Reference) : un utilisateur peut inspecter ou modifier le statut d'une offre d'un tiers. |
| **Alignement ATS** | `app/api/ats.py` | Utilise le profil codé en dur `default-profile` et liste les offres sans filtre de tenant sur `/batch`. | Un utilisateur calcule son score ATS contre le profil d'un autre utilisateur ou évalue des offres tierces. |
| **Génération CV & Lettres** | `app/api/cv.py`, `app/api/letter.py` | Chargent systématiquement `MasterProfile` avec l'identifiant `"default-profile"`. | Les CVs et lettres ciblés sont synthétisés à partir des données de formation/expérience du profil par défaut (Louay), quel que soit le compte connecté. |
| **Brouillon Studio CV** | `app/api/cv.py` | `CustomCVDraft` identifié de manière fixe par `"default-draft"`. | Écrasement mutuel du brouillon CV personnalisé entre utilisateurs. |
| **Emails Recruteurs** | `app/api/emails.py` | Aucun champ `user_id` sur `EmailInteraction` et requêtes globales sur la table. | Tout utilisateur peut consulter l'historique complet des réponses recruteurs de tous les candidats. |

---

## 2. Spécification du Modèle de Données & Migrations Idempotentes

Conformément à l'invariant **Pitfall 2** du fichier `AGENTS.md`, toute modification structurelle doit être accompagnée d'une migration additive idempotente dans `_migrate_db(engine)` (`app/adapters/database.py`).

### 2.1 Table `email_interactions`
- **Ajout de champ** : `user_id: str = Field(default="louay", index=True)`
- **Migration SQL** :
  ```sql
  ALTER TABLE email_interactions ADD COLUMN user_id VARCHAR DEFAULT 'louay';
  CREATE INDEX IF NOT EXISTS ix_email_interactions_user_id ON email_interactions (user_id);
  ```

### 2.2 Table `custom_cv_drafts`
- **Ajout de champ** : `user_id: str = Field(default="louay", index=True)`
- **Clé primaire ou recherche** : le brouillon actif est indexé ou identifié par `user_id` (ex. `draft_id = f"draft-{user_id}"` ou requête filtrée par `user_id`).
- **Migration SQL** :
  ```sql
  ALTER TABLE custom_cv_drafts ADD COLUMN user_id VARCHAR DEFAULT 'louay';
  CREATE INDEX IF NOT EXISTS ix_custom_cv_drafts_user_id ON custom_cv_drafts (user_id);
  ```

### 2.3 Table `targeted_cvs` & `cover_letters`
- Vérifier la présence et l'indexation de `user_id` :
  ```sql
  ALTER TABLE targeted_cvs ADD COLUMN user_id VARCHAR DEFAULT 'louay';
  ALTER TABLE cover_letters ADD COLUMN user_id VARCHAR DEFAULT 'louay';
  ```

---

## 3. Multiplexage & Étanchéité du Flux Temps Réel SSE

### 3.1 Problématique du Protocole SSE Navigateur
L'API native standard `EventSource` du navigateur ne permet pas l'envoi de headers personnalisés (`Authorization` ou `X-Username`).

### 3.2 Solution d'Authentification SSE
L'endpoint `/api/events` acceptera l'identité via un paramètre de requête :
- `GET /api/events?token=arcapply-token-<uuid>` ou `GET /api/events?username=<user>`
- Le résolveur d'authentification valide le jeton ou extrait le nom d'utilisateur authentifié.

### 3.3 Registre de Connexions Cloisonné
Au lieu d'un `set[asyncio.Queue]` global :
```python
# Registre associant chaque nom d'utilisateur à l'ensemble de ses queues de connexion actives
_user_subscribers: dict[str, set[asyncio.Queue]] = defaultdict(set)
```

### 3.4 Diffusion Ciblée
```python
async def broadcast_event(event_type: str, payload: dict, target_user: str | None = None) -> None:
    """
    Si target_user est précisé, diffuse EXCLUSIVEMENT aux connexions de cet utilisateur.
    Si target_user est None, diffuse à l'ensemble des utilisateurs connectés (réservé aux annonces système d'urgence).
    """
```
Toutes les émissions `JOB_DISCOVERED` et `SCRAPE_PROGRESS` sont émises avec `target_user=user_id`.

---

## 4. Isolation Concurrente du Scraping

- Le booléen global `_is_running: bool` dans `CrawlerScheduler` est remplacé par un ensemble d'utilisateurs actifs :
  ```python
  _active_crawls: set[str] = set()
  ```
- Un utilisateur peut exécuter son scraping sans être bloqué par le crawl d'un autre compte.
- La télémétrie et le récapitulatif de scraping sont strictement isolés par compte.
- La déduplication des offres reste composite : `(platform, external_id, user_id)`. Deux utilisateurs distincts peuvent ainsi collecter la même offre sans qu'il y ait collision de clé primaire ni écrasement.

---

## 5. Matrice de Sécurité des Endpoints API

Pour toute requête ciblant une entité spécifique par ID, l'isolation ABAC/RBAC suivante est appliquée :

| Endpoint | Méthode | Règle de cloisonnement | Code d'erreur en cas de tentative cross-tenant |
|---|---|---|---|
| `/api/jobs` | `GET` | `where(JobOffer.user_id == username)` | N/A (résultats filtrés) |
| `/api/jobs/{id}` | `GET` | Vérifie `job.user_id == username` | `404 Not Found` |
| `/api/jobs/{id}/archive` | `PATCH` | Vérifie `job.user_id == username` | `404 Not Found` |
| `/api/jobs/{id}/transition` | `PATCH` | Vérifie `job.user_id == username` | `404 Not Found` |
| `/api/jobs/wipe` | `DELETE` | Ne supprime que les offres de `username` | N/A |
| `/api/ats/match/{job_id}` | `GET` | Vérifie que l'offre appartient à l'utilisateur et évalue contre son propre `MasterProfile` | `404 Not Found` |
| `/api/ats/batch` | `GET` | Filtre les offres sur `user_id == username` et utilise le `MasterProfile` du compte | N/A (résultats filtrés) |
| `/api/cv/generate/{job_id}` | `POST` | Récupère le `MasterProfile` associé au compte courant (`where(MasterProfile.user_id == username)`) | `404 Not Found` |
| `/api/cv/draft` | `GET`, `POST` | Stocke et lit le brouillon CV associé au `user_id` | N/A |
| `/api/letter/generate/{job_id}` | `POST` | Récupère le `MasterProfile` du compte courant | `404 Not Found` |
| `/api/emails/recent` | `GET` | Filtre `EmailInteraction.user_id == username` | N/A (résultats filtrés) |
| `/api/emails/simulate` | `POST` | N'effectue le rapprochement que sur les `JobOffer` du compte courant | N/A |

---

## 6. Stratégie de Vérification et Tests Automatisés

Un scénario de test E2E dédié `test_tenant_isolation.py` doit valider les assertions suivantes :
1. **Création croisée d'offres** : User A scrape/crée une offre. User B liste ses offres -> le résultat de User B est vide.
2. **Protection IDOR** : User B tente de lire ou de modifier `/api/jobs/{id_de_A}` -> réponse 404 immédiate.
3. **Étanchéité SSE** : User A déclenche un crawl -> seule la queue SSE de User A reçoit `JOB_DISCOVERED`, la queue de User B ne reçoit aucun message.
4. **Profils et Documents** : User B génère un CV / une lettre -> le document ne contient aucune formation ou expérience issue du profil de User A.
