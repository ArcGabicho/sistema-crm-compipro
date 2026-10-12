#!/usr/bin/env bash
# Repo ya clonado: instala dependencias, genera los .env locales y levanta el
# stack en Docker (con build).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT/docker/docker-compose.yml"
ENV_FILE="$ROOT/.env"

command -v docker >/dev/null 2>&1 || { echo "Falta 'docker'." >&2; exit 1; }

# --- .env de la raíz -----------------------------------------------------------
if [ ! -f "$ENV_FILE" ]; then
  [ -f "$ROOT/.env.example" ] || { echo "No hay .env ni .env.example." >&2; exit 1; }
  cp "$ROOT/.env.example" "$ENV_FILE"
  echo "==> .env creado desde .env.example — revisa las contraseñas."
fi

# --- Dependencias locales (opcional: para 'next dev' / 'dotnet run') ----------
if command -v npm >/dev/null 2>&1; then
  echo "==> npm ci (cliente)..."
  ( cd "$ROOT/core/client" && npm ci )
else
  echo "!! npm no instalado: se omite (los contenedores igual compilan)." >&2
fi

if command -v dotnet >/dev/null 2>&1; then
  echo "==> dotnet restore (backend)..."
  ( cd "$ROOT/core/server" && dotnet restore )
else
  echo "!! dotnet no instalado: se omite el restore local." >&2
fi

# --- Deriva los .env locales desde el .env de la raíz ------------------------
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

je() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'; }

cat > "$ROOT/core/client/.env.local" <<EOF
# Generado por scripts/dev.sh desde el .env de la raíz. No editar a mano.
BACKEND_URL=http://localhost:5008
AUTH_JWT_SECRET=${JWT_KEY}
EOF

cat > "$ROOT/core/server/appsettings.Development.json" <<EOF
{
  "ConnectionStrings": { "Default": "$(je "$DB_CONNECTION_STRING")" },
  "Jwt": { "Key": "$(je "$JWT_KEY")" },
  "Seed": { "Admin": { "Email": "$(je "$SEED_ADMIN_EMAIL")", "Name": "$(je "$SEED_ADMIN_NAME")", "Password": "$(je "$SEED_ADMIN_PASSWORD")" } }
}
EOF
echo "==> Generados core/client/.env.local y core/server/appsettings.Development.json"

# --- Contenedores -----------------------------------------------------------
echo "==> Construyendo y levantando el stack..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

echo "==> Cliente:  http://localhost:3000     Backend: http://localhost:5008"
echo "==> Admin de demo: ${SEED_ADMIN_EMAIL} / (SEED_ADMIN_PASSWORD del .env)"
