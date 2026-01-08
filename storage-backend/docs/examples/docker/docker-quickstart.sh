#!/bin/bash

# NebulaFX Docker Quick Start Script
# This script provides easy deployment commands for different scenarios

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[NebulaFX]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Print banner
print_banner() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "         NebulaFX Docker Quick Start"
    echo "         Console & Endpoint Separation"
    echo "=================================================="
    echo -e "${NC}"
}

# Check Docker availability
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed or not available in PATH"
        exit 1
    fi
    info "Docker is available: $(docker --version)"
}

# Quick start - basic deployment
quick_basic() {
    log "Starting NebulaFX basic deployment..."
    
    docker run -d \
        --name nebulafx-quick \
        -p 9000:9000 \
        -p 9001:9001 \
        -e NEUBULAFX_EXTERNAL_ADDRESS=":9000" \
        -e NEUBULAFX_CORS_ALLOWED_ORIGINS="http://localhost:9001" \
        -v nebulafx-quick-data:/data \
        nebulafx/nebulafx:latest
    
    echo
    info "✅ NebulaFX deployed successfully!"
    info "🌐 API Endpoint:  http://localhost:9000"
    info "🖥️  Console UI:    http://localhost:9001/nebulafx/console/"
    info "🔐 Credentials:   nebulafxadmin / nebulafxadmin"
    info "🏥 Health Check:  curl http://localhost:9000/health"
    echo
    info "To stop: docker stop nebulafx-quick"
    info "To remove: docker rm nebulafx-quick && docker volume rm nebulafx-quick-data"
}

# Development deployment with debug logging
quick_dev() {
    log "Starting NebulaFX development environment..."
    
    docker run -d \
        --name nebulafx-dev \
        -p 9010:9000 \
        -p 9011:9001 \
        -e NEUBULAFX_EXTERNAL_ADDRESS=":9010" \
        -e NEUBULAFX_CORS_ALLOWED_ORIGINS="*" \
        -e NEUBULAFX_CONSOLE_CORS_ALLOWED_ORIGINS="*" \
        -e NEUBULAFX_ACCESS_KEY="dev-admin" \
        -e NEUBULAFX_SECRET_KEY="dev-secret" \
        -e RUST_LOG="debug" \
        -v nebulafx-dev-data:/data \
        nebulafx/nebulafx:latest
    
    echo
    info "✅ NebulaFX development environment ready!"
    info "🌐 API Endpoint:  http://localhost:9010"
    info "🖥️  Console UI:    http://localhost:9011/nebulafx/console/"
    info "🔐 Credentials:   dev-admin / dev-secret"
    info "📊 Debug logging enabled"
    echo
    info "To stop: docker stop nebulafx-dev"
}

# Production-like deployment
quick_prod() {
    log "Starting NebulaFX production-like deployment..."
    
    # Generate secure credentials
    ACCESS_KEY="prod-$(openssl rand -hex 8)"
    SECRET_KEY="$(openssl rand -hex 24)"
    
    docker run -d \
        --name nebulafx-prod \
        -p 9020:9000 \
        -p 127.0.0.1:9021:9001 \
        -e NEUBULAFX_EXTERNAL_ADDRESS=":9020" \
        -e NEUBULAFX_CORS_ALLOWED_ORIGINS="https://myapp.com" \
        -e NEUBULAFX_CONSOLE_CORS_ALLOWED_ORIGINS="https://admin.myapp.com" \
        -e NEUBULAFX_CONSOLE_RATE_LIMIT_ENABLE="true" \
        -e NEUBULAFX_CONSOLE_RATE_LIMIT_RPM="60" \
        -e NEUBULAFX_ACCESS_KEY="$ACCESS_KEY" \
        -e NEUBULAFX_SECRET_KEY="$SECRET_KEY" \
        -v nebulafx-prod-data:/data \
        nebulafx/nebulafx:latest
    
    # Save credentials
    echo "NEUBULAFX_ACCESS_KEY=$ACCESS_KEY" > nebulafx-prod-credentials.txt
    echo "NEUBULAFX_SECRET_KEY=$SECRET_KEY" >> nebulafx-prod-credentials.txt
    chmod 600 nebulafx-prod-credentials.txt
    
    echo
    info "✅ NebulaFX production deployment ready!"
    info "🌐 API Endpoint:  http://localhost:9020 (public)"
    info "🖥️  Console UI:    http://127.0.0.1:9021/nebulafx/console/ (localhost only)"
    info "🔐 Credentials saved to nebulafx-prod-credentials.txt"
    info "🔒 Console restricted to localhost for security"
    echo
    warn "⚠️  Change default CORS origins for production use"
}

