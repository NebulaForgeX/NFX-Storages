#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "${REPO_ROOT}"

# shellcheck source=/dev/null
. "${REPO_ROOT}/databases/scripts/postgres_client.sh"

write_header() {
  local message="$1"
  local padded_length=55
  local padded=$(printf "%-${padded_length}s" "$message")
  echo "=============== ${padded} ==============="
}

usage() {
  cat <<'EOF'
Usage: run_atlas_pipeline.sh [OPTIONS] [ENV [SKIP_MIGRATIONS]]

Options:
  --dev, -d                   Development environment (default)
  --secure, -s                Secure (production) environment
  --skip-migrations, --skip   Skip migration steps; run code generation only
  --no-skip-migrations,
  --no-skip                   Full pipeline: migrate diff/apply + code gen (default)
  -y, --yes                   Auto-confirm manual VIEW migration prompt (non-interactive)
  -h, --help                  Show this help

Positional (legacy, still supported):
  ENV              dev | secure
  SKIP_MIGRATIONS  yes | no

Examples:
  run_atlas_pipeline.sh --dev --no-skip
  task atlas:pipeline:run -- --dev --no-skip
  run_atlas_pipeline.sh dev no
  run_atlas_pipeline.sh --secure --skip-migrations
EOF
}

ENV=""
SKIP_MIGRATIONS=""
AUTO_CONFIRM_VIEWS="no"
POSITIONAL=()

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --dev|-d)
        ENV="dev"
        shift
        ;;
      --secure|-s)
        ENV="secure"
        shift
        ;;
      --skip-migrations|--skip)
        SKIP_MIGRATIONS="yes"
        shift
        ;;
      --no-skip-migrations|--no-skip)
        SKIP_MIGRATIONS="no"
        shift
        ;;
      -y|--yes)
        AUTO_CONFIRM_VIEWS="yes"
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      --)
        shift
        POSITIONAL+=("$@")
        break
        ;;
      -*)
        echo "Unknown option: $1"
        usage
        exit 1
        ;;
      *)
        POSITIONAL+=("$1")
        shift
        ;;
    esac
  done

  if [[ ${#POSITIONAL[@]} -gt 0 && -z "${ENV}" ]]; then
    ENV="${POSITIONAL[0]}"
  fi
  if [[ ${#POSITIONAL[@]} -gt 1 && -z "${SKIP_MIGRATIONS}" ]]; then
    SKIP_MIGRATIONS="${POSITIONAL[1]}"
  fi

  ENV="${ENV:-dev}"
  SKIP_MIGRATIONS="${SKIP_MIGRATIONS:-no}"
}

if [[ $# -eq 0 ]]; then
  echo ""
  echo "Select environment:"
  echo -e "\033[32m[D]ev\033[0m"
  echo -e "\033[35m[S]ecure\033[0m"
  echo -e "\033[31m[E]sc\033[0m"
  echo ""
  read -n 1 -r choice
  echo
  case $choice in
    [Dd]) ENV="dev" ;;
    [Ss]) ENV="secure" ;;
    [Ee]) echo "Cancelled"; exit 0 ;;
    *) echo "Invalid choice"; exit 1 ;;
  esac

  echo ""
  echo "Skip migration steps and go directly to code generation?"
  echo -e "\033[32m[Y]es\033[0m - Skip migrations, generate code only"
  echo -e "\033[33m[N]o\033[0m  - Run full pipeline (migrations + code generation)"
  echo ""
  read -n 1 -r skip_choice
  echo
  case $skip_choice in
    [Yy]) SKIP_MIGRATIONS="yes" ;;
    [Nn]) SKIP_MIGRATIONS="no" ;;
    *) SKIP_MIGRATIONS="no" ;;
  esac
else
  parse_args "$@"
fi

if [[ "${ENV}" == "secure" ]]; then
  write_header "Running Atlas pipeline for SECURE"
  export ATLAS_ENV=secure
else
  write_header "Running Atlas pipeline for DEVELOPMENT"
  export ATLAS_ENV=dev
fi

