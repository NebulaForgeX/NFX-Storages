#!/usr/bin/env bash
set -euo pipefail
export NO_COLOR=1 CLICOLOR=0 FORCE_COLOR=0 TERM=dumb

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ATLAS_DIR="${REPO_ROOT}/databases"
GEN_DIR="${ATLAS_DIR}/gen/views"

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
if [[ -z "${ATLAS_ENV}" ]]; then echo "Error: ATLAS_ENV environment variable is required"; exit 1; fi

# shellcheck source=/dev/null
. "${SCRIPT_DIR}/postgres_client.sh"
if pulsoloop_postgres_use_docker && [[ -z "${POSTGRES_CONTAINER_NAME:-}" ]]; then
  echo "Error: POSTGRES_CONTAINER_NAME environment variable is required for Docker PostgreSQL"
  exit 1
fi

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing dependency: $1" >&2; exit 1; }; }
need gofmt
need goimports

if [ -d "$GEN_DIR" ]; then
  rm -rf "${GEN_DIR:?}/"*
else
  mkdir -p "$GEN_DIR"
fi

for module_views in "${REPO_ROOT}/modules"/*/infrastructure/rdb/views; do
  if [ -d "$module_views" ]; then
    rm -f "${module_views}"/*_dbgen.go
  fi
done

pulsoloop_psql_admin -c "CREATE DATABASE ${POSTGRES_DB_SHADOW};" >/dev/null 2>&1 || true

cd "${ATLAS_DIR}" || exit 1
if ! atlas schema inspect --env gen-views; then
  echo "Error: Atlas schema inspect failed" >&2
  exit 1
fi

shopt -s nullglob
file_count=0
for src in "${GEN_DIR}"/*.go; do
  base="$(basename "${src}")"
  if [[ "$base" =~ ^([^_]+)__(.+)$ ]]; then
    schema_name="${BASH_REMATCH[1]}"
    view_name="${BASH_REMATCH[2]}"
    view_name="${view_name%.go}"
    # DB schema "loop" maps to Go module "content" (Near-style module name).
    module_name="${schema_name}"
    if [[ "${schema_name}" == "loop" ]]; then
      module_name="content"
    fi
    DEST_DIR="${REPO_ROOT}/modules/${module_name}/infrastructure/rdb/views"
    mkdir -p "${DEST_DIR}"
    rm -f "${DEST_DIR}/${view_name}_dbgen.go"
    dest_file="${DEST_DIR}/${view_name}_dbgen.go"
    mv "${src}" "${dest_file}"
    echo "Moved ${base} -> ${dest_file}"
    file_count=$((file_count + 1))
  else
    echo "Warning: Unexpected filename format: ${base}" >&2
  fi
done
shopt -u nullglob

set +e
for module_dir in "${REPO_ROOT}/modules"/*/infrastructure/rdb/views; do
  if [ -d "$module_dir" ]; then
    goimports -w "$module_dir" 2>&1 || true
    gofmt -s -w "$module_dir" 2>&1 || true
  fi
done
true
set -e

echo "Views generated successfully."
exit 0