# Stop and cleanup
cleanup() {
    log "Cleaning up NebulaFX deployments..."
    
    docker stop nebulafx-quick nebulafx-dev nebulafx-prod 2>/dev/null || true
    docker rm nebulafx-quick nebulafx-dev nebulafx-prod 2>/dev/null || true
    
    info "Containers stopped and removed"
    echo
    info "To also remove data volumes, run:"
    info "docker volume rm nebulafx-quick-data nebulafx-dev-data nebulafx-prod-data"
}

# Show status of all deployments
status() {
    log "NebulaFX deployment status:"
    echo
    
    if docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q nebulafx; then
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -n1
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep nebulafx
    else
        info "No NebulaFX containers are currently running"
    fi
    
    echo
    info "Available endpoints:"
    
    if docker ps --filter "name=nebulafx-quick" --format "{{.Names}}" | grep -q nebulafx-quick; then
        echo "  Basic:   http://localhost:9000 (API) | http://localhost:9001/nebulafx/console/ (Console)"
    fi
    
    if docker ps --filter "name=nebulafx-dev" --format "{{.Names}}" | grep -q nebulafx-dev; then
        echo "  Dev:     http://localhost:9010 (API) | http://localhost:9011/nebulafx/console/ (Console)"
    fi
    
    if docker ps --filter "name=nebulafx-prod" --format "{{.Names}}" | grep -q nebulafx-prod; then
        echo "  Prod:    http://localhost:9020 (API) | http://127.0.0.1:9021/nebulafx/console/ (Console)"
    fi
}

# Test deployments
test_deployments() {
    log "Testing NebulaFX deployments..."
    echo
    
    # Test basic deployment
    if docker ps --filter "name=nebulafx-quick" --format "{{.Names}}" | grep -q nebulafx-quick; then
        info "Testing basic deployment..."
        if curl -s -f http://localhost:9000/health | grep -q "ok"; then
            echo "  ✅ API health check: PASS"
        else
            echo "  ❌ API health check: FAIL"
        fi
        
        if curl -s -f http://localhost:9001/health | grep -q "console"; then
            echo "  ✅ Console health check: PASS"
        else
            echo "  ❌ Console health check: FAIL"
        fi
    fi
    
    # Test dev deployment
    if docker ps --filter "name=nebulafx-dev" --format "{{.Names}}" | grep -q nebulafx-dev; then
        info "Testing development deployment..."
        if curl -s -f http://localhost:9010/health | grep -q "ok"; then
            echo "  ✅ Dev API health check: PASS"
        else
            echo "  ❌ Dev API health check: FAIL"
        fi
        
        if curl -s -f http://localhost:9011/health | grep -q "console"; then
            echo "  ✅ Dev Console health check: PASS"
        else
            echo "  ❌ Dev Console health check: FAIL"
        fi
    fi
    
    # Test prod deployment  
    if docker ps --filter "name=nebulafx-prod" --format "{{.Names}}" | grep -q nebulafx-prod; then
        info "Testing production deployment..."
        if curl -s -f http://localhost:9020/health | grep -q "ok"; then
            echo "  ✅ Prod API health check: PASS"
        else
            echo "  ❌ Prod API health check: FAIL"
        fi
        
        if curl -s -f http://127.0.0.1:9021/health | grep -q "console"; then
            echo "  ✅ Prod Console health check: PASS"
        else
            echo "  ❌ Prod Console health check: FAIL"
        fi
    fi
}

# Show help
show_help() {
    print_banner
    echo "Usage: $0 [command]"
    echo
    echo "Commands:"
    echo "  basic     Start basic NebulaFX deployment (ports 9000-9001)"
    echo "  dev       Start development deployment with debug logging (ports 9010-9011)"
    echo "  prod      Start production-like deployment with security (ports 9020-9021)"
    echo "  status    Show status of running deployments"
    echo "  test      Test health of all running deployments"
    echo "  cleanup   Stop and remove all NebulaFX containers"
    echo "  help      Show this help message"
    echo
    echo "Examples:"
    echo "  $0 basic      # Quick start with default settings"
    echo "  $0 dev        # Development environment with debug logs"
    echo "  $0 prod       # Production-like setup with security"
    echo "  $0 status     # Check what's running"
    echo "  $0 test       # Test all deployments"
    echo "  $0 cleanup    # Clean everything up"
    echo
    echo "For more advanced deployments, see:"
    echo "  - examples/enhanced-docker-deployment.sh"
    echo "  - examples/enhanced-security-deployment.sh"
    echo "  - examples/docker-comprehensive.yml"
    echo "  - docs/console-separation.md"
    echo
}

# Main execution
case "${1:-help}" in
    "basic")
        print_banner
        check_docker
        quick_basic
        ;;
    "dev")
        print_banner
        check_docker
        quick_dev
        ;;
    "prod")
        print_banner
        check_docker
        quick_prod
        ;;
    "status")
        print_banner
        status
        ;;
    "test")
        print_banner
        test_deployments
        ;;
    "cleanup")
        print_banner
        cleanup
        ;;
    "help"|*)
        show_help
        ;;
esac