# PowerShell version of Atlas pipeline script

$ErrorActionPreference = "Stop"

# 格式化输出消息（统一长度）
function Write-Header {
    param(
        [string]$Message
    )
    $PADDED_LENGTH = 55  # 中间内容的标准长度（基于最长消息）
    $padded = $Message.PadRight($PADDED_LENGTH).PadLeft($PADDED_LENGTH)
    Write-Host "=============== $padded ==============="
}

# 如果第一个参数未提供，显示交互式选择菜单
if ($args.Count -eq 0) {
    Write-Host ""
    Write-Host "Select environment:" -ForegroundColor Cyan
    Write-Host "[D]ev" -ForegroundColor Green
    Write-Host "[P]rod" -ForegroundColor Magenta
    Write-Host "[E]sc" -ForegroundColor Red
    Write-Host ""
    $choice = Read-Host "Enter your choice"
    switch ($choice) {
        {$_ -match "^[Dd]$"} { $ENV = "dev" }
        {$_ -match "^[Pp]$"} { $ENV = "prod" }
        {$_ -match "^[Ee]$" -or $_ -eq "Esc" -or $_ -eq "ESC"} { 
            Write-Host "Cancelled" -ForegroundColor Red
            exit 0
        }
        default { 
            Write-Host "Invalid choice" -ForegroundColor Red
            exit 1
        }
    }
} else {
    # 第一个参数是环境（dev 或 prod），默认为 dev
    $ENV = $args[0]
}

if ($ENV -eq "prod") {
    Write-Header "Running Atlas pipeline for PRODUCTION"
    $env:ATLAS_ENV = "prod"
} else {
    Write-Header "Running Atlas pipeline for DEVELOPMENT"
    $env:ATLAS_ENV = "dev"
}

# 从环境变量读取配置（由 Taskfile 传递，必须存在，否则报错退出）
if (-not $env:RESOURCES_DOCKER_COMPOSE) { Write-Host "Error: RESOURCES_DOCKER_COMPOSE environment variable is required"; exit 1 }
if (-not $env:POSTGRES_USER) { Write-Host "Error: POSTGRES_USER environment variable is required"; exit 1 }
if (-not $env:POSTGRES_PASSWORD) { Write-Host "Error: POSTGRES_PASSWORD environment variable is required"; exit 1 }
if (-not $env:POSTGRES_HOST) { Write-Host "Error: POSTGRES_HOST environment variable is required"; exit 1 }
if (-not $env:POSTGRES_PORT) { Write-Host "Error: POSTGRES_PORT environment variable is required"; exit 1 }
if (-not $env:POSTGRES_DB_DEV) { Write-Host "Error: POSTGRES_DB_DEV environment variable is required"; exit 1 }
if (-not $env:POSTGRES_DB_PROD) { Write-Host "Error: POSTGRES_DB_PROD environment variable is required"; exit 1 }
if (-not $env:POSTGRES_DB_SHADOW) { Write-Host "Error: POSTGRES_DB_SHADOW environment variable is required"; exit 1 }
if (-not $env:POSTGRES_CONTAINER_NAME) { Write-Host "Error: POSTGRES_CONTAINER_NAME environment variable is required"; exit 1 }

$RESOURCES_DOCKER_COMPOSE = $env:RESOURCES_DOCKER_COMPOSE
$POSTGRES_USER = $env:POSTGRES_USER
$POSTGRES_PASSWORD = $env:POSTGRES_PASSWORD
$POSTGRES_HOST = $env:POSTGRES_HOST
$POSTGRES_PORT = $env:POSTGRES_PORT
$POSTGRES_DB_DEV = $env:POSTGRES_DB_DEV
$POSTGRES_DB_PROD = $env:POSTGRES_DB_PROD
$POSTGRES_DB_SHADOW = $env:POSTGRES_DB_SHADOW
$POSTGRES_CONTAINER_NAME = $env:POSTGRES_CONTAINER_NAME
$ATLAS_CONFIG_PATH = $env:ATLAS_CONFIG_PATH

# 确定目标数据库
$TARGET_DB = if ($ENV -eq "prod") { $POSTGRES_DB_PROD } else { $POSTGRES_DB_DEV }

