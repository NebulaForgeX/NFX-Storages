<div align="center" id="nfx-storages">

<a href="https://github.com/NebulaForgeX/NFX-Storages" title="NFX-Storages">
  <img src="logo_red.png" alt="NFX-Storages Logo" width="120" height="120">
</a>

<h1>NFX-Storages</h1>

🚀 **Comprehensive Distributed Storage Solution** — Multiple storage engines, unified management

[中文文档 / Chinese](README.cn.md) | [Documentation](docs/)

</div>

---

## 📋 Overview

**NFX-Storages** is a comprehensive distributed storage solution that combines multiple storage engines and management interfaces into a unified platform. It provides S3-compatible object storage with enterprise-grade features including IAM, policy management, audit logging, KMS, and observability.

### Key Highlights

- **Multi-Engine Support**: Integrates RustFS and NebulaFX storage backends
- **S3-Compatible APIs**: Full S3 API support for seamless integration
- **Enterprise Features**: IAM, policies, audit, KMS, and observability
- **Web Management Consoles**: Modern React-based UI for storage management
- **Cloud-Native**: Designed for modern cloud and edge deployments
- **High Performance**: Built with Rust for optimal performance

## 🏗️ Architecture

```
NFX-Storages/
├── storage-backend/          # NebulaFX storage backend (Rust)
│   ├── nebulafx/             # Core service binary
│   ├── crates/               # Business modules (ecstore, iam, policy, etc.)
│   └── docs/                 # Backend documentation
├── storage-console/           # Storage management console (React/Vite)
│   ├── src/                  # React application source
│   └── public/               # Static assets
├── docs/                     # Project documentation
│   ├── backend/              # Backend documentation
│   └── frontend/             # Frontend documentation
├── docker-compose.yml        # Unified Docker Compose configuration
├── docker-compose.dev.yml    # Development configuration
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites

- **Docker** and **Docker Compose** (recommended)
- **Git** for cloning the repository
- **Rust 1.85+** (for building from source)
- **Node.js 18+** (for frontend development)

### Start All Services

```bash
# Clone the repository
git clone https://github.com/NebulaForgeX/NFX-Storages.git
cd NFX-Storages

# Copy environment file (if needed)
cp .env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Service Ports

| Service | Port | Description | URL |
|---------|------|-------------|-----|
| RustFS | 9000 | S3 API endpoint | http://localhost:9000 |
| RustFS Console | 3000 | RustFS web UI | http://localhost:3000 |
| Storage Backend | 9001 | NebulaFX S3 API | http://localhost:9001 |
| Storage Console | 3001 | Storage management UI | http://localhost:3001 |
| OTel Collector | 4317/4318 | OTLP endpoints | (observability profile) |

## 📚 Documentation

- **[Backend Documentation](docs/backend/README.md)** - Comprehensive storage backend services documentation
- **[Frontend Documentation](docs/frontend/README.md)** - Web console development and deployment guide
- **[Storage Backend README](storage-backend/README.md)** - NebulaFX storage backend details

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Storage Backend Configuration
STORAGE_BACKEND_PORT=9001
NEUBULAFX_VOLUMES=/deploy/data/pro/nebulafx{1...8}
NEUBULAFX_ACCESS_KEY=your_access_key
NEUBULAFX_SECRET_KEY=your_secret_key
NEUBULAFX_EXTERNAL_ADDRESS=:9001
NEUBULAFX_CORS_ALLOWED_ORIGINS=*
NEUBULAFX_LOG_LEVEL=info

# Storage Console Configuration
STORAGE_CONSOLE_PORT=3001
VITE_API_URL=http://storage-backend:9000

# RustFS Configuration (if using RustFS)
RUSTFS_ACCESS_KEY=rustfsadmin
RUSTFS_SECRET_KEY=rustfsadmin
```

### Configuration Files

- `config.toml` - Production configuration template
- `config.dev.toml` - Development configuration template
- `docker-compose.yml` - Production Docker Compose setup
- `docker-compose.dev.yml` - Development Docker Compose setup

## 🐳 Docker Services

The `docker-compose.yml` orchestrates the following services:

### Core Services

- **rustfs**: RustFS storage engine with S3-compatible API
- **rustfsconsole**: RustFS web management console (Nuxt.js)
- **storage-backend**: NebulaFX storage backend with enterprise features
- **storage-console**: Storage management console (React/Vite)

### Optional Services

- **otel-collector**: OpenTelemetry collector for observability (requires `observability` profile)

### Start with Observability

```bash
# Start all services with observability stack
docker-compose --profile observability up -d

