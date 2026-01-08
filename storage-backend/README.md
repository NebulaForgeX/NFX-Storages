NebulaFX

简体中文 | English


### 概述 Overview

- 简介: NebulaFX 是一个以 Rust 编写的高性能分布式对象存储系统，提供与 S3 兼容的 API、可观测性、策略与鉴权、审计、KMS 等能力，适合云原生与边缘场景。
- Brief: NebulaFX is a high‑performance distributed object storage written in Rust. It offers S3‑compatible APIs, observability, IAM/policy, audit, KMS, and more for cloud‑native and edge workloads.


### 主要特性 Key Features

- S3 兼容接口: 基于 `s3s`，支持常见对象/桶操作与 S3 Select。
- 弹性纠删码存储: `ecstore` 提供端点池、纠删码布局、后台复制与修复。
- 身份与策略: `iam` 和 `policy` 提供用户、凭证与细粒度访问控制。
- 审计与通知: `audit`、`notify` 支持事件分发、规则配置与多目标告警。
- 可观测性: `obs` 集成 tracing、metrics、OTLP 输出。
- KMS: `kms` 支持本地与 Vault 后端，提供密钥管理与加解密。
- 高性能运行时: 基于 Tokio、tower/axum、jemalloc/mimalloc；多架构构建。

- S3 compatibility: via `s3s`, including bucket/object ops and S3 Select.
- Erasure coded storage: `ecstore` with endpoint pools, layouts, replication and heal.
- IAM and policy: `iam` and `policy` for users, credentials and fine‑grained control.
- Audit and notification: `audit`, `notify` with rules and multi‑target fan‑out.
- Observability: `obs` with tracing, metrics, OTLP exporters.
- KMS: `kms` with local/Vault backends for key management and crypto.
- High performance runtime: Tokio, tower/axum, jemalloc/mimalloc; multi‑arch builds.


### 目录结构 Project Structure

```
.
├─ Cargo.toml                # Workspace 配置（版本/依赖/特性/构建配置）
├─ Makefile                  # 构建、测试、Docker、多架构镜像等命令
├─ docker-compose.yml        # 可选编排（开发/演示）
├─ Dockerfile*               # 生产/源码构建镜像
├─ entrypoint.sh             # 容器入口
├─ docs/                     # 文档与示例（环境变量、性能测试、KMS 等）
├─ scripts/                  # 启动/测试/探针/基准等脚本
├─ nebulafx/                   # 核心二进制 crate（服务入口）
│  ├─ src/
│  │  ├─ main.rs             # 服务器入口（S3 + Console API 端点）
│  │  ├─ server/             # HTTP/server 组装、生命周期与优雅关闭
│  │  ├─ storage/            # 存储相关 glue 逻辑（ECStore 集成等）
│  │  ├─ config/             # CLI/配置解析（基于 clap）
│  │  ├─ admin/, auth/, ...  # 管理、鉴权、版本、性能剖析等
│  └─ Cargo.toml
└─ crates/                   # 业务与基础能力子模块
   ├─ ecstore/               # 纠删码存储与端点池、后台复制/修复
   ├─ iam/                   # 身份与认证（AK/SK、STS 等）
   ├─ policy/                # 策略引擎与授权决策
   ├─ audit/                 # 审计系统与多目标分发
   ├─ notify/                # 事件与目标规则（队列/主题/Lambda）
   ├─ kms/                   # 密钥管理服务（local/vault）
   ├─ appauth/, signer/      # 应用鉴权、客户端签名
   ├─ s3select-api/, s3select-query/  # S3 Select 能力
   ├─ obs/                   # 可观测性（tracing/metrics/otlp）
   ├─ rio/, utils/, common/  # I/O、工具函数、通用结构
   ├─ workers/, lock/        # 任务与并发、分布式锁
   ├─ protos/                # 协议与代码生成
   └─ ...                    # 其余能力（ahm、targets、zip、checksums 等）
```


### 快速开始 Quick Start

- 依赖 Dependencies: Rust ≥ workspace `rust-version` (e.g. 1.85), Docker (可选)。
- 建议使用 Makefile：

