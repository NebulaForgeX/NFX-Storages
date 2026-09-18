#!/usr/bin/env bash
set -euo pipefail
export NO_COLOR=1 CLICOLOR=0 FORCE_COLOR=0 TERM=dumb

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ATLAS_DIR="${REPO_ROOT}/databases"
GEN_DIR="${ATLAS_DIR}/gen/models"

if [ -f /volume1/Environments/use-menv.sh ]; then
  # shellcheck source=/dev/null
  . /volume1/Environments/use-menv.sh >/dev/null 2>&1 || true
fi

for home_dir in "$HOME" "/home/LucasAsustor" "/root"; do
  if [ -d "$home_dir/go/bin" ] && [ -f "$home_dir/go/bin/goimports" ]; then
    export PATH="$PATH:$home_dir/go/bin"
    break
  fi
done

if [[ -z "${POSTGRES_USER}" ]]; then echo "Error: POSTGRES_USER environment variable is required"; exit 1; fi
if [[ -z "${POSTGRES_PASSWORD}" ]]; then echo "Error: POSTGRES_PASSWORD environment variable is required"; exit 1; fi
if [[ -z "${POSTGRES_HOST}" ]]; then echo "Error: POSTGRES_HOST environment variable is required"; exit 1; fi
if [[ -z "${POSTGRES_PORT}" ]]; then echo "Error: POSTGRES_PORT environment variable is required"; exit 1; fi
if [[ -z "${POSTGRES_DB}" ]]; then echo "Error: POSTGRES_DB environment variable is required"; exit 1; fi
if [[ -z "${POSTGRES_DB_SHADOW}" ]]; then echo "Error: POSTGRES_DB_SHADOW environment variable is required"; exit 1; fi

# shellcheck source=/dev/null
. "${SCRIPT_DIR}/postgres_client.sh"
if nfxstorages_postgres_use_docker && [[ -z "${POSTGRES_CONTAINER_NAME:-}" ]]; then
  echo "Error: POSTGRES_CONTAINER_NAME environment variable is required for Docker PostgreSQL"
  exit 1
fi

POSTGRES_USER="${POSTGRES_USER}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
POSTGRES_HOST="${POSTGRES_HOST}"
POSTGRES_PORT="${POSTGRES_PORT}"
POSTGRES_DB="${POSTGRES_DB}"
POSTGRES_DB_SHADOW="${POSTGRES_DB_SHADOW}"
ATLAS_ENV="${ATLAS_ENV}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing dependency: $1" >&2; exit 1; }; }
if ! command -v goimports >/dev/null 2>&1; then
  for home_dir in "$HOME" "/home/LucasAsustor" "/root"; do
    if [ -f "$home_dir/go/bin/goimports" ]; then export PATH="$PATH:$home_dir/go/bin"; break; fi
  done
fi
need goimports
need gofmt

if [ -d "$GEN_DIR" ]; then
  rm -rf "${GEN_DIR:?}/"*
else
  mkdir -p "$GEN_DIR"
fi

for module_models in "${REPO_ROOT}/modules"/*/infrastructure/rdb/models; do
  if [ -d "$module_models" ]; then
    rm -f "${module_models}"/*_dbgen.go
  fi
done

MODPATH="$(go list -m 2>/dev/null || echo "")"
[[ -n "$MODPATH" ]] && export GOIMPORTSLOCAL="$MODPATH"

nfxstorages_psql_admin -c "CREATE DATABASE ${POSTGRES_DB_SHADOW};" >/dev/null 2>&1 || true

cd "${ATLAS_DIR}" || exit 1
if ! atlas schema inspect --env gen-models; then
  echo "Error: Atlas schema inspect failed" >&2
  echo "Please check: PostgreSQL connection (POSTGRES_PASSWORD, etc.) and database is running." >&2
  exit 1
fi

shopt -s nullglob
file_count=0
for src in "${GEN_DIR}"/*.go; do
  base="$(basename "${src}")"
  if [[ "$base" =~ ^([^_]+)__(.+)$ ]]; then
    schema_name="${BASH_REMATCH[1]}"
    table_name="${BASH_REMATCH[2]}"
    table_name="${table_name%.go}"
    DEST_DIR="${REPO_ROOT}/modules/${schema_name}/infrastructure/rdb/models"
    mkdir -p "${DEST_DIR}"
    rm -f "${DEST_DIR}/${table_name}_dbgen.go"
    dest_file="${DEST_DIR}/${table_name}_dbgen.go"
    mv "${src}" "${dest_file}"
    echo "Moved ${base} -> ${dest_file}"
    file_count=$((file_count + 1))
  else
    echo "Warning: Unexpected filename format: ${base}" >&2
  fi
done
shopt -u nullglob

if [ $file_count -eq 0 ]; then
  echo "Warning: No model files generated in ${GEN_DIR}" >&2
  exit 1
fi

set +e
for module_dir in "${REPO_ROOT}/modules"/*/infrastructure/rdb/models; do
  if [ -d "$module_dir" ]; then
    goimports -w "$module_dir" 2>&1 || true
    gofmt -s -w "$module_dir" 2>&1 || true
  fi
done
true
set -e

echo "Models generated successfully."
exit 0
