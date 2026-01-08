<div align="center" id="nfx-storages">

<a href="https://github.com/NebulaForgeX/NFX-Storages" title="NFX-Storages">
  <img src="logo_red.png" alt="NFX-Storages Logo" width="120" height="120">
</a>

<h1>NFX-Storages</h1>

🚀 **Comprehensive Distributed Storage Solution** — Multiple storage engines, unified management

</div>

---

## 📋 Overview

**NFX-Storages** is a comprehensive distributed storage solution that combines multiple storage engines and management interfaces.

## 📋 Overview

NFX-Storages provides a unified platform for object storage with S3-compatible APIs, featuring:

- **Multiple Storage Engines**: RustFS and NebulaFX storage backends
- **Web Management Consoles**: User-friendly interfaces for storage management
- **High Performance**: Built with Rust for optimal performance
- **Cloud-Native**: Designed for modern cloud and edge deployments
- **Observability**: Integrated monitoring and tracing capabilities

## 🏗️ Architecture

```
NFX-Storages/
├── rustfs/              # RustFS storage engine
├── rustfsconsole/        # RustFS web console (Nuxt.js)
├── storage-backend/      # NebulaFX storage backend (Rust)
├── storage-console/      # Storage management console (React/Vite)
├── docs/                 # Documentation
│   ├── backend/         # Backend documentation
│   └── frontend/        # Frontend documentation
├── docker-compose.yml    # Unified Docker Compose configuration
└── README.md            # This file
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### Start All Services

```bash
# Clone the repository
git clone https://github.com/NebulaForgeX/NFX-Storages.git
cd NFX-Storages

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Service Ports

| Service | Port | Description |
|---------|------|-------------|
| RustFS | 9000 | S3 API endpoint |
| RustFS Console | 3000 | RustFS web UI |
| Storage Backend | 9001 | NebulaFX S3 API |
| Storage Console | 3001 | Storage management UI |

## 📚 Documentation

- **[Backend Documentation](docs/backend/README.md)** - Storage backend services documentation
- **[Frontend Documentation](docs/frontend/README.md)** - Web console documentation

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Storage Backend
STORAGE_BACKEND_PORT=9001
NEUBULAFX_VOLUMES=/deploy/data/pro/nebulafx{1...8}
NEUBULAFX_ACCESS_KEY=your_access_key
NEUBULAFX_SECRET_KEY=your_secret_key

# Storage Console
STORAGE_CONSOLE_PORT=3001
VITE_API_URL=http://storage-backend:9000
```

## 🐳 Docker Services

The `docker-compose.yml` includes:

- **rustfs**: RustFS storage engine
- **rustfsconsole**: RustFS web console
- **storage-backend**: NebulaFX storage backend
- **storage-console**: Storage management console
- **otel-collector**: OpenTelemetry collector (optional, with observability profile)

### Start with Observability

```bash
docker-compose --profile observability up -d
```

## 📦 Project Structure

### Storage Engines

- **rustfs/**: High-performance distributed object storage with S3 compatibility
- **storage-backend/**: Advanced storage backend with IAM, policy, audit, and KMS support

### Web Consoles

- **rustfsconsole/**: Nuxt.js-based console for RustFS management
- **storage-console/**: React-based console for storage management

## 🔗 Related Projects

- [RustFS](https://github.com/rustfs/rustfs) - Distributed object storage
- [NebulaFX](https://github.com/nebulafx/nebulafx) - Advanced storage backend

## 📄 License

See individual project licenses in respective directories.

---

<div align="center">

**[🔝 Back to Top](#nfx-storages)**

Made with ❤️ by NebulaForgeX

</div>
