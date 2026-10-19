#!/usr/bin/env bash
# Run the API + web app locally against the docker Postgres/Redis — never the
# database configured in .env (which may point at production).
#
#   pnpm dev:local
#
# Web:  http://localhost:3000            (sign in with any demo e-mail)
# API:  http://localhost:4000/api/v1     (also reachable on the LAN, so a
#       phone running a profile/test APK can use http://<mac-ip>:4000)
#
# Sign-in uses the API dev-login (NODE_ENV=development): the e-mail picks the
# demo account, the password is ignored. Reset the demo data from
# Paramètres → "Réinitialiser les données d'exemple" (admin account).
set -euo pipefail
cd "$(dirname "$0")/.."

# Host ports come from .env (POSTGRES_PORT / REDIS_PORT) when set.
if [ -f .env ]; then
  POSTGRES_PORT="${POSTGRES_PORT:-$(grep -E '^POSTGRES_PORT=' .env | cut -d= -f2 || true)}"
  REDIS_PORT="${REDIS_PORT:-$(grep -E '^REDIS_PORT=' .env | cut -d= -f2 || true)}"
fi
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
REDIS_PORT="${REDIS_PORT:-6379}"

docker compose up -d postgres redis

export NODE_ENV=development
export DATABASE_URL="postgresql://maintflow:maintflow@localhost:${POSTGRES_PORT}/maintflow?schema=public"
export DIRECT_URL="$DATABASE_URL"
export REDIS_URL="redis://localhost:${REDIS_PORT}"

pnpm --filter @maintflow/api exec prisma migrate deploy
pnpm --filter @maintflow/shared build

if command -v ipconfig >/dev/null 2>&1; then
  LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
  [ -n "$LAN_IP" ] && echo "▶ API pour le téléphone : http://${LAN_IP}:4000"
fi
echo "▶ Web : http://localhost:3000"

exec pnpm --parallel --filter @maintflow/api --filter @maintflow/web dev
