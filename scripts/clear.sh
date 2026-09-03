#!/usr/bin/env bash
# Limpia contenedores, red, volúmenes e imágenes locales del proyecto.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT/docker/docker-compose.yml"

command -v docker >/dev/null 2>&1 || { echo "Falta 'docker'." >&2; exit 1; }

env_flag=()
[ -f "$ROOT/.env" ] && env_flag=(--env-file "$ROOT/.env")

echo "==> Eliminando stack (contenedores + red + volúmenes + imágenes locales)..."
docker compose "${env_flag[@]}" -f "$COMPOSE_FILE" down --volumes --rmi local --remove-orphans || true

docker image rm -f sistema-crm-compina-server sistema-crm-compina-client >/dev/null 2>&1 || true

# Archivos de entorno generados por dev.sh (no toca el .env de la raíz)
rm -f "$ROOT/core/client/.env.local" "$ROOT/core/server/appsettings.Development.json"

echo "==> Limpieza completada."
