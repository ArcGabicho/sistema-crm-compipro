#!/usr/bin/env bash
# Despliegue a Azure: RG + ACR, compila las imágenes con `az acr build` y aplica
# infra/main.bicep (Container Apps + Azure SQL).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env"
BICEP_FILE="$ROOT/infra/main.bicep"

command -v az  >/dev/null 2>&1 || { echo "Falta 'az' (Azure CLI)." >&2; exit 1; }
command -v git >/dev/null 2>&1 || { echo "Falta 'git'." >&2; exit 1; }

if [ ! -f "$ENV_FILE" ]; then
  [ -f "$ROOT/.env.example" ] || { echo "No hay .env ni .env.example." >&2; exit 1; }
  cp "$ROOT/.env.example" "$ENV_FILE"
  echo "==> .env creado desde .env.example — ajusta los valores de Azure."
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

: "${AZ_LOCATION:=eastus}"
: "${AZ_RESOURCE_GROUP:=rg-sistema-crm-compina}"
: "${AZ_NAME_PREFIX:=crmcompina}"
: "${SQL_ADMIN_LOGIN:=crmadmin}"
: "${SQL_ADMIN_PASSWORD:=${MSSQL_SA_PASSWORD}}"

if [ -z "${AZ_ACR_NAME:-}" ]; then
  AZ_ACR_NAME="acr${AZ_NAME_PREFIX}$(printf '%s' "$AZ_RESOURCE_GROUP" | md5sum | cut -c1-8)"
fi

IMAGE_TAG="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)"
DEPLOY_NAME="crm-$IMAGE_TAG"

az account show >/dev/null 2>&1 || az login
[ -n "${AZ_SUBSCRIPTION:-}" ] && az account set --subscription "$AZ_SUBSCRIPTION"

echo "==> Grupo de recursos: $AZ_RESOURCE_GROUP ($AZ_LOCATION)"
az group create -n "$AZ_RESOURCE_GROUP" -l "$AZ_LOCATION" -o none

echo "==> Container Registry: $AZ_ACR_NAME"
if az acr show -n "$AZ_ACR_NAME" -o none 2>/dev/null; then
  az acr update -n "$AZ_ACR_NAME" --admin-enabled true -o none
else
  az acr create -g "$AZ_RESOURCE_GROUP" -n "$AZ_ACR_NAME" --sku Basic --admin-enabled true -o none
fi

echo "==> Compilando imágenes en ACR (tag $IMAGE_TAG)..."
az acr build -r "$AZ_ACR_NAME" -t "sistema-crm-compina-server:$IMAGE_TAG" -f "docker/Dockerfile.server" "$ROOT" -o none
az acr build -r "$AZ_ACR_NAME" -t "sistema-crm-compina-client:$IMAGE_TAG" -f "docker/Dockerfile.client" "$ROOT" -o none

echo "==> Desplegando infra/main.bicep..."
az deployment group create \
  -g "$AZ_RESOURCE_GROUP" -n "$DEPLOY_NAME" \
  --template-file "$BICEP_FILE" \
  --parameters \
      namePrefix="$AZ_NAME_PREFIX" \
      acrName="$AZ_ACR_NAME" \
      imageTag="$IMAGE_TAG" \
      sqlAdminLogin="$SQL_ADMIN_LOGIN" \
      sqlAdminPassword="$SQL_ADMIN_PASSWORD" \
      jwtKey="$JWT_KEY" \
      seedAdminEmail="$SEED_ADMIN_EMAIL" \
      seedAdminName="$SEED_ADMIN_NAME" \
      seedAdminPassword="$SEED_ADMIN_PASSWORD" \
  -o none

CLIENT_URL="$(az deployment group show -g "$AZ_RESOURCE_GROUP" -n "$DEPLOY_NAME" --query properties.outputs.clientUrl.value -o tsv)"
SQL_FQDN="$(az deployment group show -g "$AZ_RESOURCE_GROUP" -n "$DEPLOY_NAME" --query properties.outputs.sqlServerFqdn.value -o tsv)"

echo "==> Despliegue completado."
echo "    Cliente:   $CLIENT_URL"
echo "    Azure SQL: $SQL_FQDN  (BD SistemaCrmCompipro)"
echo "    Admin:     $SEED_ADMIN_EMAIL"
