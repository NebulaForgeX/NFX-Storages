<div align="center" id="nfx-storages">

<a href="https://github.com/NebulaForgeX/NFX-Storages" title="NFX-Storages">
  <img src="logo_red.png" alt="NFX-Storages Logo" width="120" height="120">
</a>

<h1>NFX-Storages</h1>

**Go** 实现的 S3 兼容对象存储：对象在 NAS 卷上，登录走 Identity，控制台为 React。

[English Documentation](README.md)

</div>

---

## 概述

**NFX-Storages** 是 Go 对象存储服务。对象数据写在 NAS 磁盘（`STORAGES_VOLUME_*`）上，**不**使用 Identity MinIO。IAM（用户、策略、组、访问密钥、KMS、分层、事件目标）存 PostgreSQL。消息总线 **仅 Kafka**。没有 RustFS/rustfs 运行时。

### 要点

- **Go S3 API**：桶/对象、分片上传、标签、生命周期、复制、加密、通知、对象锁、STS AssumeRole
- **管理 API**：IAM 用户/策略/组、服务账号、KMS、分层、事件、存储池、IAM 导入导出
- **登录**：nfx-ui 调 Identity HTTP（邮箱/GitHub），再 `POST /nfxstorages/admin/v3/session/credentials` 换 AK/SK
- **存储**：`STORAGES_VOLUME_0` … `STORAGES_VOLUME_3` 上的纠删码分片
- **可观测性**：与 NFX-Identity 相同的 OpenTelemetry（OTLP）

## 目录

```
NFX-Storages/
├── modules/s3/           # S3 HTTP + gRPC
├── modules/admin/        # 控制台管理 HTTP
├── engine/store          # NAS 对象引擎
├── engine/iam            # IAM 与会话密钥
├── console/              # Vite + React（nfx-ui）
├── errors/src            # i18n 错误码（Storages 域，不是 News 拷贝）
├── events/               # Kafka topic keys
├── databases/scripts     # Atlas pipeline (gen_*.sh)
├── Taskfile.yml          # task start / run / errors / atlas
├── docker-compose.dev.yml
└── docker-compose.yml
```

HTTP 入口只有 **NFX-Edge**（先 `cd ../NFX-Edge && ./start.sh`）。本仓不跑 Traefik。

## 任务

```bash
cp .example.env .env
task start                 # 交互菜单
task install
task errors                # i18n 模板 + langs
task proto:gen
task db:create
task atlas:pipeline:run
task run                   # 需要 nfx-edge
task console
```


## 登录

1. 控制台用 **nfx-ui** 调 NFX-Identity HTTP（`LoginWithEmail` / 注册 / GitHub）。
2. 选定 profile 后，控制台用 Identity Bearer 调用 `POST /session/credentials`。
3. Storages 校验 token，经 Identity gRPC 确认 profile 归属，再签发临时 AK/SK（及 session token）。
4. 浏览器与 AWS SDK 用 SigV4 访问 S3。**没有**本地用户名/密码认证表。

## 快速开始

```bash
cp .example.env .env
# 配置 STORAGES_VOLUME_0..3、Identity gRPC、Kafka、OTEL、Postgres、Redis
docker compose up -d
```

控制台经 **NFX-Edge**（`VITE_API_URL`）访问 `/nfxstorages/admin/v3` 与 S3 Host。Identity HTTP 为 `VITE_IDENTITY_API_URL`。

## 技术栈

PostgreSQL、Redis、Kafka、OTEL。仅 Kafka（无 RabbitMQ、无 OpenSearch、无 MySQL、无 Rust 运行时）。