if [[ -z "${POSTGRES_USER}" ]]; then echo "Error: POSTGRES_USER environment variable is required"; exit 1; fi
if [[ -z "${POSTGRES_PASSWORD}" ]]; then echo "Error: POSTGRES_PASSWORD environment variable is required"; exit 1; fi
if [[ -z "${POSTGRES_HOST}" ]]; then echo "Error: POSTGRES_HOST environment variable is required"; exit 1; fi
if [[ -z "${POSTGRES_PORT}" ]]; then echo "Error: POSTGRES_PORT environment variable is required"; exit 1; fi
if [[ -z "${POSTGRES_DB}" ]]; then echo "Error: POSTGRES_DB environment variable is required"; exit 1; fi
if [[ -z "${POSTGRES_DB_SHADOW}" ]]; then echo "Error: POSTGRES_DB_SHADOW environment variable is required"; exit 1; fi
if [[ -z "${ATLAS_CONFIG_PATH}" ]]; then echo "Error: ATLAS_CONFIG_PATH environment variable is required"; exit 1; fi
if nfxstorages_postgres_use_docker && [[ -z "${POSTGRES_CONTAINER_NAME:-}" ]]; then
  echo "Error: POSTGRES_CONTAINER_NAME is required when POSTGRES_HOST is local (Docker PostgreSQL)."
  exit 1
fi

POSTGRES_USER="${POSTGRES_USER}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
POSTGRES_HOST="${POSTGRES_HOST}"
POSTGRES_PORT="${POSTGRES_PORT}"
POSTGRES_DB="${POSTGRES_DB}"
POSTGRES_DB_SHADOW="${POSTGRES_DB_SHADOW}"
ATLAS_CONFIG_PATH="${ATLAS_CONFIG_PATH}"

TARGET_DB="${POSTGRES_DB}"

ensure_postgresql_running() {
  write_header "Checking PostgreSQL service"
  if nfxstorages_postgres_use_docker; then
    if ! command -v docker &> /dev/null; then
      echo "Error: Docker command not found. Please install Docker first."
      exit 1
    fi
    output=$(nfxstorages_docker ps --filter "name=${POSTGRES_CONTAINER_NAME}" --format "{{.Status}}" 2>&1) || {
      echo "Error: Failed to check Docker container status."
      echo "Docker error output: ${output}"
      exit 1
    }
    if ! echo "${output}" | grep -q "Up"; then
      container_exists=$(nfxstorages_docker ps -a --filter "name=${POSTGRES_CONTAINER_NAME}" --format "{{.Names}}" 2>&1) || true
      if [ -z "${container_exists}" ]; then
        echo "Error: PostgreSQL container '${POSTGRES_CONTAINER_NAME}' not found."
        nfxstorages_docker ps -a --format "  - {{.Names}}" 2>&1 || true
      else
        echo "PostgreSQL container ${POSTGRES_CONTAINER_NAME} should be running"
        echo "You can start it with: docker start ${POSTGRES_CONTAINER_NAME} (or sudo docker ...)"
      fi
      exit 1
    fi
    echo "PostgreSQL service is running (Docker)"
  else
    if ! nfxstorages_psql_admin -c "SELECT 1" >/dev/null 2>&1; then
      if ! command -v psql &> /dev/null; then
        exit 1
      fi
      echo "Error: Cannot connect to PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT} (user ${POSTGRES_USER})."
      echo "Hint: check security groups / VPN / POSTGRES_SSLMODE (e.g. require vs disable for tunnels)."
      exit 1
    fi
    echo "PostgreSQL is reachable at ${POSTGRES_HOST}:${POSTGRES_PORT}"
  fi
}

clean_shadow_connections() {
  write_header "Cleaning shadow database connections"
  nfxstorages_psql_admin -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB_SHADOW}';" >/dev/null 2>&1
  sleep 2
  nfxstorages_psql_admin -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB_SHADOW}';" >/dev/null 2>&1
}

clean_diff_database() {
  write_header "Cleaning and recreating shadow database for diff"
  clean_shadow_connections
  result=$(nfxstorages_psql_admin -tc "SELECT 1 FROM pg_database WHERE datname = '${POSTGRES_DB_SHADOW}'" 2>&1)
  if echo "${result}" | grep -qE '\s*1\s*'; then
    echo "Dropping existing shadow database..."
    nfxstorages_psql_admin -c "DROP DATABASE ${POSTGRES_DB_SHADOW};" >/dev/null 2>&1
  fi
  echo "Creating shadow database..."
  create_result=$(nfxstorages_psql_admin -c "CREATE DATABASE ${POSTGRES_DB_SHADOW};" 2>&1)
  if [ $? -ne 0 ] && ! echo "${create_result}" | grep -qi "already exists"; then
    echo "Warning: Failed to create shadow database: ${create_result}"
  fi
  target_result=$(nfxstorages_psql_admin -tc "SELECT 1 FROM pg_database WHERE datname = '${TARGET_DB}'" 2>&1)
  if ! echo "${target_result}" | grep -qE '\s*1\s*'; then
    echo "Creating target database: ${TARGET_DB}"
    create_target_result=$(nfxstorages_psql_admin -c "CREATE DATABASE ${TARGET_DB};" 2>&1)
    if [ $? -ne 0 ] && ! echo "${create_target_result}" | grep -qi "already exists"; then
      echo "Warning: Failed to create target database: ${create_target_result}"
    fi
  fi
}

