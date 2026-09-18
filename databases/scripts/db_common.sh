#!/usr/bin/env bash
# Shared helpers for the license-free DB pipeline (psqldef + goose + schemagen).
#
# This is a PARALLEL replacement for the Atlas scripts; it does not read or
# modify any Atlas configuration. Source it after the POSTGRES_* environment
# variables are set (the Taskfile maps them from POSTGRESQL_* in the dotenv).
#
# Reuses postgres_client.sh only for its connection/sslmode/docker helpers,
# which are generic (not Atlas-specific).

set -euo pipefail

DB_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${DB_SCRIPT_DIR}/../.." && pwd)"
DATABASES_DIR="${REPO_ROOT}/databases"

# shellcheck source=/dev/null
. "${DB_SCRIPT_DIR}/postgres_client.sh"

db_require_env() {
  local missing=0
  for var in POSTGRES_USER POSTGRES_PASSWORD POSTGRES_HOST POSTGRES_PORT POSTGRES_DB POSTGRES_DB_SHADOW; do
    if [[ -z "${!var:-}" ]]; then
      echo "Error: ${var} environment variable is required" >&2
      missing=1
    fi
  done
  [[ "${missing}" -eq 0 ]]
}

# Locate go-installed tools (goimports/psqldef/goose) even when PATH is minimal.
db_augment_path() {
  local home_dir
  for home_dir in "${HOME:-}" "/root" "/home/LucasAsustor"; do
    if [[ -n "${home_dir}" && -d "${home_dir}/go/bin" ]]; then
      export PATH="${PATH}:${home_dir}/go/bin"
    fi
  done
  return 0
}

db_effective_sslmode() { pulsoloop_effective_pgsslmode; }

# Run psql against an arbitrary database (TCP for RDS, docker exec locally).
db_psql() {
  local dbname="$1"; shift
  if pulsoloop_postgres_use_docker; then
    if [[ -z "${POSTGRES_CONTAINER_NAME:-}" ]]; then
      echo "Error: POSTGRES_CONTAINER_NAME is required for Docker PostgreSQL" >&2
      return 1
    fi
    pulsoloop_docker exec -i "${POSTGRES_CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d "${dbname}" "$@"
  else
    pulsoloop_ensure_psql_cli || return 1
    export PGPASSWORD="${POSTGRES_PASSWORD}"
    export PGSSLMODE="$(db_effective_sslmode)"
    psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${dbname}" "$@"
  fi
}

# Create a database if it does not exist yet (like Atlas provisioning the dev DB).
# Safe to call repeatedly; connects to the "postgres" maintenance database.
db_ensure_database() {
  local dbname="$1"
  local exists err
  exists="$(pulsoloop_psql_admin -tAc "SELECT 1 FROM pg_database WHERE datname = '${dbname}'" 2>/dev/null | tr -d '[:space:]')"
  if [[ "${exists}" == "1" ]]; then
    return 0
  fi
  echo "=== Database '${dbname}' does not exist — creating it ===" >&2
  if ! err="$(pulsoloop_psql_admin -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"${dbname}\";" 2>&1)"; then
    echo "Error: failed to create database '${dbname}':" >&2
    echo "${err}" >&2
    return 1
  fi
  echo "=== Created database '${dbname}' ===" >&2
}

# Emit a libpq keyword/value DSN for a database (used by schemagen and goose).
db_keyword_dsn() {
  local dbname="$1"
  printf 'host=%s port=%s user=%s password=%s dbname=%s sslmode=%s' \
    "${POSTGRES_HOST}" "${POSTGRES_PORT}" "${POSTGRES_USER}" "${POSTGRES_PASSWORD}" \
    "${dbname}" "$(db_effective_sslmode)"
}

# Build the schemagen binary into databases/bin/schemagen (idempotent).
SCHEMAGEN_BIN="${DATABASES_DIR}/bin/schemagen"
db_build_schemagen() {
  mkdir -p "${DATABASES_DIR}/bin"
  ( cd "${REPO_ROOT}" && go build -o "${SCHEMAGEN_BIN}" ./databases/cmd/schemagen )
}

db_need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing dependency: $1 (install with: $2)" >&2; exit 1; }; }
