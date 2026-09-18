#!/usr/bin/env bash
# License-free code generation (replaces atlas:gen / gen_{enums,models,views}.sh).
#
# Loads the flattened schema into the shadow database, then introspects it with
# the custom schemagen tool to (re)write enums/*_enum_dbgen.go and
# modules/*/infrastructure/rdb/{models,views}/*_dbgen.go — byte-for-byte
# compatible with the previous Atlas output.
#
# Usage: db_gen.sh [enums|models|views|all]   (default: all)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
. "${SCRIPT_DIR}/db_common.sh"

KIND="${1:-all}"

db_require_env
db_augment_path
db_need go "https://go.dev"

echo "=== Building schemagen ==="
db_build_schemagen

echo "=== Recreating shadow database (${POSTGRES_DB_SHADOW}) ==="
pulsoloop_psql_admin -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB_SHADOW}';" >/dev/null 2>&1 || true
pulsoloop_psql_admin -c "DROP DATABASE IF EXISTS ${POSTGRES_DB_SHADOW};" >/dev/null 2>&1 || true
pulsoloop_psql_admin -c "CREATE DATABASE ${POSTGRES_DB_SHADOW};" >/dev/null

echo "=== Loading flattened schema into shadow ==="
BUNDLE_SQL="$(mktemp)"
trap 'rm -f "${BUNDLE_SQL}"' EXIT
"${SCHEMAGEN_BIN}" --print-bundle --main "${DATABASES_DIR}/src/main.sql" > "${BUNDLE_SQL}"
db_psql "${POSTGRES_DB_SHADOW}" -v ON_ERROR_STOP=1 -q -f "${BUNDLE_SQL}"

echo "=== Generating Go code (kind=${KIND}) ==="
"${SCHEMAGEN_BIN}" --dsn "$(db_keyword_dsn "${POSTGRES_DB_SHADOW}")" --kind "${KIND}" --repo-root "${REPO_ROOT}"

echo "=== Cleaning up shadow connections ==="
pulsoloop_psql_admin -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB_SHADOW}';" >/dev/null 2>&1 || true

echo "Code generation completed (kind=${KIND})."
