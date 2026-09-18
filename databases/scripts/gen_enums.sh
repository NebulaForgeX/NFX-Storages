#!/usr/bin/env bash
set -euo pipefail
export NO_COLOR=1 CLICOLOR=0 FORCE_COLOR=0 TERM=dumb

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ATLAS_DIR="${REPO_ROOT}/databases"
GEN_DIR="${ATLAS_DIR}/gen/enums"
DEST_DIR="${REPO_ROOT}/enums"

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
if nfxstorages_postgres_use_docker && [[ -z "${POSTGRES_CONTAINER_NAME:-}" ]]; then
  echo "Error: POSTGRES_CONTAINER_NAME environment variable is required for Docker PostgreSQL"
  exit 1
fi

if [ -d "$GEN_DIR" ]; then
  rm -rf "${GEN_DIR:?}/"*
else
  mkdir -p "$GEN_DIR"
fi

if [ -d "$DEST_DIR" ]; then
  rm -f "${DEST_DIR}"/*_enum_dbgen.go
fi

nfxstorages_psql_admin -c "CREATE DATABASE ${POSTGRES_DB_SHADOW};" >/dev/null 2>&1 || true

cd "${ATLAS_DIR}" || exit 1
if ! atlas schema inspect --env gen-enums; then
  echo "Error: Atlas schema inspect failed" >&2
  exit 1
fi

mkdir -p "${DEST_DIR}"
shopt -s nullglob
file_count=0
for src in "${GEN_DIR}"/*.go; do
  base="$(basename "${src}")"
  if [[ "$base" =~ ^([^_]+)__(.+)$ ]]; then
    schema="${BASH_REMATCH[1]}"
    rest="${BASH_REMATCH[2]}"
    bucket="${rest%.go}"
    dest_name="${schema}_${bucket}_enum_dbgen.go"
    rm -f "${DEST_DIR}/${dest_name}"
    mv "${src}" "${DEST_DIR}/${dest_name}"
    echo "Moved ${base} -> ${DEST_DIR}/${dest_name}"
    file_count=$((file_count + 1))
  else
    echo "Warning: Unexpected filename format: ${base}" >&2
  fi
done
shopt -u nullglob

set +e
if command -v goimports >/dev/null 2>&1; then
  goimports -w "${DEST_DIR}" 2>&1 || true
fi
if command -v gofmt >/dev/null 2>&1; then
  gofmt -s -w "${DEST_DIR}" 2>&1 || true
fi
true
set -e

echo "Enums generated successfully."
exit 0
