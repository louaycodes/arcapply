#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# ArcApply — Script de Déploiement Production en 1 Clic (VPS)
# ==============================================================================

echo "========================================================"
echo " 🚀 Déploiement de ArcApply en cours..."
echo "========================================================"

# Répertoire racine du projet
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

# 1. Vérification des prérequis Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Erreur : Docker n'est pas installé sur ce serveur."
    echo "Installez Docker via : curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Erreur : docker compose n'est pas disponible."
    exit 1
fi

# 2. Mise à jour du code source depuis Git si demandé
if [ "${PULL_GIT:-1}" = "1" ]; then
    echo "📥 Récupération des dernières modifications Git..."
    git pull origin main || echo "⚠️ Impossible de pull (peut-être des modifications locales)."
fi

# 3. Vérification du fichier d'environnement
if [ ! -f "${SCRIPT_DIR}/.env" ] && [ -f "${PROJECT_ROOT}/.env" ]; then
    cp "${PROJECT_ROOT}/.env" "${SCRIPT_DIR}/.env"
fi

# 4. Construction et lancement des conteneurs
echo "🔨 Construction et lancement des services Docker..."
docker compose -f "${SCRIPT_DIR}/docker-compose.yml" up -d --build --remove-orphans

# 5. Attente et vérification de la santé du backend
echo "⏳ Vérification de l'état de santé du service d'IA (FastAPI)..."
RETRY_COUNT=0
MAX_RETRIES=15
HEALTH_URL="http://127.0.0.1/health"

until curl -s -f "${HEALTH_URL}" > /dev/null || [ ${RETRY_COUNT} -eq ${MAX_RETRIES} ]; do
    echo -n "."
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
done
echo ""

if [ ${RETRY_COUNT} -eq ${MAX_RETRIES} ]; then
    echo "⚠️ Le backend met plus de temps que prévu à démarrer. Logs :"
    docker compose -f "${SCRIPT_DIR}/docker-compose.yml" logs --tail 20 engine
else
    echo "✅ Backend en ligne et opérationnel !"
fi

echo "========================================================"
echo " 🎉 Déploiement terminé avec succès !"
echo " 👉 Cockpit Web : http://$(curl -s ifconfig.me 2>/dev/null || echo 'VOTRE_IP_VPS')"
echo " 👉 Comptes configurés : louay / louay  et  chaima / chaima"
echo "========================================================"
