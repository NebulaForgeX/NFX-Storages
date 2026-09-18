#!/usr/bin/env bash
# NFX-Storages start — requires NFX-Edge (nfx-edge network) first.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
if ! sudo docker network inspect nfx-edge >/dev/null 2>&1; then
  echo "[start.sh] nfx-edge network missing. Start NFX-Edge first (sole reverse proxy)."
  exit 1
fi
COMPOSE_FILE="${1:-docker-compose.yml}"
sudo docker compose -f "$COMPOSE_FILE" up -d --build
echo "[start.sh] done. Check: sudo docker compose -f ${COMPOSE_FILE} ps"
