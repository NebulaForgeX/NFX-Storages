#!/usr/bin/env bash
# License-free schema diff (replaces "atlas migrate diff").
#
# Shows what would change to bring the live TARGET database in line with the
# desired schema (the flattened databases/src bundle). Two engines:
#
#   pgdump  (default) — dumps schema-only DDL of the desired schema (loaded into
#            the shadow DB) and of the current TARGET, then prints a unified
#            diff. Works natively with our case-sensitive CamelCase, multi-schema
#            and PostGIS objects. Great for review; not directly executable.
#
#   psqldef (opt-in, --engine psqldef) — emits an executable DDL delta. NOTE:
#            the released psqldef cannot introspect case-sensitive quoted
#            identifiers ("Accounts"), so it currently fails on this schema.
#            Kept for schemas that use lowercase identifiers.
#
# Usage:
#   db_migrate_diff.sh                       # pgdump snapshot diff (review)
#   db_migrate_diff.sh --write [name]        # also save the diff as a goose stub
#   db_migrate_diff.sh --engine psqldef      # try executable delta via psqldef
#   db_migrate_diff.sh --engine psqldef --apply
#
# Env: uses POSTGRES_* (mapped from POSTGRESQL_* by the Taskfile).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
. "${SCRIPT_DIR}/db_common.sh"

ENGINE="${DB_DIFF_ENGINE:-pgdump}"
WRITE=0
APPLY=0
NAME="auto"
ENABLE_DROP="${DB_ENABLE_DROP:-0}"
APP_SCHEMAS=(loop)

while [[ $# -gt 0 ]]; do
  case "$1" in
    --engine) ENGINE="$2"; shift 2 ;;
    --write) WRITE=1; shift ;;
    --apply) APPLY=1; shift ;;
    --enable-drop) ENABLE_DROP=1; shift ;;
    --name) NAME="$2"; shift 2 ;;
    *) NAME="$1"; shift ;;
  esac
done

db_require_env
db_augment_path
db_need go "https://go.dev"
db_build_schemagen

export PGPASSWORD="${POSTGRES_PASSWORD}"
export PGSSLMODE="$(db_effective_sslmode)"

BUNDLE_SQL="$(mktemp)"
trap 'rm -f "${BUNDLE_SQL}" "${CUR_DUMP:-}" "${DES_DUMP:-}"' EXIT
"${SCHEMAGEN_BIN}" --print-bundle --main "${DATABASES_DIR}/src/main.sql" > "${BUNDLE_SQL}"

diff_dir_migration() {
  local delta="$1"
  local mig_dir="${DATABASES_DIR}/migrations/goose"
  mkdir -p "${mig_dir}"
  local ts file
  ts="$(date +%Y%m%d%H%M%S)"
  file="${mig_dir}/${ts}_${NAME}.sql"
  {
    echo "-- +goose Up"
    printf '%s\n' "${delta}"
    echo
    echo "-- +goose Down"
    echo "-- TODO: fill in the down migration if you need reversibility."
  } > "${file}"
  echo "Wrote goose migration: ${file}"
}

# Write an EXECUTABLE goose migration (real runnable DDL, e.g. the full schema
# bundle for an empty target). Down drops the app schemas.
diff_executable_migration() {
  local sql="$1"
  local mig_dir="${DATABASES_DIR}/migrations/goose"
  mkdir -p "${mig_dir}"
  local ts file
  ts="$(date +%Y%m%d%H%M%S)"
  file="${mig_dir}/${ts}_${NAME}.sql"
  {
    echo "-- +goose Up"
    printf '%s\n' "${sql}"
    echo
    echo "-- +goose Down"
    echo "-- +goose StatementBegin"
    printf 'DROP SCHEMA IF EXISTS %s CASCADE;\n' "$(IFS=', '; echo "${APP_SCHEMAS[*]}")"
    echo "-- +goose StatementEnd"
  } > "${file}"
  echo "Wrote executable goose migration: ${file}"
}

if [[ "${ENGINE}" == "psqldef" ]]; then
  db_need psqldef "go install github.com/sqldef/sqldef/cmd/psqldef@latest"
  db_ensure_database "${POSTGRES_DB}"
  local_args=(-U "${POSTGRES_USER}" -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}")
  [[ "${ENABLE_DROP}" == "1" ]] && local_args+=(--enable-drop-table)

  echo "=== psqldef --dry-run against ${POSTGRES_DB} ==="
  if ! DELTA="$(psqldef "${local_args[@]}" --dry-run "${POSTGRES_DB}" < "${BUNDLE_SQL}" 2>&1)"; then
    echo "${DELTA}" >&2
    echo "" >&2
    echo "psqldef failed. The released psqldef cannot introspect case-sensitive" >&2
    echo "quoted identifiers used by this schema. Use the default pgdump engine" >&2
    echo "(omit --engine) or write goose migrations manually." >&2
    exit 1
  fi
  echo "${DELTA}"
  if printf '%s\n' "${DELTA}" | grep -qvE '^\s*(--.*)?$'; then
    [[ "${WRITE}" -eq 1 ]] && diff_dir_migration "${DELTA}"
    if [[ "${APPLY}" -eq 1 ]]; then
      echo "=== Applying delta via psqldef ==="
      psqldef "${local_args[@]}" "${POSTGRES_DB}" < "${BUNDLE_SQL}"
    fi
  else
    echo "No schema changes detected."
  fi
  exit 0
