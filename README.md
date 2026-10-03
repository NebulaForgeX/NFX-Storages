# NFX-Storages

[English](README.en.md)

<div align="center">
  <img src="logo_red.png" alt="NFX-Storages" width="200">
</div>

Go S3。对象字节在 NAS 路径 `STORAGES_VOLUME_0` … `_3`，四块盘必须存在且可写。这 **不是** Identity 用的 Stack MinIO。元数据和 IAM 在 Postgres schema `storages`。消息走 Kafka，topic 是 `nfxstorages.s3`、`admin`、`object`、`iam`、`notify`，以及对应的 `*_poison`。运行时没有 RustFS。

没有本地密码表。Console 用 nfx-ui 调 [NFX-Identity](https://github.com/NebulaForgeX/NFX-Identity) 登录，选 profile 之后 `POST /admin/v3/session/credentials`（Bearer Identity JWT）。这条路径跳过 Storages 自己的 IAM authorize，专门换票。Storages 验 JWT，gRPC 问 Identity `EnsureOwnedProfile`，把临时 AK/SK 写入 `storages.access_keys`。浏览器和 AWS SDK 再用 SigV4 打 S3 Host。

## 流量怎么进来

本仓 `.env` **没有** `API_GATEWAY_PREFIX`、`API_PREFIX_PATH_*`、`TRAEFIK_S3_HOST`、`GRPC_PORT_AUTH`。

- 对象面：Edge 里写死 `Host(s3.nebulaforgex.com)`，不 strip，secure 后端 **10091**。`.example.env` 里的 `VITE_S3_ENDPOINT` 现在仍指向 Stack MinIO `10012`，那是占位，不要把对象写进那台 MinIO
- 管理面：Edge PathPrefix `/nfx-storages/admin|object|iam|notify`（dev 加 `/dev`）。admin 代码写死 `Group("/admin/v3")`。object、iam、notify 的 `RegisterRoutes()` 目前是空的，浏览器走 admin
- 拨 Identity：`GRPC_HOST_AUTH` 填 NAS IP，dev **10031**，secure **10036**
- Console：PathPrefix `/console/nfx-storages`。局域网 302 到 **10101**

S3 HTTP：`GET /health`，其余 `ALL /` 和 `ALL /*` 进 `S3.Handle`。Admin 除 `POST /session/credentials` 外都走 Storages IAM authorize。用户、组、策略、服务账号、集群信息、事件目标、分层、KMS、IAM 导入导出、池、远程目标都在 `/admin/v3` 下。KMS key 不是 REST `DELETE /kms/keys/:id`，实际是 `GET/POST /kms/keys`、`GET /kms/keys/:id`、`DELETE /kms/keys/delete`、`POST /kms/keys/cancel-deletion`。

## 端口

容器 HTTP `8080`。Vite `5176`。console 是 `CONSOLE_EXTERNAL_PORT`，不是 gRPC。

| 模块 | 容器 gRPC | dev HTTP / gRPC | secure HTTP / gRPC |
|------|-----------|-----------------|--------------------|
| s3 | 50072 | **10080 / 10081** | **10091 / 10092** |
| admin | 50075 | **10082 / 10083** | **10093 / 10094** |
| object | 50073 | **10084 / 10085** | **10095 / 10096** |
| iam | 50074 | **10086 / 10087** | **10097 / 10098** |
| notify | 50076 | **10088 / 10089** | **10099 / 10100** |
| console | — | **10090** | **10101** |

## Console 和库

访客登录同 Identity hooks。资料页仍是 `/user/profile/*`，内容列上方有 `UserTopBar`。业务页：`/config`、`/browser`、`/browser/:bucket`、`/buckets/:key`、`/access-keys`、`/policies`、`/users`、`/user-groups`、`/import-export`、`/performance`、`/pools`、`/events`、`/replication`、`/lifecycle`、`/tiers`、`/events-target`、`/sse`、`/license`。页面走 hooks，不要在 page 里 `useQuery` 加 repository。`nfx-ui` 钉 **0.36.0**。

表：`access_keys`、`policies`、`groups`、`tiers`、`event_targets`、`remote_targets`、`kms_keys`、`kms_state`。Postgres **10004**，Redis **10006**，Kafka `NAS_IP:10008`。

```bash
cp .example.env .env
task proto:gen
task atlas:pipeline:run
task console
sudo docker compose -f docker-compose.dev.yml up -d
```

没有 `task db:create`。建库在 `task atlas:pipeline:run` 里。要单独建库用 `bash scripts/create_databases.sh`，先 export Postgres 变量。默认 `docker-compose.yml` 是 **secure**；上面这条 `-f docker-compose.dev.yml` 才是 dev。也可以 `task run`。

详细信息见 [NFX-Documentation 第九章](https://github.com/NebulaForgeX/NFX-Documentation/blob/main/books/zh/chapter-09-nfx-storages-deployment.md)。
