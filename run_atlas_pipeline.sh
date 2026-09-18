#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# 格式化输出消息（统一长度）
write_header() {
    local message="$1"
    local padded_length=55  # 中间内容的标准长度（基于最长消息）
    local padded=$(printf "%-${padded_length}s" "$message")
    echo "=============== ${padded} ==============="
}

# 如果第一个参数未提供，显示交互式选择菜单
if [[ $# -eq 0 ]]; then
  echo ""
  echo "Select environment:"
  echo -e "\033[32m[D]ev\033[0m"      # 绿色
  echo -e "\033[35m[P]rod\033[0m"     # 紫色
  echo -e "\033[31m[E]sc\033[0m"      # 红色
  echo ""
  read -n 1 -r choice
  echo
  case $choice in
    [Dd]) ENV="dev" ;;
    [Pp]) ENV="prod" ;;
    [Ee]) echo "Cancelled"; exit 0 ;;
    *) echo "Invalid choice"; exit 1 ;;
  esac
  
  # 询问是否跳过迁移步骤，直接跳到代码生成
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
    *) SKIP_MIGRATIONS="no" ;;  # 默认不跳过
  esac
else
  # 第一个参数是环境（dev 或 prod），默认为 dev
  ENV="${1:-dev}"
  # 第二个参数是是否跳过迁移（yes/no），默认为 no
  SKIP_MIGRATIONS="${2:-no}"
fi

if [[ "${ENV}" == "prod" ]]; then
  write_header "Running Atlas pipeline for PRODUCTION"
  export ATLAS_ENV=prod
else
  write_header "Running Atlas pipeline for DEVELOPMENT"
  export ATLAS_ENV=dev
fi

# 从环境变量读取配置（由 Taskfile 传递，必须存在，否则报错退出）
if [[ -z "${RESOURCES_DOCKER_COMPOSE}" ]]; then echo "Error: RESOURCES_DOCKER_COMPOSE environment variable is required"; exit 1; fi
if [[ -z "${POSTGRES_USER}" ]]; then echo "Error: POSTGRES_USER environment variable is required"; exit 1; fi
if [[ -z "${POSTGRES_PASSWORD}" ]]; then echo "Error: POSTGRES_PASSWORD environment variable is required"; exit 1; fi
if [[ -z "${POSTGRES_HOST}" ]]; then echo "Error: POSTGRES_HOST environment variable is required"; exit 1; fi
if [[ -z "${POSTGRES_PORT}" ]]; then echo "Error: POSTGRES_PORT environment variable is required"; exit 1; fi
if [[ -z "${POSTGRES_DB_DEV}" ]]; then echo "Error: POSTGRES_DB_DEV environment variable is required"; exit 1; fi
if [[ -z "${POSTGRES_DB_PROD}" ]]; then echo "Error: POSTGRES_DB_PROD environment variable is required"; exit 1; fi
if [[ -z "${POSTGRES_DB_SHADOW}" ]]; then echo "Error: POSTGRES_DB_SHADOW environment variable is required"; exit 1; fi
if [[ -z "${POSTGRES_CONTAINER_NAME}" ]]; then echo "Error: POSTGRES_CONTAINER_NAME environment variable is required"; exit 1; fi
if [[ -z "${ATLAS_CONFIG_PATH}" ]]; then echo "Error: ATLAS_CONFIG_PATH environment variable is required"; exit 1; fi

RESOURCES_DOCKER_COMPOSE="${RESOURCES_DOCKER_COMPOSE}"
POSTGRES_USER="${POSTGRES_USER}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
POSTGRES_HOST="${POSTGRES_HOST}"
POSTGRES_PORT="${POSTGRES_PORT}"
POSTGRES_DB_DEV="${POSTGRES_DB_DEV}"
POSTGRES_DB_PROD="${POSTGRES_DB_PROD}"
POSTGRES_DB_SHADOW="${POSTGRES_DB_SHADOW}"
ATLAS_CONFIG_PATH="${ATLAS_CONFIG_PATH}"

# 确定目标数据库
if [[ "${ENV}" == "prod" ]]; then
  TARGET_DB="${POSTGRES_DB_PROD}"
else
  TARGET_DB="${POSTGRES_DB_DEV}"
fi