# 函数：确保 PostgreSQL 服务正在运行
function Ensure-PostgreSQLRunning {
    Write-Header "Checking PostgreSQL service"
    
    $output = & docker ps --filter "name=$POSTGRES_CONTAINER_NAME" --format "{{.Status}}" 2>&1
    if (-not ($output | Select-String -Pattern 'Up' -Quiet)) {
        Write-Host "PostgreSQL container $POSTGRES_CONTAINER_NAME should be running"
        Write-Host "Please start PostgreSQL service first"
        exit 1
    }
    Write-Host "PostgreSQL service is running"
}

# 函数：清理 Shadow 数据库连接
function Clean-ShadowConnections {
    Write-Header "Cleaning shadow database connections"
    
    # 强制断开所有连接到 shadow 数据库的会话
    & docker exec -T $POSTGRES_CONTAINER_NAME psql -U $POSTGRES_USER -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB_SHADOW';" 2>&1 | Out-Null
    
    Start-Sleep -Seconds 2
    
    # 再次检查并断开任何残留连接
    & docker exec -T $POSTGRES_CONTAINER_NAME psql -U $POSTGRES_USER -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB_SHADOW';" 2>&1 | Out-Null
}

# 函数：清理并重建 Shadow 数据库（用于 diff）
function Clean-DiffDatabase {
    Write-Header "Cleaning and recreating shadow database for diff"
    
    # 断开所有连接到 shadow 数据库的会话
    Clean-ShadowConnections
    
    # 检查数据库是否存在，如果存在则 DROP
    $result = & docker exec -T $POSTGRES_CONTAINER_NAME psql -U $POSTGRES_USER -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$POSTGRES_DB_SHADOW'" 2>&1
    $result = $result -join "`n"
    if ($result -match '\s*1\s*') {
        Write-Host "Dropping existing shadow database..."
        & docker exec -T $POSTGRES_CONTAINER_NAME psql -U $POSTGRES_USER -d postgres -c "DROP DATABASE $POSTGRES_DB_SHADOW;" 2>&1 | Out-Null
    }
    
    # 创建 shadow 数据库
    Write-Host "Creating shadow database..."
    $createResult = & docker exec -T $POSTGRES_CONTAINER_NAME psql -U $POSTGRES_USER -d postgres -c "CREATE DATABASE $POSTGRES_DB_SHADOW;" 2>&1
    if ($LASTEXITCODE -ne 0 -and $createResult -notmatch "already exists") {
        Write-Host "Warning: Failed to create shadow database: $createResult"
    }
    
    # 确保目标数据库存在
    $targetResult = & docker exec -T $POSTGRES_CONTAINER_NAME psql -U $POSTGRES_USER -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$TARGET_DB'" 2>&1
    $targetResult = $targetResult -join "`n"
    if (-not ($targetResult -match '\s*1\s*')) {
        Write-Host "Creating target database: $TARGET_DB"
        $createTargetResult = & docker exec -T $POSTGRES_CONTAINER_NAME psql -U $POSTGRES_USER -d postgres -c "CREATE DATABASE $TARGET_DB;" 2>&1
        if ($LASTEXITCODE -ne 0 -and $createTargetResult -notmatch "already exists") {
            Write-Host "Warning: Failed to create target database: $createTargetResult"
        }
    }
}

# 函数：清理数据库连接（生成后使用）
function Clean-GenConnections {
    Write-Header "Cleaning database connections after generation"
    Clean-ShadowConnections
}

# 执行管道任务
Write-Header "Starting Atlas pipeline"

# 0. Ensure PostgreSQL is running
Ensure-PostgreSQLRunning

# 1. Clean diff database before diff
Write-Header "Step 1: Preparing diff database"
Clean-DiffDatabase