# Access metrics
curl http://localhost:8888/metrics
```

## 📦 Project Structure

### Storage Engines

#### RustFS
- **Location**: `rustfs/` (if included)
- **Description**: High-performance distributed object storage with S3 compatibility
- **Features**: Simple, fast, and reliable object storage

#### NebulaFX (Storage Backend)
- **Location**: `storage-backend/`
- **Description**: Advanced storage backend with enterprise features
- **Key Features**:
  - Erasure-coded storage (`ecstore`)
  - Identity & Access Management (`iam`)
  - Policy engine (`policy`)
  - Audit system (`audit`)
  - Notification system (`notify`)
  - Key Management Service (`kms`)
  - Observability (`obs`)
  - S3 Select support

### Web Consoles

#### RustFS Console
- **Location**: `rustfsconsole/` (if included)
- **Technology**: Nuxt.js
- **Purpose**: Web UI for RustFS management

#### Storage Console
- **Location**: `storage-console/`
- **Technology**: React 19 + TypeScript + Vite
- **Purpose**: Comprehensive storage management interface
- **Features**:
  - Bucket management
  - Object browser
  - User and access key management
  - Policy configuration
  - System monitoring
  - Settings and configuration

## 🔑 Key Features

### Storage Backend (NebulaFX)

- **S3 Compatibility**: Full S3 API support via `s3s` crate
- **Erasure Coding**: Distributed storage with erasure coding for durability
- **IAM & Policies**: Fine-grained access control
- **Audit & Notification**: Event auditing and multi-target notifications
- **KMS**: Key management with local and Vault backends
- **Observability**: Tracing, metrics, and OTLP export
- **High Performance**: Built on Tokio, tower/axum with jemalloc/mimalloc

### Storage Console

- **Modern UI**: React 19 with TypeScript
- **Responsive Design**: Works on desktop and mobile
- **Internationalization**: Multi-language support
- **Real-time Updates**: Live data synchronization
- **Dark Mode**: Theme support
- **Comprehensive Management**: Full storage lifecycle management

## 🛠️ Development

### Backend Development

```bash
cd storage-backend

# Format code
make fmt

# Run linter
make clippy

# Run tests
make test

# Build release
make build

# Run locally
make run
```

### Frontend Development

```bash
cd storage-console

# Install dependencies
npm install
# or
pnpm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

## 📊 Monitoring & Observability

### Metrics

- Prometheus-compatible metrics endpoint
- Custom storage metrics (throughput, latency, errors)
- System metrics (CPU, memory, disk)

### Tracing

- Distributed tracing with OpenTelemetry
- Request tracing across services
- Performance analysis

### Logging

- Structured JSON logging
- Configurable log levels
- Centralized log collection

## 🔒 Security

- **Access Control**: IAM and policy-based access control
- **Encryption**: KMS support for data encryption
- **Audit Logging**: Comprehensive audit trails
- **TLS/SSL**: Support for encrypted connections
- **CORS**: Configurable CORS policies

## 🚀 Deployment

### Production Deployment

```bash
# Build and start production services
docker-compose -f docker-compose.yml up -d

# Check service health
docker-compose ps
docker-compose logs -f storage-backend
```

### Development Deployment

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d
```

### Manual Deployment

See individual component documentation:
- [Backend Deployment](docs/backend/README.md#deployment)
- [Frontend Deployment](docs/frontend/README.md#deployment)

## 🧪 Testing

### Backend Tests

```bash
cd storage-backend
make test
```

### Frontend Tests

```bash
cd storage-console
npm test
```

## 📖 API Documentation

### S3 API

- **Endpoint**: `http://localhost:9001` (Storage Backend)
- **Compatibility**: Full S3 API support
- **Operations**: Bucket and object operations, multipart uploads, S3 Select

### Console API

- **Endpoint**: `http://localhost:9001/nebulafx/console/*`
- **Purpose**: Management and administrative operations

### Health Check

- **Endpoint**: `http://localhost:9001/health`
- **Purpose**: Service health monitoring

## 🔗 Related Projects

- [RustFS](https://github.com/rustfs/rustfs) - Distributed object storage
- [NebulaFX](https://github.com/nebulafx/nebulafx) - Advanced storage backend

## 🤝 Contributing

Contributions are welcome! Please see our contributing guidelines and code of conduct.

## 📄 License

See individual project licenses in respective directories.

---

<div align="center">

**[🔝 Back to Top](#nfx-storages)**

Made with ❤️ by [NebulaForgeX](https://github.com/NebulaForgeX)

</div>
