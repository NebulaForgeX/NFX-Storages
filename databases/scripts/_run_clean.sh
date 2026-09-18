#!/usr/bin/env bash
# Temporary helper: run a db pipeline command in a clean environment (avoids this
# session's corrupted bash-completion functions). Not part of the pipeline.
set -uo pipefail
cd "$(dirname "$0")/../.."
eval "$(grep -E '^POSTGRESQL_(HOST|PORT|USER|PASSWORD|NAME|NAME_SHADOW)=' .env | sed 's/^/export /')"
export POSTGRES_USER="$POSTGRESQL_USER" POSTGRES_PASSWORD="$POSTGRESQL_PASSWORD"
export POSTGRES_HOST="$POSTGRESQL_HOST" POSTGRES_PORT="$POSTGRESQL_PORT"
export POSTGRES_DB="$POSTGRESQL_NAME" POSTGRES_DB_SHADOW="$POSTGRESQL_NAME_SHADOW"
exec "$@"
