#!/bin/bash

# NebulaFX Enhanced Docker Deployment Examples
# This script demonstrates various deployment scenarios for NebulaFX with console separation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_section() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Function to clean up existing containers
cleanup() {
    log_info "Cleaning up existing NebulaFX containers..."
    docker stop nebulafx-basic nebulafx-dev nebulafx-prod 2>/dev/null || true
    docker rm nebulafx-basic nebulafx-dev nebulafx-prod 2>/dev/null || true
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=0
    
    log_info "Waiting for $service_name to be ready at $url..."
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            log_info "$service_name is ready!"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    log_error "$service_name failed to start within ${max_attempts}s"
    return 1
}

# Scenario 1: Basic deployment with port mapping
deploy_basic() {
    log_section "Scenario 1: Basic Docker Deployment with Port Mapping"
    
    log_info "Starting NebulaFX with port mapping 9020:9000 and 9021:9001"
    
    docker run -d \
        --name nebulafx-basic \
        -p 9020:9000 \
        -p 9021:9001 \
        -e NEUBULAFX_EXTERNAL_ADDRESS=":9020" \
        -e NEUBULAFX_CORS_ALLOWED_ORIGINS="http://localhost:9021,http://127.0.0.1:9021" \
        -e NEUBULAFX_CONSOLE_CORS_ALLOWED_ORIGINS="*" \
        -e NEUBULAFX_ACCESS_KEY="basic-access" \
        -e NEUBULAFX_SECRET_KEY="basic-secret" \
        -v nebulafx-basic-data:/data \
        nebulafx/nebulafx:latest
    
    # Wait for services to be ready
    wait_for_service "http://localhost:9020/health" "API Service"
    wait_for_service "http://localhost:9021/health" "Console Service"
    
    log_info "Basic deployment ready!"
    log_info "🌐 API endpoint: http://localhost:9020"
    log_info "🖥️  Console UI: http://localhost:9021/nebulafx/console/"
    log_info "🔐 Credentials: basic-access / basic-secret"
    log_info "🏥 Health checks:"
    log_info "    API: curl http://localhost:9020/health"
    log_info "    Console: curl http://localhost:9021/health"
}

# Scenario 2: Development environment
deploy_development() {
    log_section "Scenario 2: Development Environment"
    
    log_info "Starting NebulaFX development environment"
    
    docker run -d \
        --name nebulafx-dev \
        -p 9030:9000 \
        -p 9031:9001 \
        -e NEUBULAFX_EXTERNAL_ADDRESS=":9030" \
        -e NEUBULAFX_CORS_ALLOWED_ORIGINS="*" \
        -e NEUBULAFX_CONSOLE_CORS_ALLOWED_ORIGINS="*" \
        -e NEUBULAFX_ACCESS_KEY="dev-access" \
        -e NEUBULAFX_SECRET_KEY="dev-secret" \
        -e RUST_LOG="debug" \
        -v nebulafx-dev-data:/data \
        nebulafx/nebulafx:latest
    
    # Wait for services to be ready
    wait_for_service "http://localhost:9030/health" "Dev API Service"
    wait_for_service "http://localhost:9031/health" "Dev Console Service"
    
    log_info "Development deployment ready!"
    log_info "🌐 API endpoint: http://localhost:9030"
    log_info "🖥️  Console UI: http://localhost:9031/nebulafx/console/"
    log_info "🔐 Credentials: dev-access / dev-secret"
    log_info "📊 Debug logging enabled"
    log_info "🏥 Health checks:"
    log_info "    API: curl http://localhost:9030/health"
    log_info "    Console: curl http://localhost:9031/health"
}

# Scenario 3: Production-like environment with security
deploy_production() {
    log_section "Scenario 3: Production-like Deployment"
    
    log_info "Starting NebulaFX production-like environment with security"
    
    # Generate secure credentials
    ACCESS_KEY=$(openssl rand -hex 16)
    SECRET_KEY=$(openssl rand -hex 32)
    
    # Save credentials for reference
    cat > nebulafx-prod-credentials.env << EOF
# NebulaFX Production Deployment Credentials
# Generated: $(date)
NEUBULAFX_ACCESS_KEY=$ACCESS_KEY
NEUBULAFX_SECRET_KEY=$SECRET_KEY
EOF
    chmod 600 nebulafx-prod-credentials.env
    
    docker run -d \
        --name nebulafx-prod \
        -p 9040:9000 \
        -p 127.0.0.1:9041:9001 \
        -e NEUBULAFX_ADDRESS="0.0.0.0:9000" \
        -e NEUBULAFX_CONSOLE_ADDRESS="0.0.0.0:9001" \
        -e NEUBULAFX_EXTERNAL_ADDRESS=":9040" \
        -e NEUBULAFX_CORS_ALLOWED_ORIGINS="https://myapp.example.com" \
        -e NEUBULAFX_CONSOLE_CORS_ALLOWED_ORIGINS="https://admin.example.com" \
        -e NEUBULAFX_ACCESS_KEY="$ACCESS_KEY" \
        -e NEUBULAFX_SECRET_KEY="$SECRET_KEY" \
        -v nebulafx-prod-data:/data \
        nebulafx/nebulafx:latest
    
    # Wait for services to be ready
    wait_for_service "http://localhost:9040/health" "Prod API Service"
    wait_for_service "http://127.0.0.1:9041/health" "Prod Console Service"
    
    log_info "Production deployment ready!"
    log_info "🌐 API endpoint: http://localhost:9040 (public)"
    log_info "🖥️  Console UI: http://127.0.0.1:9041/nebulafx/console/ (localhost only)"
    log_info "🔐 Credentials: $ACCESS_KEY / $SECRET_KEY"
    log_info "🔒 Security: Console restricted to localhost"
    log_info "🏥 Health checks:"
    log_info "    API: curl http://localhost:9040/health"
    log_info "    Console: curl http://127.0.0.1:9041/health"
    log_warn "⚠️  Console is restricted to localhost for security"
    log_warn "⚠️  Credentials saved to nebulafx-prod-credentials.env file"
}