# 函数：确保 PostgreSQL 服务正在运行
ensure_postgresql_running() {
  write_header "Checking PostgreSQL service"
  
  # 检查 Docker 命令是否可用
  if ! command -v docker &> /dev/null; then
    echo "Error: Docker command not found. Please install Docker first."
    exit 1
  fi
  
  # 尝试检查容器状态，捕获可能的错误
  output=$(sudo docker ps --filter "name=${POSTGRES_CONTAINER_NAME}" --format "{{.Status}}" 2>&1) || {
    echo "Error: Failed to check Docker container status."
    echo "Docker error output: ${output}"
    echo "Please ensure Docker daemon is running."
    exit 1
  }
  
  if ! echo "${output}" | grep -q "Up"; then
    # 检查容器是否存在（运行中或已停止）
    container_exists=$(sudo docker ps -a --filter "name=${POSTGRES_CONTAINER_NAME}" --format "{{.Names}}" 2>&1) || {
      echo "Error: Failed to list Docker containers."
      echo "Docker error output: ${container_exists}"
      exit 1
    }
    
    if [ -z "${container_exists}" ]; then
      echo "Error: PostgreSQL container '${POSTGRES_CONTAINER_NAME}' not found."
      echo "Available containers:"
      sudo docker ps -a --format "  - {{.Names}}" 2>&1 || echo "  (Unable to list containers)"
    else
      echo "PostgreSQL container ${POSTGRES_CONTAINER_NAME} should be running"
      echo "Please start PostgreSQL service first"
      echo "You can start it with: sudo docker start ${POSTGRES_CONTAINER_NAME}"
    fi
    exit 1
  fi
  echo "PostgreSQL service is running"
}

# 函数：清理 Shadow 数据库连接
clean_shadow_connections() {
  write_header "Cleaning shadow database connections"
  
  # 强制断开所有连接到 shadow 数据库的会话
  sudo docker exec "${POSTGRES_CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB_SHADOW}';" >/dev/null 2>&1
  
  sleep 2
  
  # 再次检查并断开任何残留连接
  sudo docker exec "${POSTGRES_CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB_SHADOW}';" >/dev/null 2>&1
}

