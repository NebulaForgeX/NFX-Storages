#!/usr/bin/env bash
# License-free versioned migrations (replaces "atlas migrate apply/status").
#
# Thin wrapper around goose, operating on databases/migrations/goose against the
# TARGET database. Any goose command is supported.
#
# Usage:
#   db_migrate_apply.sh up          # apply all pending migrations (default)
#   db_migrate_apply.sh status
#   db_migrate_apply.sh down
#   db_migrate_apply.sh version
#   db_migrate_apply.sh -- <goose args...>
#
# Env: uses POSTGRES_* (mapped from POSTGRESQL_* by the Taskfile).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
. "${SCRIPT_DIR}/db_common.sh"

db_require_env
db_augment_path
db_need goose "go install github.com/pressly/goose/v3/cmd/goose@latest"

MIG_DIR="${DATABASES_DIR}/migrations/goose"
mkdir -p "${MIG_DIR}"

# Create the target database first if it doesn't exist (Atlas-style provisioning).
db_ensure_database "${POSTGRES_DB}"

if [[ "${1:-}" == "--" ]]; then
  shift
fi
GOOSE_CMD=("$@")
[[ "${#GOOSE_CMD[@]}" -eq 0 ]] && GOOSE_CMD=("up")

export GOOSE_DRIVER="postgres"
export GOOSE_DBSTRING="$(db_keyword_dsn "${POSTGRES_DB}")"
export GOOSE_MIGRATION_DIR="${MIG_DIR}"

echo "=== goose ${GOOSE_CMD[*]} (dir=${MIG_DIR}, db=${POSTGRES_DB}) ==="
exec goose "${GOOSE_CMD[@]}"