# Function to show service status
show_status() {
    log_section "Service Status"
    
    echo "Running containers:"
    docker ps --filter "name=nebulafx-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo -e "\nService endpoints:"
    if docker ps --filter "name=nebulafx-basic" --format "{{.Names}}" | grep -q nebulafx-basic; then
        echo "  Basic API:     http://localhost:9020"
        echo "  Basic Console: http://localhost:9021/nebulafx/console/"
    fi
    
    if docker ps --filter "name=nebulafx-dev" --format "{{.Names}}" | grep -q nebulafx-dev; then
        echo "  Dev API:       http://localhost:9030"
        echo "  Dev Console:   http://localhost:9031/nebulafx/console/"
    fi
    
    if docker ps --filter "name=nebulafx-prod" --format "{{.Names}}" | grep -q nebulafx-prod; then
        echo "  Prod API:      http://localhost:9040"
        echo "  Prod Console:  http://127.0.0.1:9041/nebulafx/console/"
    fi
}

# Function to test services
test_services() {
    log_section "Testing Services"
    
    # Test basic deployment
    if docker ps --filter "name=nebulafx-basic" --format "{{.Names}}" | grep -q nebulafx-basic; then
        log_info "Testing basic deployment..."
        if curl -s http://localhost:9020/health | grep -q "ok"; then
            log_info "✓ Basic API health check passed"
        else
            log_error "✗ Basic API health check failed"
        fi
        
        if curl -s http://localhost:9021/health | grep -q "console"; then
            log_info "✓ Basic Console health check passed"
        else
            log_error "✗ Basic Console health check failed"
        fi
    fi
    
    # Test development deployment
    if docker ps --filter "name=nebulafx-dev" --format "{{.Names}}" | grep -q nebulafx-dev; then
        log_info "Testing development deployment..."
        if curl -s http://localhost:9030/health | grep -q "ok"; then
            log_info "✓ Dev API health check passed"
        else
            log_error "✗ Dev API health check failed"
        fi
        
        if curl -s http://localhost:9031/health | grep -q "console"; then
            log_info "✓ Dev Console health check passed"
        else
            log_error "✗ Dev Console health check failed"
        fi
    fi
    
    # Test production deployment
    if docker ps --filter "name=nebulafx-prod" --format "{{.Names}}" | grep -q nebulafx-prod; then
        log_info "Testing production deployment..."
        if curl -s http://localhost:9040/health | grep -q "ok"; then
            log_info "✓ Prod API health check passed"
        else
            log_error "✗ Prod API health check failed"
        fi
        
        if curl -s http://127.0.0.1:9041/health | grep -q "console"; then
            log_info "✓ Prod Console health check passed"
        else
            log_error "✗ Prod Console health check failed"
        fi
    fi
}

# Function to show logs
show_logs() {
    log_section "Service Logs"
    
    if [ -n "$1" ]; then
        docker logs "$1"
    else
        echo "Available containers:"
        docker ps --filter "name=nebulafx-" --format "{{.Names}}"
        echo -e "\nUsage: $0 logs <container-name>"
    fi
}

# Main menu
case "${1:-menu}" in
    "basic")
        cleanup
        deploy_basic
        ;;
    "dev")
        cleanup
        deploy_development
        ;;
    "prod")
        cleanup
        deploy_production
        ;;
    "all")
        cleanup
        deploy_basic
        deploy_development  
        deploy_production
        show_status
        ;;
    "status")
        show_status
        ;;
    "test")
        test_services
        ;;
    "logs")
        show_logs "$2"
        ;;
    "cleanup")
        cleanup
        docker volume rm nebulafx-basic-data nebulafx-dev-data nebulafx-prod-data 2>/dev/null || true
        log_info "Cleanup completed"
        ;;
    "menu"|*)
        echo "NebulaFX Enhanced Docker Deployment Examples"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  basic    - Deploy basic NebulaFX with port mapping"
        echo "  dev      - Deploy development environment"
        echo "  prod     - Deploy production-like environment"
        echo "  all      - Deploy all scenarios"
        echo "  status   - Show status of running containers"
        echo "  test     - Test all running services"
        echo "  logs     - Show logs for specific container"
        echo "  cleanup  - Clean up all containers and volumes"
        echo ""
        echo "Examples:"
        echo "  $0 basic           # Deploy basic setup"
        echo "  $0 status          # Check running services"
        echo "  $0 logs nebulafx-dev # Show dev container logs"
        echo "  $0 cleanup         # Clean everything up"
        ;;
esac