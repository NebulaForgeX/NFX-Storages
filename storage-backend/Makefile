###########
# Remote development requires VSCode with Dev Containers, Remote SSH, Remote Explorer
# https://code.visualstudio.com/docs/remote/containers
###########
DOCKER_CLI ?= docker
IMAGE_NAME ?= nebulafx:v1.0.0
CONTAINER_NAME ?= nebulafx-dev
# Docker build configurations
DOCKERFILE_PRODUCTION = Dockerfile
DOCKERFILE_SOURCE = Dockerfile.source

# Code quality and formatting targets
.PHONY: fmt
fmt:
	@echo "🔧 Formatting code..."
	cargo fmt --all

.PHONY: fmt-check
fmt-check:
	@echo "📝 Checking code formatting..."
	cargo fmt --all --check

.PHONY: clippy
clippy:
	@echo "🔍 Running clippy checks..."
	cargo clippy --fix --allow-dirty
	cargo clippy --all-targets --all-features -- -D warnings

.PHONY: check
check:
	@echo "🔨 Running compilation check..."
	cargo check --all-targets

.PHONY: test
test:
	@echo "🧪 Running tests..."
	@if command -v cargo-nextest >/dev/null 2>&1; then \
		cargo nextest run --all --exclude e2e_test; \
	else \
		echo "ℹ️ cargo-nextest not found; falling back to 'cargo test'"; \
		cargo test --workspace --exclude e2e_test -- --nocapture; \
	fi
	cargo test --all --doc

.PHONY: pre-commit
pre-commit: fmt clippy check test
	@echo "✅ All pre-commit checks passed!"

.PHONY: setup-hooks
setup-hooks:
	@echo "🔧 Setting up git hooks..."
	chmod +x .git/hooks/pre-commit
	@echo "✅ Git hooks setup complete!"

.PHONY: unlock
unlock:
	@echo "🔓 Cleaning cargo lock files..."
	@bash -c '\
		MY_PID=$$$$; \
		CARGO_PIDS=$$(pgrep -x cargo 2>/dev/null || true); \
		RUSTC_PIDS=$$(pgrep -x rustc 2>/dev/null || true); \
		if [ -n "$$CARGO_PIDS$$RUSTC_PIDS" ]; then \
			echo "⚠️  Warning: cargo/rustc processes detected. Waiting 3 seconds..."; \
			sleep 3; \
			CARGO_PIDS=$$(pgrep -x cargo 2>/dev/null || true); \
			RUSTC_PIDS=$$(pgrep -x rustc 2>/dev/null || true); \
			if [ -n "$$CARGO_PIDS$$RUSTC_PIDS" ]; then \
				echo "🛑 Stopping cargo/rustc processes (excluding make)..."; \
				for pid in $$CARGO_PIDS; do \
					if [ "$$pid" != "$$MY_PID" ] && ! ps -p $$pid -o comm= 2>/dev/null | grep -q make; then \
						kill $$pid 2>/dev/null || true; \
					fi; \
				done; \
				for pid in $$RUSTC_PIDS; do \
					if [ "$$pid" != "$$MY_PID" ]; then \
						kill $$pid 2>/dev/null || true; \
					fi; \
				done; \
				sleep 2; \
				CARGO_PIDS=$$(pgrep -x cargo 2>/dev/null || true); \
				RUSTC_PIDS=$$(pgrep -x rustc 2>/dev/null || true); \
				if [ -n "$$CARGO_PIDS$$RUSTC_PIDS" ]; then \
					echo "⚠️  Some processes still running, forcing kill..."; \
					for pid in $$CARGO_PIDS; do \
						if [ "$$pid" != "$$MY_PID" ] && ! ps -p $$pid -o comm= 2>/dev/null | grep -q make; then \
							kill -9 $$pid 2>/dev/null || true; \
						fi; \
					done; \
					for pid in $$RUSTC_PIDS; do \
						if [ "$$pid" != "$$MY_PID" ]; then \
							kill -9 $$pid 2>/dev/null || true; \
						fi; \
					done; \
					sleep 1; \
				fi; \
			fi; \
		fi'
	@find target -name ".cargo-lock" -type f -delete 2>/dev/null || true
	@find target -name "*.lock" -type f -path "*/incremental/*" -delete 2>/dev/null || true
	@echo "✅ Lock files cleaned"

