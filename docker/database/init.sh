#!/usr/bin/env bash
# Espera a que SQL Server acepte conexiones y aplica database/init.sql una vez.
# Se ejecuta en el contenedor 'db-init' (imagen mssql-tools).
set -euo pipefail

DB_HOST="${DB_HOST:-db}"
SA_PASSWORD="${MSSQL_SA_PASSWORD:?Falta MSSQL_SA_PASSWORD}"
CRM_APP_PASSWORD="${CRM_APP_PASSWORD:?Falta CRM_APP_PASSWORD}"
SQLCMD="${SQLCMD:-/opt/mssql-tools/bin/sqlcmd}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Esperando a SQL Server en ${DB_HOST}:1433 ..."
for attempt in $(seq 1 60); do
  if "$SQLCMD" -S "${DB_HOST},1433" -U sa -P "$SA_PASSWORD" -C -l 3 -Q "SELECT 1" >/dev/null 2>&1; then
    echo "==> SQL Server disponible (intento ${attempt})."
    break
  fi
  if [ "$attempt" -eq 60 ]; then
    echo "!! Timeout esperando a SQL Server" >&2
    exit 1
  fi
  sleep 2
done

# El sqlcmd clásico (mssql-tools 17) tiene el flag -v roto; renderizamos el
# script sustituyendo el marcador por la contraseña real.
esc_pwd="$(printf '%s' "$CRM_APP_PASSWORD" | sed -e 's/[&\\~]/\\&/g')"
rendered="$(mktemp)"
trap 'rm -f "$rendered"' EXIT
sed "s~__CRM_APP_PASSWORD__~${esc_pwd}~g" "${SCRIPT_DIR}/init.sql" > "$rendered"

echo "==> Aplicando init.sql ..."
"$SQLCMD" -S "${DB_HOST},1433" -U sa -P "$SA_PASSWORD" -C -b -i "$rendered"

echo "==> Inicialización de base de datos completada."