#!/usr/bin/env bash
# Bootstrap goose versioning for the license-free pipeline.
#
# Writes a single baseline migration (00001_baseline_schema.sql) containing the
# FULL current schema (the flattened databases/src bundle), then:
#   - if the TARGET database is already provisioned (schema present, e.g. it was
#     historically managed by Atlas), it records the baseline as applied without
#     re-running it;
#   - otherwise it applies the baseline with `goose up` to bootstrap a fresh DB.
#
# After baselining, use db_migrate_diff.sh --write to create incremental goose
# migrations and db_migrate_apply.sh up to apply them.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
. "${SCRIPT_DIR}/db_common.sh"

db_require_env
db_augment_path
db_need go "https://go.dev"
db_need goose "go install github.com/pressly/goose/v3/cmd/goose@latest"

db_build_schemagen

# Provision the target database first if it doesn't exist (Atlas-style).
db_ensure_database "${POSTGRES_DB}"

MIG_DIR="${DATABASES_DIR}/migrations/goose"
mkdir -p "${MIG_DIR}"
BASELINE="${MIG_DIR}/00001_baseline_schema.sql"

if [[ -f "${BASELINE}" ]]; then
  echo "Baseline already exists: ${BASELINE}"
else
  echo "=== Writing baseline migration from current schema ==="
  {
    echo "-- +goose Up"
    echo "-- +goose StatementBegin"
    echo "-- Baseline: full schema snapshot generated from databases/src."
    echo "-- +goose StatementEnd"
    "${SCHEMAGEN_BIN}" --print-bundle --main "${DATABASES_DIR}/src/main.sql"
    echo
    echo "-- +goose Down"
    echo "-- +goose StatementBegin"
    echo "DROP SCHEMA IF EXISTS communication, social, content, asset, auth CASCADE;"
    echo "-- +goose StatementEnd"
  } > "${BASELINE}"
  echo "Wrote ${BASELINE}"
fi

export GOOSE_DRIVER="postgres"
export GOOSE_DBSTRING="$(db_keyword_dsn "${POSTGRES_DB}")"
export GOOSE_MIGRATION_DIR="${MIG_DIR}"

# Initialize goose bookkeeping table (a no-op status call creates it).
goose status >/dev/null 2>&1 || true

PROVISIONED="$(db_psql "${POSTGRES_DB}" -tAc "SELECT to_regclass('auth.\"Accounts\"') IS NOT NULL" 2>/dev/null | tr -d '[:space:]')"

if [[ "${PROVISIONED}" == "t" ]]; then
  echo "=== Target already provisioned: recording baseline as applied (no re-run) ==="
  db_psql "${POSTGRES_DB}" -v ON_ERROR_STOP=1 -c \
    "INSERT INTO goose_db_version (version_id, is_applied, tstamp) SELECT 1, true, now() WHERE NOT EXISTS (SELECT 1 FROM goose_db_version WHERE version_id = 1);"
  echo "Baseline recorded."
else
  # Fresh/unprovisioned target: any existing goose bookkeeping is stale (it can
  # linger from earlier no-op runs) and would make goose treat the baseline as
  # an out-of-order/missing version and skip it. Reset it so the baseline (v1)
  # applies cleanly.
  echo "=== Fresh target: resetting stale goose bookkeeping ==="
  db_psql "${POSTGRES_DB}" -c "DROP TABLE IF EXISTS goose_db_version;" >/dev/null 2>&1 || true
  echo "=== Applying baseline with goose up ==="
  goose up
fi

goose status || true