# 函数：清理并重建 Shadow 数据库（用于 diff）
clean_diff_database() {
  write_header "Cleaning and recreating shadow database for diff"
  
  # 断开所有连接到 shadow 数据库的会话
  clean_shadow_connections
  
  # 检查数据库是否存在，如果存在则 DROP
  result=$(sudo docker exec "${POSTGRES_CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '${POSTGRES_DB_SHADOW}'" 2>&1)
  if echo "${result}" | grep -qE '\s*1\s*'; then
    echo "Dropping existing shadow database..."
    sudo docker exec "${POSTGRES_CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d postgres -c "DROP DATABASE ${POSTGRES_DB_SHADOW};" >/dev/null 2>&1
  fi
  
  # 创建 shadow 数据库
  echo "Creating shadow database..."
  create_result=$(sudo docker exec "${POSTGRES_CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d postgres -c "CREATE DATABASE ${POSTGRES_DB_SHADOW};" 2>&1)
  if [ $? -ne 0 ] && ! echo "${create_result}" | grep -qi "already exists"; then
    echo "Warning: Failed to create shadow database: ${create_result}"
  fi
  
  # 在 shadow 数据库中创建必需的扩展
  echo "Creating required extensions in shadow database..."
  # sudo docker exec "${POSTGRES_CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB_SHADOW}" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public VERSION '1.3';" >/dev/null 2>&1
  # sudo docker exec "${POSTGRES_CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB_SHADOW}" -c "CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;" >/dev/null 2>&1
  
  # 确保目标数据库存在
  target_result=$(sudo docker exec "${POSTGRES_CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '${TARGET_DB}'" 2>&1)
  if ! echo "${target_result}" | grep -qE '\s*1\s*'; then
    echo "Creating target database: ${TARGET_DB}"
    create_target_result=$(sudo docker exec "${POSTGRES_CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d postgres -c "CREATE DATABASE ${TARGET_DB};" 2>&1)
    if [ $? -ne 0 ] && ! echo "${create_target_result}" | grep -qi "already exists"; then
      echo "Warning: Failed to create target database: ${create_target_result}"
    fi
  fi
  
  # 在目标数据库中创建必需的扩展（如果不存在）
  echo "Ensuring required extensions exist in target database..."
  # sudo docker exec "${POSTGRES_CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d "${TARGET_DB}" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public VERSION '1.3';" >/dev/null 2>&1
  # sudo docker exec "${POSTGRES_CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d "${TARGET_DB}" -c "CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;" >/dev/null 2>&1
}

# 函数：清理数据库连接（生成后使用）
clean_gen_connections() {
  write_header "Cleaning database connections after generation"
  clean_shadow_connections
}

# 执行管道任务
write_header "Starting Atlas pipeline"

# 0. Ensure PostgreSQL is running
ensure_postgresql_running

# 检查是否跳过迁移步骤
if [[ "${SKIP_MIGRATIONS}" == "yes" ]]; then
  echo ""
  echo "Skipping migration steps, going directly to code generation..."
  echo ""
else
  # 1. Clean diff database before diff
  write_header "Step 1: Preparing diff database"
  clean_diff_database

  # 2. Generate migrations
  write_header "Step 2: Generating migrations (atlas:diff)"
  echo "Using POSTGRES_HOST=${POSTGRES_HOST} POSTGRES_PORT=${POSTGRES_PORT}"
  # 设置环境变量供 atlas.hcl 使用
  export POSTGRES_USER="${POSTGRES_USER}"
  export POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
  export POSTGRES_HOST="${POSTGRES_HOST}"
  export POSTGRES_PORT="${POSTGRES_PORT}"
  export POSTGRES_DB_DEV="${POSTGRES_DB_DEV}"
  export POSTGRES_DB_PROD="${POSTGRES_DB_PROD}"
  export POSTGRES_DB_SHADOW="${POSTGRES_DB_SHADOW}"
  # 切换到 databases 目录运行，这样 Atlas 可以正确解析相对路径
  cd databases || exit 1
  # atlas migrate diff 会自动比较 env 配置中的 url（当前数据库）和 src（目标状态），生成迁移
  # 不使用 --config，让 Atlas 自动查找 atlas.hcl
  atlas migrate diff --env ${ATLAS_ENV}
  if [[ $? -ne 0 ]]; then
    echo "Atlas migrate diff failed with exit code $?"
    cd .. || true
    exit $?
  fi
  cd .. || true

  # 3. Lint migrations (optional, may require Atlas Pro)
  write_header "Step 3: Linting migrations (optional)"
  cd databases || exit 1
  atlas migrate lint --env ${ATLAS_ENV} --latest 1 -w || {
    echo "Warning: Lint check failed or skipped (may require Atlas Pro account)"
    echo "Continuing with migration apply..."
  }
  cd .. || true

  # 4. Apply migrations
  write_header "Step 4: Applying migrations (atlas:apply)"
  cd databases || exit 1
  atlas migrate apply --env ${ATLAS_ENV}
  if [[ $? -ne 0 ]]; then
    echo "Atlas migrate apply failed with exit code $?"
    cd .. || true
    exit $?
  fi
  cd .. || true

  # 5. Check status
  write_header "Step 5: Checking migration status"
  cd databases || exit 1
  atlas migrate status --env ${ATLAS_ENV}
  if [[ $? -ne 0 ]]; then
    echo "Atlas migrate status failed with exit code $?"
    cd .. || true
    exit $?
  fi
  cd .. || true

  # 5.5. Wait for user to manually add views to migration files
  write_header "Step 5.5: Waiting for manual view migration"
  echo ""
  echo "IMPORTANT: Atlas migrate diff does not include views (Atlas Pro feature)."
  echo "Please manually add CREATE VIEW statements to the migration files in:"
  echo "  - databases/migrations/${ATLAS_ENV}/"
  echo ""
  echo "After adding views, please:"
  echo "  1. Apply the updated migrations manually, OR"
  echo "  2. Continue and we will apply them in the next step"
  echo ""
  while true; do
    read -p "Have you finished adding views to migration files? (y/n): " response
    case $response in
      [yY] )
        echo "Continuing with the pipeline..."
        break
        ;;
      [nN] )
        echo "Waiting... Please add views to migration files and try again."
        ;;
      * )
        echo "Please enter 'y' for yes or 'n' for no."
        ;;
    esac
  done

  # 5.6. Re-apply migrations (in case views were added)
  write_header "Step 5.6: Re-applying migrations (includes manual views)"
  cd databases || exit 1
  atlas migrate apply --env ${ATLAS_ENV}
  if [[ $? -ne 0 ]]; then
    echo "Warning: Atlas migrate apply failed with exit code $?"
    echo "This might be expected if views were already applied manually."
  fi
  cd .. || true
fi

# 6. Generate Go code
write_header "Step 6: Generating Go code (atlas:gen)"
ATLAS_ENV="${ATLAS_ENV}" task atlas:gen
if [[ $? -ne 0 ]]; then
  echo "Task atlas:gen failed with exit code $?"
  exit $?
fi

# 7. Clean connections after generation
clean_gen_connections

  # 8. Final status check (only if migrations were run)
  if [[ "${SKIP_MIGRATIONS}" != "yes" ]]; then
    write_header "Step 7: Final status check"
    cd databases || exit 1
  atlas migrate status --env ${ATLAS_ENV}
  if [[ $? -ne 0 ]]; then
    echo "Atlas migrate status failed with exit code $?"
    cd .. || true
    exit $?
  fi
  cd .. || true
fi

write_header "All Atlas tasks completed successfully (${ENV})"
