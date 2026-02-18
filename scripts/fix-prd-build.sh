#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash scripts/fix-prd-build.sh
# Optional env vars:
#   BRANCH=prd
#   DASHBOARD_FIX_COMMIT=880ebc5
#   FEED_FIX_COMMIT=880ebc5
#   DOCKER_IMAGE=cti-web

BRANCH="${BRANCH:-prd}"
DASHBOARD_FIX_COMMIT="${DASHBOARD_FIX_COMMIT:-880ebc5}"
FEED_FIX_COMMIT="${FEED_FIX_COMMIT:-880ebc5}"
DOCKER_IMAGE="${DOCKER_IMAGE:-cti-web}"

log() { echo "[fix-prd-build] $*"; }

if [[ ! -d .git ]]; then
  echo "Erro: execute este script na raiz do repositório git." >&2
  exit 1
fi

log "Branch alvo: ${BRANCH}"
log "Atualizando refs remotas"
git fetch --all --prune

log "Trocando para ${BRANCH}"
git checkout "${BRANCH}"

if git rev-parse --verify --quiet "origin/${BRANCH}" >/dev/null; then
  log "Reset hard para origin/${BRANCH}"
  git reset --hard "origin/${BRANCH}"
else
  log "origin/${BRANCH} não encontrado; seguindo sem reset remoto"
fi

log "Verificando markers de conflito no dashboard"
if rg -n '<<<<<<<|=======|>>>>>>>' apps/web/src/app/dashboard/page.tsx >/dev/null; then
  log "Conflito detectado em dashboard/page.tsx; restaurando arquivo do commit ${DASHBOARD_FIX_COMMIT}"
  git checkout "${DASHBOARD_FIX_COMMIT}" -- apps/web/src/app/dashboard/page.tsx
else
  log "Sem conflito em dashboard/page.tsx"
fi

log "Garantindo feed/page.tsx com toggle Brasil"
git checkout "${FEED_FIX_COMMIT}" -- apps/web/src/app/feed/page.tsx

if ! git diff --quiet -- apps/web/src/app/dashboard/page.tsx apps/web/src/app/feed/page.tsx; then
  log "Commitando ajustes"
  git add apps/web/src/app/dashboard/page.tsx apps/web/src/app/feed/page.tsx
  git commit -m "Fix prd build: restore dashboard and feed stable files"
else
  log "Nenhuma alteração para commit"
fi

log "Build workspaces (shared + web)"
npm run build -w packages/shared
npm run build -w apps/web

log "Build Docker sem cache (${DOCKER_IMAGE})"
docker build --no-cache -t "${DOCKER_IMAGE}" .

log "Concluído com sucesso"
