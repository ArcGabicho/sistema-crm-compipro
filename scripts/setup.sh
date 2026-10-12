#!/usr/bin/env bash
# Bootstrap remoto: clona el repositorio y ejecuta scripts/run.sh.
#
#   curl -fsSL https://raw.githubusercontent.com/ArcGabicho/sistema-crm-compipro/master/scripts/setup.sh | bash
#
# Variables opcionales: REPO_URL, BRANCH, TARGET_DIR
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/ArcGabicho/sistema-crm-compipro.git}"
BRANCH="${BRANCH:-master}"
TARGET_DIR="${TARGET_DIR:-sistema-crm-compipro}"

command -v git    >/dev/null 2>&1 || { echo "Falta 'git'."   >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Falta 'docker'." >&2; exit 1; }

if [ -d "$TARGET_DIR/.git" ]; then
  echo "==> Repo ya presente en '$TARGET_DIR'; actualizando..."
  git -C "$TARGET_DIR" fetch --depth 1 origin "$BRANCH"
  git -C "$TARGET_DIR" checkout "$BRANCH"
  git -C "$TARGET_DIR" reset --hard "origin/$BRANCH"
else
  echo "==> Clonando $REPO_URL ($BRANCH) en '$TARGET_DIR'..."
  git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$TARGET_DIR"
fi

cd "$TARGET_DIR"
echo "==> Ejecutando scripts/run.sh..."
exec bash scripts/run.sh