clean_gen_connections() {
  write_header "Cleaning database connections after generation"
  clean_shadow_connections
}

write_header "Starting Atlas pipeline"
ensure_postgresql_running

if [[ "${SKIP_MIGRATIONS}" == "yes" ]]; then
  echo ""
  echo "Skipping migration steps, going directly to code generation..."
  echo ""
else
  write_header "Step 1: Preparing diff database"
  clean_diff_database

  write_header "Step 2: Generating migrations (atlas migrate diff)"
  echo "Using POSTGRES_HOST=${POSTGRES_HOST} POSTGRES_PORT=${POSTGRES_PORT}"
  export POSTGRES_USER="${POSTGRES_USER}"
  export POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
  export POSTGRES_HOST="${POSTGRES_HOST}"
  export POSTGRES_PORT="${POSTGRES_PORT}"
  export POSTGRES_DB="${POSTGRES_DB}"
  export POSTGRES_DB_SHADOW="${POSTGRES_DB_SHADOW}"
  export POSTGRES_SSLMODE="${POSTGRES_SSLMODE:-}"
  cd databases || exit 1
  if ! atlas migrate diff --env "${ATLAS_ENV}"; then
    echo "Atlas migrate diff failed"
    cd .. || true
    exit 1
  fi
  cd .. || true

  write_header "Step 3: Linting migrations (optional)"
  cd databases || exit 1
  atlas migrate lint --env "${ATLAS_ENV}" --latest 1 -w || {
    echo "Warning: Lint check failed or skipped (may require Atlas Pro account)"
  }
  cd .. || true

  write_header "Step 4: Applying migrations (atlas migrate apply)"
  cd databases || exit 1
  if ! atlas migrate apply --env "${ATLAS_ENV}"; then
    echo "Atlas migrate apply failed"
    cd .. || true
    exit 1
  fi
  cd .. || true

  write_header "Step 5: Checking migration status"
  cd databases || exit 1
  if ! atlas migrate status --env "${ATLAS_ENV}"; then
    echo "Atlas migrate status failed"
    cd .. || true
    exit 1
  fi
  cd .. || true

  write_header "Step 5.5: Manual view migration (if needed)"
  echo ""
  echo "If you need to add CREATE VIEW statements to migration files:"
  echo "  - databases/migrations/${ATLAS_ENV}/"
  echo ""
  if [[ "${AUTO_CONFIRM_VIEWS}" == "yes" ]]; then
    echo "Auto-confirmed (--yes)."
  else
    read -r -p "Have you finished adding views to migration files? (Y/n): " response || true
    response="${response:-y}"
    response="${response:0:1}"
    if [[ "${response}" =~ ^[yY]$ ]]; then
      echo "Continuing with the pipeline..."
    elif [[ "${response}" =~ ^[nN]$ ]]; then
      echo "Waiting... Please add views and try again."
      exit 1
    else
      echo "Please enter 'y' or 'n' (Enter = y)."
      exit 1
    fi
  fi

  write_header "Step 5.6: Re-applying migrations (includes manual views)"
  cd databases || exit 1
  atlas migrate apply --env "${ATLAS_ENV}" || true
  cd .. || true
fi

write_header "Step 6: Generating Go code (atlas:gen)"
if ! ATLAS_ENV="${ATLAS_ENV}" task atlas:gen ENV="${ENV}"; then
  echo "Task atlas:gen failed"
  exit 1
fi

clean_gen_connections

if [[ "${SKIP_MIGRATIONS}" != "yes" ]]; then
  write_header "Step 7: Final status check"
  cd databases || exit 1
  atlas migrate status --env ${ATLAS_ENV} || true
  cd .. || true
fi

write_header "All Atlas tasks completed successfully (${ENV})"
