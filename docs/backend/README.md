# Storage Backend Documentation

## Overview

The storage backend is a high-performance distributed object storage system written in Rust, providing S3-compatible APIs and advanced enterprise features.

## Architecture

### NebulaFX Storage Backend

**NebulaFX** is a comprehensive distributed object storage system built with Rust, offering:

- **S3-Compatible API**: Full S3 API support via `s3s` crate, including bucket/object operations and S3 Select
- **Erasure Coded Storage**: `ecstore` provides endpoint pools, erasure coding layouts, background replication and healing
- **Identity & Access Management**: `iam` and `policy` crates for users, credentials, and fine-grained access control
- **Audit & Notification**: `audit` and `notify` systems with event distribution, rule configuration, and multi-target alerts
- **Observability**: `obs` integration with tracing, metrics, and OTLP exporters
- **Key Management Service**: `kms` with local and Vault backends for key management and encryption/decryption
- **High Performance**: Built on Tokio, tower/axum, jemalloc/mimalloc with multi-architecture support

## Project Structure

```
storage-backend/
├── Cargo.toml              # Workspace configuration
├── Makefile                # Build, test, Docker commands
├── Dockerfile.prod         # Production Docker image
├── Dockerfile.dev          # Development Docker image
├── docker-compose.yml      # Docker Compose configuration
├── entrypoint.sh           # Container entrypoint
├── config.toml             # Production configuration
├── config.dev.toml         # Development configuration
├── nebulafx/               # Core binary crate (service entry)
│   ├── src/
│   │   ├── main.rs         # Server entry (S3 + Console API endpoints)
│   │   ├── server/         # HTTP/server assembly, lifecycle, graceful shutdown
│   │   ├── storage/        # Storage glue logic (ECStore integration)
│   │   ├── config/         # CLI/config parsing (clap-based)
│   │   └── admin/, auth/   # Admin, auth, version, profiling
│   └── Cargo.toml
└── crates/                 # Business and infrastructure modules
    ├── ecstore/            # Erasure coding storage
    ├── iam/                # Identity and Access Management
    ├── policy/             # Policy engine and authorization
    ├── audit/              # Audit system with multi-target distribution
    ├── notify/             # Event and target rules (queue/topic/Lambda)
    ├── kms/                # Key Management Service
    ├── obs/                # Observability (tracing/metrics/otlp)
    ├── s3select-api/       # S3 Select API
    ├── s3select-query/     # S3 Select query engine
    └── ...                 # Other modules
```

## Quick Start

### Prerequisites

- Rust ≥ 1.85 (see `rust-version` in Cargo.toml)
- Docker (optional, for containerized deployment)

### Using Makefile

```bash
cd storage-backend

# Code quality
make fmt           # Format code
make clippy        # Static analysis
make test          # Unit tests + doc tests

# Local build/run
make build         # Release build (nebulafx binary)
make build-dev     # Debug build
make run           # Run with dev preset (port: 9000)

# Docker build (single/multi-arch)
make docker-build-production
make docker-buildx
make docker-dev-local
```

### Minimal Run Example

```bash
cargo run --bin nebulafx -- ./deploy/data/dev{1...8} --address 0.0.0.0:9000
# Or
make run
```

## Configuration

### CLI Arguments

Common CLI arguments (see `nebulafx/src/config`):

- `--address`: Server address (default: `0.0.0.0:9000`)
- `--volumes`: Storage volumes (e.g., `./data{1..8}`)
- `--region`: AWS region (default: `us-east-1`)
- `--access-key`: Access key ID
- `--secret-key`: Secret access key
- KMS-related options

### Environment Variables

Key environment variables (see `docs/ENVIRONMENT_VARIABLES.md`):

**Logging:**
- `RUST_LOG`: Rust log level (default: `info`)
- `NEUBULAFX_OBS_LOGGER_LEVEL`: Observability logger level
- `NEUBULAFX_LOG_JSON`: Enable JSON logging

**Background Services:**
- `NEUBULAFX_ENABLE_SCANNER`: Enable background scanner
- `NEUBULAFX_ENABLE_HEAL`: Enable healing service

**Update Check:**
- `ENV_UPDATE_CHECK`: Enable update check (default: enabled)

### Configuration Files

- `config.toml`: Production configuration
- `config.dev.toml`: Development configuration

## Key Features

### 1. S3 Compatibility

Full S3 API support including:
- Bucket operations (create, delete, list)
- Object operations (put, get, delete, copy)
- Multipart uploads
- S3 Select queries

### 2. Erasure Coding

- Endpoint pools for distributed storage
- Configurable erasure coding layouts
- Background replication and healing
- Data durability and availability

### 3. Identity & Access Management

- User management
- Access key/secret key authentication
- STS (Security Token Service) support
- Fine-grained policy-based access control

### 4. Audit & Notification

- Event auditing with multi-target distribution
- Configurable notification rules
- Support for queues, topics, and Lambda functions

### 5. Key Management Service

**Backends:**
- `local`: Local key directory
- `vault`: HashiCorp Vault integration

**Configuration:** Via CLI options and environment variables

### 6. Observability

- **Tracing**: Distributed tracing with OpenTelemetry
- **Metrics**: Prometheus-compatible metrics
- **Logging**: Structured logging with JSON support
- **OTLP Export**: Export to OpenTelemetry collectors

## Deployment

### Docker Deployment

**Production:**
```bash
docker-compose up -d storage-backend
```

**Development:**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Manual Deployment

1. Build the binary:
   ```bash
   make build
   ```

2. Run the service:
   ```bash
   ./target/release/nebulafx --volumes ./data{1..8} --address 0.0.0.0:9000
   ```

## API Endpoints

- **S3 API**: `http://localhost:9000`
- **Health Check**: `http://localhost:9000/health`
- **Console API**: `http://localhost:9000/nebulafx/console/*`
- **Admin API**: `http://localhost:9000/admin/*`

## Development

### Building from Source

```bash
# Install Rust (if not installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Clone and build
cd storage-backend
cargo build --release
```

### Running Tests

```bash
# All tests
make test

# Specific test suite
cargo test --package ecstore
```

### Code Quality

```bash
# Format code
make fmt

# Lint
make clippy

# Type check
cargo check
```

## Performance Tuning

- **Allocator**: Linux uses `jemalloc`, musl targets use `mimalloc`
- **Runtime**: Tokio async runtime with configurable worker threads
- **Multi-architecture**: Supports amd64 and arm64 builds

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Change port: `--address 0.0.0.0:9001`

2. **Volume Permissions**
   - Ensure data directories are writable
   - Check user permissions

3. **Build Failures**
   - Ensure Rust version ≥ 1.85
   - Run `cargo clean` and rebuild

### Logs

View logs:
```bash
# Docker
docker-compose logs -f storage-backend

# Manual
RUST_LOG=debug ./target/release/nebulafx ...
```

## Related Documentation

- [Environment Variables](storage-backend/docs/ENVIRONMENT_VARIABLES.md)
- [Performance Testing](storage-backend/docs/PERFORMANCE_TESTING.md)
- [KMS Configuration](storage-backend/docs/kms/)
- [Examples](storage-backend/docs/examples/)

## License

Apache-2.0 License