# 2. Generate migrations
Write-Header "Step 2: Generating migrations (atlas:diff)"
Write-Host "Using POSTGRES_HOST=$POSTGRES_HOST POSTGRES_PORT=$POSTGRES_PORT"
# 设置环境变量供 atlas.hcl 使用
$env:POSTGRES_USER = $POSTGRES_USER
$env:POSTGRES_PASSWORD = $POSTGRES_PASSWORD
$env:POSTGRES_HOST = $POSTGRES_HOST
$env:POSTGRES_PORT = $POSTGRES_PORT
$env:POSTGRES_DB_DEV = $POSTGRES_DB_DEV
$env:POSTGRES_DB_PROD = $POSTGRES_DB_PROD
$env:POSTGRES_DB_SHADOW = $POSTGRES_DB_SHADOW
# 切换到 databases 目录运行，这样 Atlas 可以正确解析相对路径
Push-Location databases
try {
    # atlas migrate diff 会自动比较 env 配置中的 url（当前数据库）和 src（目标状态），生成迁移
    # 不使用 --config，让 Atlas 自动查找 atlas.hcl
    & atlas migrate diff --env $env:ATLAS_ENV
} finally {
    Pop-Location
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "Atlas migrate diff failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

# 3. Lint migrations (optional, may require Atlas Pro)
Write-Header "Step 3: Linting migrations (optional)"
Push-Location databases
try {
    & atlas migrate lint --env $env:ATLAS_ENV --latest 1 -w
} finally {
    Pop-Location
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Lint check failed or skipped (may require Atlas Pro account)"
    Write-Host "Continuing with migration apply..."
}

# 4. Apply migrations
Write-Header "Step 4: Applying migrations (atlas:apply)"
Push-Location databases
try {
    & atlas migrate apply --env $env:ATLAS_ENV
} finally {
    Pop-Location
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "Atlas migrate apply failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

# 5. Check status
Write-Header "Step 5: Checking migration status"
Push-Location databases
try {
    & atlas migrate status --env $env:ATLAS_ENV
} finally {
    Pop-Location
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "Atlas migrate status failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

# 5.5. Wait for user to manually add views to migration files
Write-Header "Step 5.5: Waiting for manual view migration"
Write-Host ""
Write-Host "IMPORTANT: Atlas migrate diff does not include views (Atlas Pro feature)."
Write-Host "Please manually add CREATE VIEW statements to the migration files in:"
Write-Host "  - databases/migrations/$env:ATLAS_ENV/"
Write-Host ""
Write-Host "After adding views, please:"
Write-Host "  1. Apply the updated migrations manually, OR"
Write-Host "  2. Continue and we will apply them in the next step"
Write-Host ""
do {
    $response = Read-Host "Have you finished adding views to migration files? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "Continuing with the pipeline..."
        break
    } elseif ($response -eq 'n' -or $response -eq 'N') {
        Write-Host "Waiting... Please add views to migration files and try again."
    } else {
        Write-Host "Please enter 'y' for yes or 'n' for no."
    }
} while ($true)

# 5.6. Re-apply migrations (in case views were added)
Write-Header "Step 5.6: Re-applying migrations (includes manual views)"
Push-Location databases
try {
    & atlas migrate apply --env $env:ATLAS_ENV
} finally {
    Pop-Location
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Atlas migrate apply failed with exit code $LASTEXITCODE"
    Write-Host "This might be expected if views were already applied manually."
}

# 6. Generate Go code
Write-Header "Step 6: Generating Go code (atlas:gen)"
$ScriptsDir = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "databases\scripts"

# Ensure RESOURCES_DOCKER_COMPOSE is set for child scripts
$env:RESOURCES_DOCKER_COMPOSE = $RESOURCES_DOCKER_COMPOSE

# Generate enums
Write-Host "Generating enums..."
& (Join-Path $ScriptsDir "gen_enums.ps1")
if ($LASTEXITCODE -ne 0) {
    Write-Host "gen_enums.ps1 failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

# Generate models
Write-Host "Generating models..."
& (Join-Path $ScriptsDir "gen_models.ps1")
if ($LASTEXITCODE -ne 0) {
    Write-Host "gen_models.ps1 failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

# Generate views
Write-Host "Generating views..."
& (Join-Path $ScriptsDir "gen_views.ps1")
if ($LASTEXITCODE -ne 0) {
    Write-Host "gen_views.ps1 failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

# 7. Clean connections after generation
Clean-GenConnections

# 8. Final status check
Write-Header "Step 7: Final status check"
Push-Location databases
try {
    & atlas migrate status --env $env:ATLAS_ENV
} finally {
    Pop-Location
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "Atlas migrate status failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Header "All Atlas tasks completed successfully ($ENV)"
