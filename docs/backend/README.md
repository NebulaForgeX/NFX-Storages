# Storage Backend Documentation

## Overview

The storage backend is a high-performance distributed object storage system written in Rust, providing S3-compatible APIs and advanced enterprise features. Built on the **NebulaFX** framework, it offers production-ready storage capabilities with comprehensive management features.

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
│   │   ├── admin/          # Admin API endpoints
│   │   └── auth/           # Authentication logic
│   └── Cargo.toml
└── crates/                 # Business and infrastructure modules
    ├── ecstore/            # Erasure coding storage engine
    ├── iam/                # Identity and Access Management
    ├── policy/             # Policy engine and authorization
    ├── audit/              # Audit system with multi-target distribution
    ├── notify/             # Event and target rules (queue/topic/Lambda)
    ├── kms/                # Key Management Service
    ├── obs/                # Observability (tracing/metrics/otlp)
    ├── s3select-api/       # S3 Select API implementation
    ├── s3select-query/     # S3 Select query engine
    ├── appauth/            # Application authentication
    ├── signer/             # Request signing
    ├── checksums/          # Checksum validation
    ├── crypto/             # Cryptographic utilities
    ├── lock/               # Distributed locking
    ├── filemeta/           # File metadata management
    ├── utils/              # Utility functions
    ├── common/             # Common types and structures
    ├── config/             # Configuration management
    ├── protos/             # Protocol definitions
    ├── workers/            # Background workers
    └── ...                 # Other supporting modules
```

## Quick Start

### Prerequisites

- **Rust** ≥ 1.85 (see `rust-version` in Cargo.toml)
- **Docker** (optional, for containerized deployment)
- **Make** (optional, for using Makefile commands)

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
# Run with default settings
cargo run --bin nebulafx -- ./deploy/data/dev{1...8} --address 0.0.0.0:9000

# Or using Makefile
make run

# With custom configuration
cargo run --bin nebulafx -- \
  ./deploy/data/pro/nebulafx{1...8} \
  --address 0.0.0.0:9001 \
  --access-key admin \
  --secret-key admin123
```

## Configuration

### CLI Arguments

Common CLI arguments (see `nebulafx/src/config`):

| Argument | Description | Default |
|----------|-------------|---------|
| `--address` | Server address | `0.0.0.0:9000` |
| `--volumes` | Storage volumes (e.g., `./data{1..8}`) | Required |
| `--region` | AWS region | `us-east-1` |
| `--access-key` | Access key ID | - |
| `--secret-key` | Secret access key | - |
| `--kms-backend` | KMS backend type (`local` or `vault`) | - |
| `--kms-endpoint` | KMS endpoint URL | - |
| `--kms-token` | KMS authentication token | - |

### Environment Variables

Key environment variables:

**Logging:**
- `RUST_LOG`: Rust log level (default: `info`)
- `NEUBULAFX_OBS_LOGGER_LEVEL`: Observability logger level
- `NEUBULAFX_LOG_JSON`: Enable JSON logging (default: `false`)

**Background Services:**
- `NEUBULAFX_ENABLE_SCANNER`: Enable background scanner (default: `true`)
- `NEUBULAFX_ENABLE_HEAL`: Enable healing service (default: `true`)

**Observability:**
- `NEUBULAFX_OBS_ENDPOINT`: OpenTelemetry collector endpoint
- `NEUBULAFX_OBS_SERVICE_NAME`: Service name for tracing

**Update Check:**
- `ENV_UPDATE_CHECK`: Enable update check (default: `true`)

**CORS:**
- `NEUBULAFX_CORS_ALLOWED_ORIGINS`: Allowed CORS origins (default: `*`)
- `NEUBULAFX_CONSOLE_CORS_ALLOWED_ORIGINS`: Console CORS origins

### Configuration Files

- `config.toml`: Production configuration template
- `config.dev.toml`: Development configuration template

Configuration files support TOML format with sections for:
- Server settings
- Storage settings
- IAM settings
- KMS settings
- Observability settings

## Key Features

### 1. S3 Compatibility

Full S3 API support including:

- **Bucket Operations**: Create, delete, list, head bucket
- **Object Operations**: Put, get, delete, copy, head object
- **Multipart Uploads**: Initiate, upload parts, complete, abort
- **S3 Select**: Query objects using SQL-like syntax
- **Presigned URLs**: Generate presigned URLs for temporary access
- **Bucket Policies**: Configure bucket-level policies

### 2. Erasure Coding

- **Endpoint Pools**: Distributed storage across multiple endpoints
- **Configurable Layouts**: Flexible erasure coding layouts
- **Background Replication**: Automatic data replication
- **Healing**: Automatic data repair on failure
- **Data Durability**: High data durability guarantees

### 3. Identity & Access Management

- **User Management**: Create, update, delete users
- **Access Keys**: Generate and manage access key/secret key pairs
- **STS Support**: Security Token Service for temporary credentials
- **Policy Engine**: Fine-grained policy-based access control
- **Role-Based Access**: Support for IAM roles

### 4. Audit & Notification

