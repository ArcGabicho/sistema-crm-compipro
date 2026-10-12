#!/usr/bin/env bash
# Levanta el stack en Docker (reconstruye lo que haya cambiado), genera los .env
# locales para 'next dev' / 'dotnet run' y espera a que el backend responda.
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

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

case "${DB_CONNECTION_STRING:-}" in
  "" | *"<"*)
    echo "!! Define DB_CONNECTION_STRING en .env con la cadena de Azure SQL (entre comillas simples)." >&2
    exit 1
    ;;
esac

# --- Dependencias locales (solo si faltan; para 'next dev' / 'dotnet run') -----
if [ ! -d "$ROOT/core/client/node_modules" ]; then
  if command -v npm >/dev/null 2>&1; then
    echo "==> npm ci (cliente)..."
    ( cd "$ROOT/core/client" && npm ci )
  else
    echo "!! npm no instalado: se omite (los contenedores igual compilan)." >&2
  fi
fi

if [ ! -f "$ROOT/core/server/obj/project.assets.json" ]; then
  if command -v dotnet >/dev/null 2>&1; then
    echo "==> dotnet restore (backend)..."
    ( cd "$ROOT/core/server" && dotnet restore )
  else
    echo "!! dotnet no instalado: se omite el restore local." >&2
  fi
fi

# --- Deriva los .env locales desde el .env de la raíz ------------------------
je() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'; }

cat > "$ROOT/core/client/.env.local" <<EOF
# Generado por scripts/run.sh desde el .env de la raíz. No editar a mano.
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
# --build usa la caché: solo recompila la imagen cuyo código cambió.
echo "==> Construyendo y levantando el stack..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build
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

echo "==> Cliente:  http://localhost:3000     Backend: http://localhost:5008"
echo "==> Admin de demo: ${SEED_ADMIN_EMAIL} / (SEED_ADMIN_PASSWORD del .env)"