.PHONY: run
run: unlock
	@echo "🚀 Running NebulaFX..."
	@bash -c '\
		source ../use-rust1.91.sh 2>/dev/null || true; \
		export RUST_LOG="$${RUST_LOG:-nebulafx=warn,ecstore=warn,s3s=warn,iam=warn}"; \
		export NEUBULAFX_OBS_LOGGER_LEVEL="$${NEUBULAFX_OBS_LOGGER_LEVEL:-warn}"; \
		export NEUBULAFX_OBS_LOG_STDOUT_ENABLED="$${NEUBULAFX_OBS_LOG_STDOUT_ENABLED:-true}"; \
		export NEUBULAFX_LOG_JSON="$${NEUBULAFX_LOG_JSON:-false}"; \
		echo "📝 Log level: $$RUST_LOG"; \
		echo "📝 Log format: $$([ "$$NEUBULAFX_LOG_JSON" = "true" ] && echo "JSON" || echo "Text (compact)")"; \
		cargo run --bin nebulafx -- ./deploy/data/dev{1...8} --address 0.0.0.0:9000'

# Native build using cargo
.PHONY: build
build:
	@echo "🔨 Building NebulaFX binary (release mode)..."
	@bash -c 'source ../use-rust1.91.sh 2>/dev/null || true; cargo build --release --bin nebulafx'

.PHONY: build-dev
build-dev:
	@echo "🔨 Building NebulaFX binary (development mode)..."
	@bash -c 'source ../use-rust1.91.sh 2>/dev/null || true; cargo build --bin nebulafx'

# Docker-based build (alternative approach)
# Usage: make BUILD_OS=ubuntu22.04 build-docker
# Output: target/ubuntu22.04/release/nebulafx
BUILD_OS ?= rockylinux9.3
.PHONY: build-docker
build-docker: SOURCE_BUILD_IMAGE_NAME = nebulafx-$(BUILD_OS):v1
build-docker: SOURCE_BUILD_CONTAINER_NAME = nebulafx-$(BUILD_OS)-build
build-docker: BUILD_CMD = /root/.cargo/bin/cargo build --release --bin nebulafx --target-dir /root/s3-nebulafx/target/$(BUILD_OS)
build-docker:
	@echo "🐳 Building NebulaFX using Docker ($(BUILD_OS))..."
	$(DOCKER_CLI) buildx build -t $(SOURCE_BUILD_IMAGE_NAME) -f $(DOCKERFILE_SOURCE) .
	$(DOCKER_CLI) run --rm --name $(SOURCE_BUILD_CONTAINER_NAME) -v $(shell pwd):/root/s3-nebulafx -it $(SOURCE_BUILD_IMAGE_NAME) $(BUILD_CMD)

# Cross-platform builds (optional - only if needed)
.PHONY: build-musl
build-musl:
	@echo "🔨 Building nebulafx for x86_64-unknown-linux-musl..."
	@bash -c 'source ../use-rust1.91.sh 2>/dev/null || true; rustup target add x86_64-unknown-linux-musl; cargo build --release --bin nebulafx --target x86_64-unknown-linux-musl'

.PHONY: build-gnu
build-gnu:
	@echo "🔨 Building nebulafx for x86_64-unknown-linux-gnu..."
	@bash -c 'source ../use-rust1.91.sh 2>/dev/null || true; cargo build --release --bin nebulafx --target x86_64-unknown-linux-gnu'

.PHONY: build-musl-arm64
build-musl-arm64:
	@echo "🔨 Building nebulafx for aarch64-unknown-linux-musl..."
	@bash -c 'source ../use-rust1.91.sh 2>/dev/null || true; rustup target add aarch64-unknown-linux-musl; cargo build --release --bin nebulafx --target aarch64-unknown-linux-musl'

.PHONY: build-gnu-arm64
build-gnu-arm64:
	@echo "🔨 Building nebulafx for aarch64-unknown-linux-gnu..."
	@bash -c 'source ../use-rust1.91.sh 2>/dev/null || true; rustup target add aarch64-unknown-linux-gnu; cargo build --release --bin nebulafx --target aarch64-unknown-linux-gnu'

# ========================================================================================
# Docker Multi-Architecture Builds (Primary Methods)
# ========================================================================================
.PHONY: docker-dev
docker-dev:
	@echo "🏗️ Building multi-architecture development Docker images with buildx..."
	@echo "💡 This builds from source code and is intended for local development and testing"
	@echo "⚠️  Multi-arch images cannot be loaded locally, use docker-dev-push to push to registry"
	$(DOCKER_CLI) buildx build \
		--platform linux/amd64,linux/arm64 \
		--file $(DOCKERFILE_SOURCE) \
		--tag nebulafx:source-latest \
		--tag nebulafx:dev-latest \
		.

.PHONY: docker-dev-local
docker-dev-local:
	@echo "🏗️ Building single-architecture development Docker image for local use..."
	@echo "💡 This builds from source code for the current platform and loads locally"
	$(DOCKER_CLI) buildx build \
		--file $(DOCKERFILE_SOURCE) \
		--tag nebulafx:source-latest \
		--tag nebulafx:dev-latest \
		--load \
		.

