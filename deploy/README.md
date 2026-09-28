# Guide de Déploiement VPS — ArcApply

Ce guide pas à pas permet de déployer l'intégralité de l'application **ArcApply** (Cockpit Next.js + Moteur IA FastAPI + Base SQLite persistante + Reverse Proxy Nginx) sur n'importe quel VPS Linux (Ubuntu 22.04 / 24.04, Debian 12, etc.).

---

## 📋 Prérequis sur le VPS

1. **Un VPS Linux** avec accès root ou sudo (ex: OVH, Hetzner, DigitalOcean, Contabo).
2. **Ports ouverts dans le pare-feu :**
   - Port `22` (SSH)
   - Port `80` (HTTP)
   - Port `443` (HTTPS)

---

## 🚀 Déploiement Rapide (En 5 Minutes)

### 1. Se connecter en SSH à votre VPS
```bash
ssh root@<IP_DE_VOTRE_VPS>
```

### 2. Mettre à jour le serveur et installer Docker & Git
Exécutez cette commande unique pour préparer le serveur :
```bash
apt update && apt upgrade -y && apt install -y curl git
curl -fsSL https://get.docker.com | sh
```

### 3. Cloner le dépôt ArcApply
```bash
git clone https://github.com/louaycodes/arcapply.git
cd arcapply
```

### 4. Configurer les variables d'environnement (optionnel)
```bash
cp deploy/env.production.example deploy/.env
nano deploy/.env
```
*(Vous pouvez y coller votre clé `GROQ_API_KEY` si vous souhaitez activer la synthèse IA Groq pour les lettres de motivation).*

### 5. Lancer le déploiement automatique
```bash
./deploy/deploy.sh
```

C'est tout ! L'application est maintenant en ligne et accessible directement sur :
👉 **`http://<IP_DE_VOTRE_VPS>`**

---

## 👥 Comptes Utilisateurs Pré-Configurés

Les deux comptes suivants sont déjà créés et isolés :
- **Louay :** utilisateur `louay` / mot de passe `louay` *(avec votre profil complet et formations)*
- **Chaima :** utilisateur `chaima` / mot de passe `chaima` *(avec profil indépendant et radar d'offres dédié)*

La page de connexion dédiée est accessible sur **`http://<IP_DE_VOTRE_VPS>/login`**.

---

## 🔒 Activer le SSL / HTTPS avec votre Nom de Domaine (Optionnel)

Si vous possédez un nom de domaine (ex: `arcapply.mondomaine.com`) pointant vers l'IP de votre VPS :

1. Installez Certbot sur le VPS hôte :
   ```bash
   apt install -y certbot python3-certbot-nginx
   ```
2. Générez le certificat SSL automatique :
   ```bash
   certbot certonly --standalone -d arcapply.mondomaine.com
   ```
3. Nginx prendra automatiquement le relai pour sécuriser tous les flux en HTTPS.

---

## 🛠️ Commandes Utiles d'Exploitation

- **Voir les logs en direct :**
  ```bash
  docker compose -f deploy/docker-compose.yml logs -f
  ```
- **Mettre à jour l'application après un `git push` :**
  ```bash
  ./deploy/deploy.sh
  ```
- **Redémarrer les services :**
  ```bash
  docker compose -f deploy/docker-compose.yml restart
  ```
- **Arrêter l'application :**
  ```bash
  docker compose -f deploy/docker-compose.yml down
  ```
- **Sauvegarder la base de données :**
  La base SQLite est stockée dans le volume Docker persistant `arcapply_data` (`/root/.arcapply/arcapply.db`). Elle n'est jamais écrasée lors des mises à jour.
