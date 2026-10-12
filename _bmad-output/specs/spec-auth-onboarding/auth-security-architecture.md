# Architecture de Sécurité et d'Authentification

## 1. Principes et Modèle de Menace

L'authentification d'ArcApply protège les données de candidature, les clés d'API LLM (Groq) et les métriques de recherche de stage/emploi des élèves-ingénieurs.

### Menaces adressées :
- Énumération de comptes et divulgation d'emails inscrits.
- Falsification ou rejeu de jetons de session.
- Attaques par force brute sur les mots de passe.
- Compromission de session via stockage non sécurisé.

---

## 2. Spécification des Jetons de Session (JWT)

### 2.1 Format et Signature
- **Algorithme :** HMAC avec SHA-256 (`HS256`).
- **Secret :** Variable d'environnement `ARCAPPLY_JWT_SECRET` (clé minimum 256 bits). En mode développement local, une clé par défaut sécurisée avec avertissement est tolérée.
- **Payload standard :**
  ```json
  {
    "sub": "user_id_uuid_or_int",
    "email": "candidat@example.com",
    "role": "user",
    "exp": 1740000000,
    "iat": 1739395200,
    "jti": "unique-token-nonce"
  }
  ```

### 2.2 Durée de Vie et Renouvellement
- **Access Token :** Validité de 7 jours (adapté à l'usage copilote local/desktop).
- **Format du Header HTTP :** `Authorization: Bearer <token>`.
- **Compatibilité SSE / iframes :** Query parameter `?token=<jwt>` autorisé pour `EventSource` et aperçus PDF.

---

## 3. Procédure de Réinitialisation de Mot de Passe

### 3.1 Demande de Réinitialisation (`POST /api/auth/forgot-password`)
- **Entrée :** `{"email": "candidat@example.com"}`
- **Comportement anti-énumération :** L'endpoint renvoie toujours un statut HTTP 200 avec message générique (`"Si un compte est associé à cette adresse, un lien de réinitialisation a été envoyé"`), que l'email existe ou non en base.
- **Génération du Jeton à Usage Unique :**
  - Chiffrement/hachage d'un token aléatoire de 32 octets (hexadécimal).
  - Validité stricte de 15 minutes (`expires_at`).
  - Stockage en table SQLite `PasswordResetToken` (`id`, `user_id`, `token_hash`, `expires_at`, `used`).

### 3.2 Confirmation et Nouveau Mot de Passe (`POST /api/auth/reset-password`)
- **Entrée :** `{"token": "<reset_token>", "new_password": "<nouveau_mdp>"}`
- **Validation :**
  - Vérification de l'existence, de la non-expiration (`now < expires_at`) et de l'état non utilisé (`used == False`).
  - Hachage sécurisé du nouveau mot de passe (`argon2` ou `bcrypt`).
  - Marquage immédiat du jeton comme consommé (`used = True`).
  - Invalidation des sessions actives précédentes si applicatif multi-session.

---

## 4. Validation et Statut d'Email

- **Champ `is_verified` :** Booléen ajouté sur la table `User` (défaut `False` pour nouveaux inscrits, `True` pour utilisateurs existants via migration additive).
- **Format d'Email :** Regex standard RFC 5322 avec contrôle strict de syntaxe et normalisation en minuscules (`trim().lower()`).
- **Envoi de Notifications :**
  - Adaptateur découplé `EmailDeliveryAdapter`.
  - Mode local/dev : journalisation structurée de l'URL de validation dans les logs de l'engine (`services/engine`).
  - Mode production : passerelle SMTP transactionnelle paramétrable via variables d'environnement (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`).

---

## 5. Politique de Mots de Passe et Protection Anti-Bruteforce

- **Longueur minimale :** 8 caractères.
- **Complexité recommandée :** Au moins 1 majuscule, 1 chiffre ou symbole.
- **Rate-Limiting Moteur :** Limiteur mémoire ou middleware FastAPI limitant les tentatives à 5 échecs consécutifs par adresse IP et par compte sur une fenêtre glissante de 15 minutes (code HTTP 429 Too Many Requests).