fi

# Default engine: pgdump snapshot diff (desired = shadow loaded from bundle).
db_need pg_dump "sudo apt-get install -y postgresql-client"

# Like Atlas provisioning its target: make sure the target DB exists before we
# try to introspect/apply it. A freshly CREATEd DB inherits template1 (PostGIS).
db_ensure_database "${POSTGRES_DB}"

echo "=== Loading desired schema into shadow (${POSTGRES_DB_SHADOW}) ==="
pulsoloop_psql_admin -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB_SHADOW}';" >/dev/null 2>&1 || true
pulsoloop_psql_admin -c "DROP DATABASE IF EXISTS ${POSTGRES_DB_SHADOW};" >/dev/null 2>&1 || true
pulsoloop_psql_admin -c "CREATE DATABASE ${POSTGRES_DB_SHADOW};" >/dev/null
db_psql "${POSTGRES_DB_SHADOW}" -v ON_ERROR_STOP=1 -q -f "${BUNDLE_SQL}"

DUMP_ARGS=(-h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" --schema-only --no-owner --no-privileges --no-comments)
for s in "${APP_SCHEMAS[@]}"; do DUMP_ARGS+=(-n "${s}"); done

CUR_DUMP="$(mktemp)"; DES_DUMP="$(mktemp)"
echo "=== Dumping current (${POSTGRES_DB}) and desired (${POSTGRES_DB_SHADOW}) schemas ==="
DES_ERR="$(pg_dump "${DUMP_ARGS[@]}" "${POSTGRES_DB_SHADOW}" 2>&1 1>"${DES_DUMP}.raw")" || true
if grep -q 'server version mismatch' <<<"${DES_ERR}"; then
  echo "Error: pg_dump is older than the server." >&2
  echo "  ${DES_ERR}" >&2
  echo "Install a matching pg_dump (e.g. PostgreSQL client 18 from the PGDG apt repo)," >&2
  echo "or use goose migrations written by hand. See databases/scripts/README-db-pipeline.md." >&2
  exit 1
fi
# Also drop pg_dump 18's "\restrict"/"\unrestrict" lines: they carry a random
# per-run nonce that would otherwise show up as spurious diff noise.
NOISE='^(--|SET |SELECT pg_catalog|\\(un)?restrict |$)'
grep -vE "${NOISE}" "${DES_DUMP}.raw" > "${DES_DUMP}"; rm -f "${DES_DUMP}.raw"
pg_dump "${DUMP_ARGS[@]}" "${POSTGRES_DB}" 2>/dev/null | grep -vE "${NOISE}" > "${CUR_DUMP}" || true

if [[ ! -s "${DES_DUMP}" ]]; then
  echo "Error: desired schema dump is empty; cannot diff." >&2
  exit 1
fi

echo "=== Schema diff (current -> desired) ==="
if diff -u "${CUR_DUMP}" "${DES_DUMP}" > /tmp/db_schema.diff; then
  echo "No schema changes detected."
elif [[ ! -s "${CUR_DUMP}" ]]; then
  # Current target has NO app objects (fresh/empty DB). The "diff" is simply the
  # entire desired schema, which is already executable DDL. This mirrors Atlas's
  # first "create everything" migration on an empty database.
  echo "Target is empty — the diff is the full schema (executable)."
  if [[ "${WRITE}" -eq 1 ]]; then
    NAME="init_schema"
    diff_executable_migration "$(cat "${BUNDLE_SQL}")"
  fi
else
  # Target already has objects and differs from desired. Without an executable
  # diff engine (psqldef can't handle our quoted identifiers), emit the pg_dump
  # diff as review notes so a human can author the incremental goose migration.
  sed 's|'"${CUR_DUMP}"'|current('"${POSTGRES_DB}"')|; s|'"${DES_DUMP}"'|desired('"${POSTGRES_DB_SHADOW}"')|' /tmp/db_schema.diff
  echo "WARN: target already provisioned and differs. Writing a REVIEW-ONLY diff." >&2
  echo "      Translate it into executable DDL by hand (pgdump diffs are not runnable)." >&2
  if [[ "${WRITE}" -eq 1 ]]; then
    diff_dir_migration "$(cat <<EOF
-- Review the pg_dump diff below and translate it into executable DDL.
-- (pgdump-engine diffs are for review; they are not directly runnable.)
$(sed 's/^/-- /' /tmp/db_schema.diff)
EOF
)"
  fi
fi
