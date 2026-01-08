<div align="center" id="nfx-storages">

<a href="https://github.com/NebulaForgeX/NFX-Storages" title="NFX-Storages">
  <img src="logo_red.png" alt="NFX-Storages Logo" width="120" height="120">
</a>

<h1>NFX-Storages</h1>

🚀 **综合分布式存储解决方案** — 多存储引擎，统一管理

[English Documentation](README.md) | [文档](docs/)

</div>

---

## 📋 概述

**NFX-Storages** 是一个综合分布式存储解决方案，将多个存储引擎和管理界面整合到统一平台。它提供 S3 兼容的对象存储，并具备企业级功能，包括 IAM、策略管理、审计日志、KMS 和可观测性。

### 核心亮点

- **多引擎支持**: 集成 RustFS 和 NebulaFX 存储后端
- **S3 兼容 API**: 完整的 S3 API 支持，无缝集成
- **企业级功能**: IAM、策略、审计、KMS 和可观测性
- **Web 管理控制台**: 基于 React 的现代化 UI 进行存储管理
- **云原生**: 专为现代云和边缘部署设计
- **高性能**: 使用 Rust 构建，性能优异

## 🏗️ 架构

```
NFX-Storages/
├── storage-backend/          # NebulaFX 存储后端 (Rust)
│   ├── nebulafx/             # 核心服务二进制
│   ├── crates/               # 业务模块 (ecstore, iam, policy 等)
│   └── docs/                 # 后端文档
├── storage-console/           # 存储管理控制台 (React/Vite)
│   ├── src/                  # React 应用源码
│   └── public/               # 静态资源
├── docs/                     # 项目文档
│   ├── backend/              # 后端文档
│   └── frontend/             # 前端文档
├── docker-compose.yml        # 统一 Docker Compose 配置
├── docker-compose.dev.yml    # 开发配置
└── README.md                 # 本文件
```

## 🚀 快速开始

### 前置要求

- **Docker** 和 **Docker Compose** (推荐)
- **Git** 用于克隆仓库
- **Rust 1.85+** (用于从源码构建)
- **Node.js 18+** (用于前端开发)

### 启动所有服务

```bash
# 克隆仓库
git clone https://github.com/NebulaForgeX/NFX-Storages.git
cd NFX-Storages

# 复制环境文件（如需要）
cp .env.example .env

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 服务端口

| 服务 | 端口 | 描述 | URL |
|------|------|------|-----|
| RustFS | 9000 | S3 API 端点 | http://localhost:9000 |
| RustFS Console | 3000 | RustFS Web UI | http://localhost:3000 |
| Storage Backend | 9001 | NebulaFX S3 API | http://localhost:9001 |
| Storage Console | 3001 | 存储管理 UI | http://localhost:3001 |
| OTel Collector | 4317/4318 | OTLP 端点 | (可观测性配置) |

## 📚 文档

- **[后端文档](docs/backend/README.md)** - 存储后端服务完整文档
- **[前端文档](docs/frontend/README.md)** - Web 控制台开发和部署指南
- **[存储后端 README](storage-backend/README.md)** - NebulaFX 存储后端详情

## 🔧 配置

### 环境变量

在根目录创建 `.env` 文件：

```bash
# 存储后端配置
STORAGE_BACKEND_PORT=9001
NEUBULAFX_VOLUMES=/deploy/data/pro/nebulafx{1...8}
NEUBULAFX_ACCESS_KEY=your_access_key
NEUBULAFX_SECRET_KEY=your_secret_key
NEUBULAFX_EXTERNAL_ADDRESS=:9001
NEUBULAFX_CORS_ALLOWED_ORIGINS=*
NEUBULAFX_LOG_LEVEL=info

# 存储控制台配置
STORAGE_CONSOLE_PORT=3001
VITE_API_URL=http://storage-backend:9000

# RustFS 配置（如果使用 RustFS）
RUSTFS_ACCESS_KEY=rustfsadmin
RUSTFS_SECRET_KEY=rustfsadmin
```

### 配置文件

- `config.toml` - 生产配置模板
- `config.dev.toml` - 开发配置模板
- `docker-compose.yml` - 生产 Docker Compose 设置
- `docker-compose.dev.yml` - 开发 Docker Compose 设置

## 🐳 Docker 服务

`docker-compose.yml` 编排以下服务：

### 核心服务

- **rustfs**: RustFS 存储引擎，提供 S3 兼容 API
- **rustfsconsole**: RustFS Web 管理控制台 (Nuxt.js)
- **storage-backend**: NebulaFX 存储后端，具备企业级功能
- **storage-console**: 存储管理控制台 (React/Vite)

### 可选服务

- **otel-collector**: OpenTelemetry 收集器，用于可观测性（需要 `observability` 配置）

### 启动可观测性

```bash
# 启动所有服务及可观测性栈
docker-compose --profile observability up -d

