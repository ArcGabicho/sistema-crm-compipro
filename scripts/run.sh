#!/usr/bin/env bash
# Arranca los contenedores del stack (los construye solo si faltan).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT/docker/docker-compose.yml"
ENV_FILE="$ROOT/.env"

command -v docker >/dev/null 2>&1 || { echo "Falta 'docker'." >&2; exit 1; }

if [ ! -f "$ENV_FILE" ] && [ -f "$ROOT/.env.example" ]; then
  cp "$ROOT/.env.example" "$ENV_FILE"
  echo "==> .env creado desde .env.example — revisa las contraseñas."
fi

echo "==> Arrancando contenedores..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

echo "==> Cliente:  http://localhost:3000"
echo "==> Backend:  http://localhost:5008"
