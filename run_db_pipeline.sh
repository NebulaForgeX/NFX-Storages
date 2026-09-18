#!/usr/bin/env bash
# License-free DB pipeline — a parallel, drop-in alternative to
# run_atlas_pipeline.sh that needs no Atlas / Atlas Pro seat.
#
#   ensure DB -> diff (write) -> apply (goose) -> code generation (schemagen)
#
# Mirrors Atlas migrate diff -> migrate apply -> schema inspect/codegen.
# Creates the target database automatically when it does not exist yet.
#
# Usage:
#   run_db_pipeline.sh                 # full: diff --write, apply, generate
#   run_db_pipeline.sh --skip-migrations   # generate code only
#   run_db_pipeline.sh --apply-direct      # apply schema via psqldef (no goose file)
#
# Env: expects POSTGRES_* to be set (the Taskfile maps them from POSTGRESQL_*).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
SCRIPTS="${REPO_ROOT}/databases/scripts"

# shellcheck source=/dev/null
. "${SCRIPTS}/db_common.sh"

SKIP_MIGRATIONS=0
APPLY_DIRECT=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-migrations|--skip) SKIP_MIGRATIONS=1; shift ;;
    --apply-direct) APPLY_DIRECT=1; shift ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

header() { echo "=============== $1 ==============="; }

db_require_env
db_augment_path

# Atlas-style: provision the target database before any connect/apply step.
db_ensure_database "${POSTGRES_DB}"

if [[ "${SKIP_MIGRATIONS}" -eq 0 ]]; then
  if [[ "${APPLY_DIRECT}" -eq 1 ]]; then
    header "Step 1: Applying schema directly (psqldef)"
    bash "${SCRIPTS}/db_migrate_diff.sh" --apply
  else
    header "Step 1: Diffing schema -> goose migration (--write)"
    bash "${SCRIPTS}/db_migrate_diff.sh" --write

    header "Step 2: Applying migrations (goose up)"
    bash "${SCRIPTS}/db_migrate_apply.sh" up

    header "Step 3: Migration status"
    bash "${SCRIPTS}/db_migrate_apply.sh" status || true
  fi
else
  echo "Skipping migration steps; generating code only."
fi

header "Step 4: Generating Go code (schemagen)"
bash "${SCRIPTS}/db_gen.sh" all

header "DB pipeline completed"