# 访问指标
curl http://localhost:8888/metrics
```

## 📦 项目结构

### 存储引擎

#### RustFS
- **位置**: `rustfs/` (如果包含)
- **描述**: 高性能分布式对象存储，S3 兼容
- **特性**: 简单、快速、可靠的对象存储

#### NebulaFX (存储后端)
- **位置**: `storage-backend/`
- **描述**: 具备企业级功能的先进存储后端
- **核心特性**:
  - 纠删码存储 (`ecstore`)
  - 身份与访问管理 (`iam`)
  - 策略引擎 (`policy`)
  - 审计系统 (`audit`)
  - 通知系统 (`notify`)
  - 密钥管理服务 (`kms`)
  - 可观测性 (`obs`)
  - S3 Select 支持

### Web 控制台

#### RustFS Console
- **位置**: `rustfsconsole/` (如果包含)
- **技术**: Nuxt.js
- **用途**: RustFS 管理的 Web UI

#### Storage Console
- **位置**: `storage-console/`
- **技术**: React 19 + TypeScript + Vite
- **用途**: 综合存储管理界面
- **功能**:
  - 存储桶管理
  - 对象浏览器
  - 用户和访问密钥管理
  - 策略配置
  - 系统监控
  - 设置和配置

## 🔑 核心功能

### 存储后端 (NebulaFX)

- **S3 兼容性**: 通过 `s3s` crate 提供完整 S3 API 支持
- **纠删码**: 用于持久性的分布式纠删码存储
- **IAM 和策略**: 细粒度访问控制
- **审计和通知**: 事件审计和多目标通知
- **KMS**: 支持本地和 Vault 后端的密钥管理
- **可观测性**: 追踪、指标和 OTLP 导出
- **高性能**: 基于 Tokio、tower/axum，使用 jemalloc/mimalloc

### 存储控制台

- **现代化 UI**: React 19 配合 TypeScript
- **响应式设计**: 在桌面和移动设备上完美运行
- **国际化**: 多语言支持
- **实时更新**: 实时数据同步
- **深色模式**: 主题支持
- **全面管理**: 完整的存储生命周期管理

## 🛠️ 开发

### 后端开发

```bash
cd storage-backend

# 格式化代码
make fmt

# 运行 linter
make clippy

# 运行测试
make test

# 构建发布版本
make build

# 本地运行
make run
```

### 前端开发

```bash
cd storage-console

# 安装依赖
npm install
# 或
pnpm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行 linter
npm run lint
```

## 📊 监控与可观测性

### 指标

- Prometheus 兼容的指标端点
- 自定义存储指标（吞吐量、延迟、错误）
- 系统指标（CPU、内存、磁盘）

### 追踪

- 使用 OpenTelemetry 的分布式追踪
- 跨服务请求追踪
- 性能分析

### 日志

- 结构化 JSON 日志
- 可配置的日志级别
- 集中式日志收集

## 🔒 安全

- **访问控制**: 基于 IAM 和策略的访问控制
- **加密**: KMS 支持数据加密
- **审计日志**: 全面的审计跟踪
- **TLS/SSL**: 支持加密连接
- **CORS**: 可配置的 CORS 策略

## 🚀 部署

### 生产部署

```bash
# 构建并启动生产服务
docker-compose -f docker-compose.yml up -d

# 检查服务健康状态
docker-compose ps
docker-compose logs -f storage-backend
```

### 开发部署

```bash
# 启动开发环境
docker-compose -f docker-compose.dev.yml up -d
```

### 手动部署

请参阅各组件文档：
- [后端部署](docs/backend/README.md#deployment)
- [前端部署](docs/frontend/README.md#deployment)

## 🧪 测试

### 后端测试

```bash
cd storage-backend
make test
```

### 前端测试

```bash
cd storage-console
npm test
```

## 📖 API 文档

### S3 API

- **端点**: `http://localhost:9001` (存储后端)
- **兼容性**: 完整 S3 API 支持
- **操作**: 存储桶和对象操作、分段上传、S3 Select

### 控制台 API

- **端点**: `http://localhost:9001/nebulafx/console/*`
- **用途**: 管理和行政操作

### 健康检查

- **端点**: `http://localhost:9001/health`
- **用途**: 服务健康监控

## 🔗 相关项目

- [RustFS](https://github.com/rustfs/rustfs) - 分布式对象存储
- [NebulaFX](https://github.com/nebulafx/nebulafx) - 先进存储后端

## 🤝 贡献

欢迎贡献！请参阅我们的贡献指南和行为准则。

## 📄 许可证

请参阅各目录中的项目许可证。

---

<div align="center">

**[🔝 返回顶部](#nfx-storages)**

由 [NebulaForgeX](https://github.com/NebulaForgeX) 用 ❤️ 制作

</div>
