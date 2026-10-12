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

# El backend escucha recién después de crear el esquema y sembrar la demo en
# Azure SQL: el primer arranque, o con la base en pausa, tarda ~1 min.
if command -v curl >/dev/null 2>&1; then
  printf '==> Esperando al backend'
  listo=""
  for _ in $(seq 1 90); do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:5008/api/auth/me || true)
    if [ "$code" != "000" ]; then listo=1; break; fi
    printf '.'
    sleep 2
  done
  echo
  [ -n "$listo" ] && echo "==> Backend listo." \
    || echo "!! El backend no respondió en 3 min. Revisa: docker compose -f docker/docker-compose.yml logs -f server" >&2
fi

echo "==> Cliente:  http://localhost:3000"
echo "==> Backend:  http://localhost:5008"
