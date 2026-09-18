# Shared helpers for Atlas / codegen scripts.
# Source after POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT are set.
#
# Remote RDS: POSTGRES_HOST not localhost → use psql over TCP (PGSSLMODE default require).
# Local Docker: POSTGRES_HOST is 127.0.0.1|localhost|::1 → docker exec into POSTGRES_CONTAINER_NAME.
# Override: ATLAS_POSTGRES_USE_DOCKER=true|false
# Optional: POSTGRES_SSLMODE — true/1/yes/on => require; false/0/no/off => disable; else libpq mode (require, …)

nfxstorages_normalize_pgsslmode() {
  local v="${POSTGRES_SSLMODE:-${PGSSLMODE:-}}"
  v=$(printf '%s' "$v" | tr '[:upper:]' '[:lower:]')
  case "$v" in
    true | 1 | yes | on) echo require ;;
    false | 0 | no | off) echo disable ;;
    '') echo '' ;;
    *) printf '%s' "$v" ;;
  esac
}

nfxstorages_effective_pgsslmode() {
  local s
  s=$(nfxstorages_normalize_pgsslmode)
  if [[ -n "$s" ]]; then
    printf '%s' "$s"
    return
  fi
  case "${POSTGRES_HOST}" in
    127.0.0.1 | localhost | '::1') echo disable ;;
    *) echo require ;;
  esac
}

nfxstorages_postgres_use_docker() {
  if [[ -n "${ATLAS_POSTGRES_USE_DOCKER:-}" ]]; then
    case "${ATLAS_POSTGRES_USE_DOCKER}" in
      1|true|TRUE|yes|YES|on|ON) return 0 ;;
      0|false|FALSE|no|NO|off|OFF) return 1 ;;
      *)
        echo "Error: ATLAS_POSTGRES_USE_DOCKER must be true or false (got: ${ATLAS_POSTGRES_USE_DOCKER})" >&2
        exit 1
        ;;
    esac
  fi
  case "${POSTGRES_HOST}" in
    127.0.0.1|localhost|'::1') return 0 ;;
    *) return 1 ;;
  esac
}

nfxstorages_docker() {
  if docker info >/dev/null 2>&1; then
    docker "$@"
  elif sudo docker info >/dev/null 2>&1; then
    sudo docker "$@"
  else
    echo "Error: Docker is not available" >&2
    return 1
  fi
}

# Ensure psql exists for remote TCP connections; interactive apt install on Debian/Ubuntu.
nfxstorages_ensure_psql_cli() {
  if command -v psql >/dev/null 2>&1; then
    return 0
  fi
  echo "未检测到 psql（PostgreSQL 客户端），连接远程库需要它。 / psql client not found; required for remote PostgreSQL."
  if [[ -n "${CI:-}" ]] || [[ ! -t 0 ]]; then
    echo "非交互环境请手动安装 / Non-interactive: sudo apt-get install -y postgresql-client" >&2
    return 1
  fi
  read -r -p "使用 apt 安装 postgresql-client？[y/N] / Install with apt? [y/N]: " reply
  case "${reply}" in
    [yY]|[yY][eE][sS]) ;;
    *)
      echo "已跳过。可手动执行 / Skipped. Run: sudo apt-get install -y postgresql-client"
      return 1
      ;;
  esac
  if ! command -v apt-get >/dev/null 2>&1; then
    echo "Error: apt-get not found. Install a PostgreSQL client for your OS." >&2
    return 1
  fi
  sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql-client
  command -v psql >/dev/null 2>&1
}

# Run psql against maintenance database "postgres". Pass-through args, e.g. -c "..." or -tc "..."
nfxstorages_psql_admin() {
  if nfxstorages_postgres_use_docker; then
    if [[ -z "${POSTGRES_CONTAINER_NAME:-}" ]]; then
      echo "Error: POSTGRES_CONTAINER_NAME is required for Docker PostgreSQL" >&2
      return 1
    fi
    nfxstorages_docker exec "${POSTGRES_CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d postgres "$@"
  else
    nfxstorages_ensure_psql_cli || return 1
    export PGPASSWORD="${POSTGRES_PASSWORD}"
    export PGSSLMODE="$(nfxstorages_effective_pgsslmode)"
    psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d postgres "$@"
  fi
}