.PHONY: docker-dev-push
docker-dev-push:
	@if [ -z "$(REGISTRY)" ]; then \
		echo "❌ Error: Please specify registry, example: make docker-dev-push REGISTRY=ghcr.io/username"; \
		exit 1; \
	fi
	@echo "🚀 Building and pushing multi-architecture development Docker images..."
	@echo "💡 Pushing to registry: $(REGISTRY)"
	$(DOCKER_CLI) buildx build \
		--platform linux/amd64,linux/arm64 \
		--file $(DOCKERFILE_SOURCE) \
		--tag $(REGISTRY)/nebulafx:source-latest \
		--tag $(REGISTRY)/nebulafx:dev-latest \
		--push \
		.



# Local production builds using direct buildx (alternative to docker-buildx.sh)
.PHONY: docker-buildx-production-local
docker-buildx-production-local:
	@echo "🏗️ Building single-architecture production Docker image locally..."
	@echo "💡 Alternative to docker-buildx.sh for local testing"
	$(DOCKER_CLI) buildx build \
		--file $(DOCKERFILE_PRODUCTION) \
		--tag nebulafx:production-latest \
		--tag nebulafx:latest \
		--load \
		--build-arg RELEASE=latest \
		.

# ========================================================================================
# Single Architecture Docker Builds (Traditional)
# ========================================================================================

.PHONY: docker-build-production
docker-build-production:
	@echo "🏗️ Building single-architecture production Docker image..."
	@echo "💡 Consider using 'make docker-buildx-production-local' for multi-arch support"
	$(DOCKER_CLI) build -f $(DOCKERFILE_PRODUCTION) -t nebulafx:latest .

.PHONY: docker-build-source
docker-build-source:
	@echo "🏗️ Building single-architecture source Docker image..."
	@echo "💡 Consider using 'make docker-dev-local' for multi-arch support"
	DOCKER_BUILDKIT=1 $(DOCKER_CLI) build \
		--build-arg BUILDKIT_INLINE_CACHE=1 \
		-f $(DOCKERFILE_SOURCE) -t nebulafx:source .

# ========================================================================================
# Development Environment
# ========================================================================================

.PHONY: dev-env-start
dev-env-start:
	@echo "🚀 Starting development environment..."
	$(DOCKER_CLI) buildx build \
		--file $(DOCKERFILE_SOURCE) \
		--tag nebulafx:dev \
		--load \
		.
	$(DOCKER_CLI) stop $(CONTAINER_NAME) 2>/dev/null || true
	$(DOCKER_CLI) rm $(CONTAINER_NAME) 2>/dev/null || true
	$(DOCKER_CLI) run -d --name $(CONTAINER_NAME) \
		-p 9000:9000 \
		-v $(shell pwd):/workspace \
		-it nebulafx:dev

.PHONY: dev-env-stop
dev-env-stop:
	@echo "🛑 Stopping development environment..."
	$(DOCKER_CLI) stop $(CONTAINER_NAME) 2>/dev/null || true
	$(DOCKER_CLI) rm $(CONTAINER_NAME) 2>/dev/null || true

.PHONY: dev-env-restart
dev-env-restart: dev-env-stop dev-env-start



# ========================================================================================
# Build Utilities
# ========================================================================================

.PHONY: docker-inspect-multiarch
docker-inspect-multiarch:
	@if [ -z "$(IMAGE)" ]; then \
		echo "❌ Error: Please specify image, example: make docker-inspect-multiarch IMAGE=nebulafx/nebulafx:latest"; \
		exit 1; \
	fi
	@echo "🔍 Inspecting multi-architecture image: $(IMAGE)"
	docker buildx imagetools inspect $(IMAGE)

.PHONY: build-cross-all
build-cross-all:
	@echo "🔧 Building all target architectures..."
	@echo "💡 On macOS/Windows, use 'make docker-dev' for reliable multi-arch builds"
	@bash -c 'source ../use-rust1.91.sh 2>/dev/null || true; \
		echo "🔨 Building x86_64-unknown-linux-gnu..."; \
		rustup target add x86_64-unknown-linux-gnu; \
		cargo build --release --bin nebulafx --target x86_64-unknown-linux-gnu; \
		echo "🔨 Building aarch64-unknown-linux-gnu..."; \
		rustup target add aarch64-unknown-linux-gnu; \
		cargo build --release --bin nebulafx --target aarch64-unknown-linux-gnu; \
		echo "🔨 Building x86_64-unknown-linux-musl..."; \
		rustup target add x86_64-unknown-linux-musl; \
		cargo build --release --bin nebulafx --target x86_64-unknown-linux-musl; \
		echo "🔨 Building aarch64-unknown-linux-musl..."; \
		rustup target add aarch64-unknown-linux-musl; \
		cargo build --release --bin nebulafx --target aarch64-unknown-linux-musl; \
		echo "✅ All architectures built successfully!"'