- **Event Auditing**: Comprehensive event logging
- **Multi-Target Distribution**: Send events to multiple targets
- **Configurable Rules**: Define notification rules
- **Target Types**: Support for queues, topics, and Lambda functions
- **Event Filtering**: Filter events based on criteria

### 5. Key Management Service

**Backends:**
- `local`: Local key directory storage
- `vault`: HashiCorp Vault integration

**Features:**
- Key generation and rotation
- Encryption/decryption operations
- Key metadata management
- Support for multiple key types

**Configuration:** Via CLI options and environment variables

### 6. Observability

- **Tracing**: Distributed tracing with OpenTelemetry
- **Metrics**: Prometheus-compatible metrics
- **Logging**: Structured logging with JSON support
- **OTLP Export**: Export to OpenTelemetry collectors
- **Performance Monitoring**: Request latency and throughput metrics

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

1. **Build the binary:**
   ```bash
   make build
   ```

2. **Prepare storage volumes:**
   ```bash
   mkdir -p ./deploy/data/pro/nebulafx{1..8}
   ```

3. **Run the service:**
   ```bash
   ./target/release/nebulafx \
     --volumes ./deploy/data/pro/nebulafx{1..8} \
     --address 0.0.0.0:9000 \
     --access-key admin \
     --secret-key admin123
   ```

### Systemd Service

Create `/etc/systemd/system/nebulafx.service`:

```ini
[Unit]
Description=NebulaFX Storage Backend
After=network.target

[Service]
Type=simple
User=nebulafx
WorkingDirectory=/opt/nebulafx
ExecStart=/opt/nebulafx/nebulafx \
  --volumes /data/nebulafx{1..8} \
  --address 0.0.0.0:9000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## API Endpoints

### S3 API

- **Base URL**: `http://localhost:9000`
- **Compatibility**: Full S3 API compatibility
- **Operations**: All standard S3 operations

### Console API

- **Base URL**: `http://localhost:9000/nebulafx/console/*`
- **Purpose**: Management and administrative operations
- **Authentication**: Access key/secret key or session tokens

### Admin API

- **Base URL**: `http://localhost:9000/admin/*`
- **Purpose**: Administrative operations
- **Authentication**: Admin credentials

### Health Check

- **Endpoint**: `http://localhost:9000/health`
- **Method**: GET
- **Purpose**: Service health monitoring
- **Response**: JSON with service status

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

# Integration tests
cargo test --test integration
```

### Code Quality

```bash
# Format code
make fmt

# Lint
make clippy

# Type check
cargo check

# Security audit
cargo audit
```

### Debugging

```bash
# Run with debug logging
RUST_LOG=debug cargo run --bin nebulafx -- ...

# Run with specific module logging
RUST_LOG=nebulafx::storage=debug cargo run --bin nebulafx -- ...
```

## Performance Tuning

### Allocator Configuration

- **Linux**: Uses `jemalloc` by default
- **musl targets**: Uses `mimalloc`
- **Custom**: Can be configured via Cargo features

### Runtime Configuration

- **Tokio Runtime**: Configurable worker threads
- **Connection Pooling**: Optimized connection management
- **Async I/O**: Non-blocking I/O operations

### Multi-Architecture Support

- **amd64**: x86_64 architecture
- **arm64**: ARM 64-bit architecture
- **Build**: Use `make docker-buildx` for multi-arch images

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Change port
   --address 0.0.0.0:9001
   ```

2. **Volume Permissions**
   ```bash
   # Ensure data directories are writable
   chmod -R 755 ./deploy/data/pro
   chown -R nebulafx:nebulafx ./deploy/data/pro
   ```

3. **Build Failures**
   ```bash
   # Ensure Rust version ≥ 1.85
   rustc --version
   
   # Clean and rebuild
   cargo clean
   cargo build --release
   ```

4. **KMS Connection Issues**
   - Verify KMS endpoint is accessible
   - Check authentication credentials
   - Review KMS backend configuration

### Logs

View logs:

```bash
# Docker
docker-compose logs -f storage-backend

# Manual
RUST_LOG=debug ./target/release/nebulafx ...

# Log file
tail -f ./deploy/logs/nebulafx.log
```

### Health Checks

```bash
# Check service health
curl http://localhost:9000/health

# Check console API
curl http://localhost:9000/nebulafx/console/health
```

## Security Best Practices

1. **Access Keys**: Use strong, unique access keys
2. **TLS/SSL**: Enable TLS for production deployments
3. **KMS**: Use KMS for encryption key management
4. **Policies**: Implement least-privilege policies
5. **Audit**: Enable audit logging for compliance
6. **Network**: Restrict network access appropriately

## Related Documentation

- [Environment Variables](storage-backend/docs/ENVIRONMENT_VARIABLES.md)
- [Performance Testing](storage-backend/docs/PERFORMANCE_TESTING.md)
- [KMS Configuration](storage-backend/docs/kms/)
- [Examples](storage-backend/docs/examples/)
- [API Reference](storage-backend/docs/api/)

## License

Apache-2.0 License