```bash
# 代码质量
make fmt           # 格式化
make clippy        # 静态检查
make test          # 单测+文档测试

# 本地构建/运行
make build         # Release 构建二进制（nebulafx）
make build-dev     # Debug 构建
make run           # 以开发预设运行（端口: 9000）

# Docker 构建（单/多架构）
make docker-build-production
make docker-buildx
make docker-dev-local
```

最小运行示例 Minimal run:

```bash
cargo run --bin nebulafx -- ./deploy/data/dev{1...8} --address 0.0.0.0:9000
# 或 Or
make run
```


### 配置与环境 Configuration & Env

- CLI/配置: 见 `nebulafx/src/config`，常用参数包括 `--address`、`--volumes`、`--region`、`--access-key`、`--secret-key`、KMS 相关选项等。
- 环境变量: 参考 `docs/ENVIRONMENT_VARIABLES.md`，可控制日志、可观测性、更新检查、后台服务启停等：
  - `RUST_LOG`、`NEUBULAFX_OBS_LOGGER_LEVEL`、`NEUBULAFX_LOG_JSON`
  - `NEUBULAFX_ENABLE_SCANNER`、`NEUBULAFX_ENABLE_HEAL`
  - `ENV_UPDATE_CHECK`（默认启用）

- CLI/config: See `nebulafx/src/config`. Common flags: `--address`, `--volumes`, `--region`, `--access-key`, `--secret-key`, and KMS options.
- Environment variables: See `docs/ENVIRONMENT_VARIABLES.md`. Control logging/observability, update checks, background services:
  - `RUST_LOG`, `NEUBULAFX_OBS_LOGGER_LEVEL`, `NEUBULAFX_LOG_JSON`
  - `NEUBULAFX_ENABLE_SCANNER`, `NEUBULAFX_ENABLE_HEAL`
  - `ENV_UPDATE_CHECK` (enabled by default)


### KMS

- 后端 Backends: `local`（本地密钥目录）与 `vault`（HashiCorp Vault）。
- 启用方式 How to enable: 通过 CLI 选项与环境变量配置，服务启动时自动初始化；亦支持运行时动态配置。


### 可观测性 Observability

- Tracing/metrics: 集成 `tracing`、`metrics`、`opentelemetry-otlp`，支持日志、指标、链路上报。
- 配置: 通过 CLI/环境变量设置导出端点与级别。


### 与前端关系 Frontend

- 管理控制台前端独立运行（不再内嵌静态资源），具体见独立仓库或文档说明。
- The admin console frontend runs independently (no embedded static files).


### Docker 与多架构 Docker & Multi-arch

- 单架构构建: `make docker-build-production` / `make docker-build-source`。
- 多架构构建: `make docker-buildx`（可推送 `docker-buildx-push[-version]`）。
- 开发镜像: `make docker-dev-local`（当前平台加载），或 `make docker-dev`（多架构构建不加载）。


### 开发建议 Development Tips

- 使用 `make help`, `make help-build`, `make help-docker` 获取命令指引。
- 使用 `cargo-nextest`（可选）加速测试。
- Linux 下默认启用 `jemalloc`，musl 目标启用 `mimalloc`。


### 兼容性与注意事项 Compatibility & Notes

- S3 兼容由 `s3s` 提供，部分高级特性依赖后端实现（如 S3 Select）。
- 纠删码部署请确保端点池与卷布局正确，避免单点风险。
- 在生产环境建议开启审计、通知、KMS 与可观测组件。


### 许可证 License

- Apache-2.0（见仓库 LICENSE 或文件头声明）。
- Apache-2.0 (see LICENSE headers and project metadata).


### 贡献 Contributing

- 欢迎通过 Issue/PR 贡献代码、文档与用例。
- Welcome contributions via Issues and PRs. Bug reports and feature requests are appreciated.


### 参考文档 Further Reading

- `docs/ENVIRONMENT_VARIABLES.md`
- `docs/PERFORMANCE_TESTING.md`
- `docs/kms/` 与 `docs/examples/`
- crates 内各子模块 `README`（如有）与源码注释