# ========================================================================================
# Help and Documentation
# ========================================================================================

.PHONY: help-build
help-build:
	@echo "🔨 NebulaFX Build Help:"
	@echo ""
	@echo "🚀 Local Build (Recommended):"
	@echo "  make build                               # Build NebulaFX binary (frontend runs independently)"
	@echo "  make build-dev                           # Development mode build"
	@echo "  make build-musl                          # Build x86_64 musl version"
	@echo "  make build-gnu                           # Build x86_64 GNU version"
	@echo "  make build-musl-arm64                    # Build aarch64 musl version"
	@echo "  make build-gnu-arm64                     # Build aarch64 GNU version"
	@echo ""
	@echo "🐳 Docker Build:"
	@echo "  make build-docker                        # Build using Docker container"
	@echo "  make build-docker BUILD_OS=ubuntu22.04   # Specify build system"
	@echo ""
	@echo "🏗️ Cross-architecture Build:"
	@echo "  make build-cross-all                     # Build binaries for all architectures"
	@echo ""
	@echo "🔧 Direct cargo usage:"
	@echo "  cargo build --release --bin nebulafx       # Build release binary"
	@echo "  cargo build --bin nebulafx                 # Build debug binary"
	@echo "  cargo run --bin nebulafx                   # Build and run"
	@echo ""
	@echo "💡 Frontend (nebulafxconsole) runs independently - see nebulafxconsole project"

.PHONY: help-docker
help-docker:
	@echo "🐳 Docker Multi-architecture Build Help:"
	@echo ""
	@echo "🚀 Production Image Build:"
	@echo "  make docker-buildx                       # Build production multi-arch image (no push)"
	@echo "  make docker-buildx-push REGISTRY=xxx     # Build and push production multi-arch image"
	@echo "  make docker-buildx-version VERSION=v1.0.0        # Build specific version"
	@echo "  make docker-buildx-push-version VERSION=v1.0.0 REGISTRY=xxx   # Build and push specific version"
	@echo ""
	@echo "🔧 Development/Source Image Build (Local development testing):"
	@echo "  make docker-dev                          # Build dev multi-arch image (cannot load locally)"
	@echo "  make docker-dev-local                    # Build dev single-arch image (local load)"
	@echo "  make docker-dev-push REGISTRY=xxx       # Build and push dev image"
	@echo ""
	@echo "🏗️ Local Production Image Build (Alternative):"
	@echo "  make docker-buildx-production-local      # Build production single-arch image locally"
	@echo ""
	@echo "📦 Single-architecture Build (Traditional way):"
	@echo "  make docker-build-production             # Build single-arch production image"
	@echo "  make docker-build-source                 # Build single-arch source image"
	@echo ""
	@echo "🚀 Development Environment Management:"
	@echo "  make dev-env-start                       # Start development container environment"
	@echo "  make dev-env-stop                        # Stop development container environment"
	@echo "  make dev-env-restart                     # Restart development container environment"
	@echo ""
	@echo "🔧 Auxiliary Tools:"
	@echo "  make build-cross-all                     # Build binaries for all architectures"
	@echo "  make docker-inspect-multiarch IMAGE=xxx  # Check image architecture support"
	@echo ""
	@echo "📋 Environment Variables:"
	@echo "  REGISTRY          Image registry address (required for push)"
	@echo "  DOCKERHUB_USERNAME    Docker Hub username"
	@echo "  DOCKERHUB_TOKEN       Docker Hub access token"
	@echo "  GITHUB_TOKEN          GitHub access token"
	@echo ""
	@echo "💡 Suggestions:"
	@echo "  - Production use: Use docker-buildx* commands"
	@echo "  - Local development: Use docker-dev* commands (build from source)"
	@echo "  - Development environment: Use dev-env-* commands to manage dev containers"
	@echo "  - Frontend: Runs independently in nebulafxconsole project"

.PHONY: help
help:
	@echo "🦀 NebulaFX Makefile Help:"
	@echo ""
	@echo "📋 Main Command Categories:"
	@echo "  make help-build                          # Show build-related help"
	@echo "  make help-docker                         # Show Docker-related help"
	@echo ""
	@echo "🔧 Code Quality:"
	@echo "  make fmt                                 # Format code"
	@echo "  make clippy                              # Run clippy checks"
	@echo "  make test                                # Run tests"
	@echo "  make pre-commit                          # Run all pre-commit checks"
	@echo ""
	@echo "🚀 Quick Start:"
	@echo "  make run                                 # Clean locks and run NebulaFX"
	@echo "  make build                               # Build NebulaFX binary"
	@echo "  make docker-dev-local                    # Build development Docker image (local)"
	@echo "  make dev-env-start                       # Start development environment"
	@echo ""
	@echo "💡 For more help use 'make help-build' or 'make help-docker'"
