# PowerShell version of gen_enums.sh

$ErrorActionPreference = "Stop"

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
# Script runs from nfxidentity/databases directory, so databases root is parent of scripts
$ATLAS_DIR = (Get-Item $SCRIPT_DIR).Parent.FullName
$REPO_ROOT = (Get-Item $ATLAS_DIR).Parent.FullName
$GEN_DIR = Join-Path $ATLAS_DIR "gen\enums"
$DEST_DIR = Join-Path $REPO_ROOT "enums"

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

# Clean and create gen directory
if (Test-Path $GEN_DIR) {
    Remove-Item -Path "$GEN_DIR\*" -Recurse -Force
} else {
    New-Item -ItemType Directory -Path $GEN_DIR -Force | Out-Null
}

# Clear all generated enum files before generating (avoid stale files when enums are removed)
if (Test-Path $DEST_DIR) {
    Get-ChildItem -Path $DEST_DIR -Filter "*_enum_dbgen.go" -File | Remove-Item -Force
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
# Script runs from databases directory, so we can run atlas directly
Push-Location $ATLAS_DIR
try {
    & atlas schema inspect --env gen-enums
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

# Create destination directory
New-Item -ItemType Directory -Path $DEST_DIR -Force | Out-Null

# Move generated files to enums directory
# Format: {schema}__{bucket}.go -> enums/{schema}_{bucket}_enum_dbgen.go
$fileCount = 0
if (Test-Path $GEN_DIR) {
    $goFiles = Get-ChildItem -Path $GEN_DIR -Filter "*.go"
    foreach ($src in $goFiles) {
        $base = $src.Name
        if ($base -match "^([^_]+)__(.+)$") {
            $schema = $matches[1]
            $rest = $matches[2]
            $bucket = $rest -replace "\.go$", ""
            $destName = "${schema}_${bucket}_enum_dbgen.go"
            $destFile = Join-Path $DEST_DIR $destName
            
            # Clean old file
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
    Write-Host "Info: No enum files generated in $GEN_DIR" -ForegroundColor Yellow
    Write-Host "This might indicate that:"
    Write-Host "  1. No enums are defined in the schema (this is OK)"
    Write-Host "  2. Template generation failed"
    # Don't exit with error - it's OK to have no enums
}

# Format generated Go files
if (Get-Command goimports -ErrorAction SilentlyContinue) {
    & goimports -w $DEST_DIR 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Warning: goimports failed (non-fatal)" -ForegroundColor Yellow
    }
} else {
    Write-Host "Info: goimports not found, skipping formatting"
}

if (Get-Command gofmt -ErrorAction SilentlyContinue) {
    & gofmt -s -w $DEST_DIR 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Warning: gofmt failed (non-fatal)" -ForegroundColor Yellow
    }
} else {
    Write-Host "Info: gofmt not found, skipping formatting"
}

Write-Host "Enums generated successfully."
exit 0

