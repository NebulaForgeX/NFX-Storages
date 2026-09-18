# PowerShell version of gen_models.sh

$ErrorActionPreference = "Stop"

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
# Script runs from nfxidentity/databases directory, so databases root is parent of scripts
$ATLAS_DIR = (Get-Item $SCRIPT_DIR).Parent.FullName
$REPO_ROOT = (Get-Item $ATLAS_DIR).Parent.FullName
$GEN_DIR = Join-Path $ATLAS_DIR "gen\models"

# Check required environment variables
if (-not $env:POSTGRES_USER) { Write-Host "Error: POSTGRES_USER environment variable is required"; exit 1 }
if (-not $env:POSTGRES_PASSWORD) { Write-Host "Error: POSTGRES_PASSWORD environment variable is required"; exit 1 }
if (-not $env:POSTGRES_HOST) { Write-Host "Error: POSTGRES_HOST environment variable is required"; exit 1 }
if (-not $env:POSTGRES_PORT) { Write-Host "Error: POSTGRES_PORT environment variable is required"; exit 1 }
if (-not $env:POSTGRES_DB_DEV) { Write-Host "Error: POSTGRES_DB_DEV environment variable is required"; exit 1 }
if (-not $env:POSTGRES_DB_PROD) { Write-Host "Error: POSTGRES_DB_PROD environment variable is required"; exit 1 }
if (-not $env:POSTGRES_DB_SHADOW) { Write-Host "Error: POSTGRES_DB_SHADOW environment variable is required"; exit 1 }
if (-not $env:ATLAS_ENV) { Write-Host "Error: ATLAS_ENV environment variable is required"; exit 1 }
if (-not $env:RESOURCES_DOCKER_COMPOSE) { Write-Host "Error: RESOURCES_DOCKER_COMPOSE environment variable is required"; exit 1 }

if ($env:ATLAS_ENV -eq "prod") {
    $env:POSTGRES_DB_DEV = $env:POSTGRES_DB_PROD
}

# Check for required Go tools
if (-not (Get-Command goimports -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Missing dependency: goimports" -ForegroundColor Red
    exit 1
}
if (-not (Get-Command gofmt -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Missing dependency: gofmt" -ForegroundColor Red
    exit 1
}

# Clean and create gen directory
if (Test-Path $GEN_DIR) {
    Remove-Item -Path "$GEN_DIR\*" -Recurse -Force
} else {
    New-Item -ItemType Directory -Path $GEN_DIR -Force | Out-Null
}

# Clear all generated model files in module dirs before generating (avoid stale files when tables are removed)
$modulesPath = Join-Path $REPO_ROOT "modules"
if (Test-Path $modulesPath) {
    Get-ChildItem -Path $modulesPath -Directory | ForEach-Object {
        $modelsDir = Join-Path $_.FullName "infrastructure\rdb\models"
        if (Test-Path $modelsDir) {
            Get-ChildItem -Path $modelsDir -Filter "*_dbgen.go" -File | Remove-Item -Force
        }
    }
}

# Set local module prefix for goimports grouping
try {
    $MODPATH = & go list -m 2>&1
    if ($MODPATH -and -not ($MODPATH -match "error|not found")) {
        $env:GOIMPORTSLOCAL = $MODPATH
    }
} catch {
    # Ignore if go list fails
}

$DOCKER_COMPOSE_FILE = $env:RESOURCES_DOCKER_COMPOSE

# Ensure shadow DB exists (ignore error if already exists)
try {
    $result = & docker compose -f $DOCKER_COMPOSE_FILE exec -T postgresql psql -U $env:POSTGRES_USER -d postgres -c "CREATE DATABASE $env:POSTGRES_DB_SHADOW;" 2>&1
    $output = $result -join "`n"
    if ($LASTEXITCODE -ne 0 -and $output -notmatch "already exists") {
        # Only warn if it's not an "already exists" error
        Write-Host "Warning: Failed to create shadow database: $output" -ForegroundColor Yellow
    }
} catch {
    # Ignore errors - database might already exist
}

# Run Atlas inspect + generate
# Use local atlas command directly (same as pipeline script)
Push-Location $ATLAS_DIR
try {
    & atlas schema inspect --env gen-models
} finally {
    Pop-Location
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Atlas schema inspect failed" -ForegroundColor Red
    Write-Host "Please check:"
    Write-Host "  1. Database connection settings (POSTGRES_PASSWORD, etc.)"
    Write-Host "  2. Database is running and accessible"
    exit 1
}

# Distribute generated files to module directories based on schema name
# Format: {schema}__{table}.go -> modules/{schema}/infrastructure/rdb/models/{table}_dbgen.go
$fileCount = 0
if (Test-Path $GEN_DIR) {
    $goFiles = Get-ChildItem -Path $GEN_DIR -Filter "*.go"
    foreach ($src in $goFiles) {
        $base = $src.Name
        if ($base -match "^([^_]+)__(.+)$") {
            $schemaName = $matches[1]
            $tableName = $matches[2] -replace "\.go$", ""
            
            $DEST_DIR = Join-Path $REPO_ROOT "modules\$schemaName\infrastructure\rdb\models"
            New-Item -ItemType Directory -Path $DEST_DIR -Force | Out-Null
            
            # Clean old file
            $destFile = Join-Path $DEST_DIR "${tableName}_dbgen.go"
            if (Test-Path $destFile) {
                Remove-Item -Path $destFile -Force
            }
            
            Move-Item -Path $src.FullName -Destination $destFile -Force
            Write-Host "Moved $base -> $destFile"
            $fileCount++
        } else {
            Write-Host "Warning: Unexpected filename format: $base" -ForegroundColor Yellow
        }
    }
}

if ($fileCount -eq 0) {
    Write-Host "Warning: No model files generated in $GEN_DIR" -ForegroundColor Yellow
    Write-Host "This might indicate that:"
    Write-Host "  1. Tables are in 'public' schema (which is excluded)"
    Write-Host "  2. Schema apply did not run successfully"
    Write-Host "  3. Template generation failed"
    exit 1
}

# Format generated Go files in all module directories
$modulesDir = Join-Path $REPO_ROOT "modules"
if (Test-Path $modulesDir) {
    $modelDirs = Get-ChildItem -Path $modulesDir -Directory | ForEach-Object {
        $modelsPath = Join-Path $_.FullName "infrastructure\rdb\models"
        if (Test-Path $modelsPath) {
            $modelsPath
        }
    }
    
    foreach ($moduleDir in $modelDirs) {
        if (Get-Command goimports -ErrorAction SilentlyContinue) {
            & goimports -w $moduleDir 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Warning: goimports failed for $moduleDir (non-fatal)" -ForegroundColor Yellow
            }
        }
        if (Get-Command gofmt -ErrorAction SilentlyContinue) {
            & gofmt -s -w $moduleDir 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Warning: gofmt failed for $moduleDir (non-fatal)" -ForegroundColor Yellow
            }
        }
    }
}

Write-Host "Models generated successfully."
exit 0

