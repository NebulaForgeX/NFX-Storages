#!/usr/bin/env bash
# Create nfxstorages_* databases on NFX-Stack Postgres. Reads POSTGRES_* from the environment
# (Taskfile / .env). Does not print the password.
set -euo pipefail
: "${POSTGRES_HOST:?}"
: "${POSTGRES_PORT:?}"
: "${POSTGRES_USER:?}"
: "${POSTGRES_PASSWORD:?}"
export PGPASSWORD="${POSTGRES_PASSWORD}"
for db in nfxstorages_dev nfxstorages nfxstorages_diff; do
  psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d postgres \
    -tc "SELECT 1 FROM pg_database WHERE datname = '${db}'" | grep -q 1 \
    || psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d postgres \
      -c "CREATE DATABASE ${db}"
  echo "ok ${db}"
done
unset PGPASSWORD
