# NFX-Storages

[中文](README.md)

<div align="center">
  <img src="logo_red.png" alt="NFX-Storages" width="200">
</div>

Go S3. Object bytes live on NAS paths `STORAGES_VOLUME_0` … `_3`. All four directories must exist and be writable. This is **not** the Stack MinIO that Identity uses. Metadata and IAM sit in Postgres schema `storages`. Messages go through Kafka on `nfxstorages.s3`, `admin`, `object`, `iam`, and `notify`, plus the matching `*_poison` topics. There is no RustFS at runtime.

There is no local password table. The console logs in through nfx-ui against [NFX-Identity](https://github.com/NebulaForgeX/NFX-Identity). After a profile is selected, `POST /admin/v3/session/credentials` (Identity Bearer JWT) mints keys. That path skips Storages IAM authorize on purpose. Storages verifies the JWT, asks Identity `EnsureOwnedProfile` over gRPC, and writes the temporary AK/SK into `storages.access_keys`. Browsers and the AWS SDK then speak SigV4 to the S3 Host.

## How traffic arrives

This `.env` has **no** `API_GATEWAY_PREFIX`, `API_PREFIX_PATH_*`, `TRAEFIK_S3_HOST`, or `GRPC_PORT_AUTH`.

- Object plane: Edge hardcodes `Host(s3.nebulaforgex.com)` with no strip. The secure backend is **10091**. `VITE_S3_ENDPOINT` in `.example.env` still points at Stack MinIO `10012`. That value is a placeholder. Do not write objects there
- Admin plane: Edge PathPrefix `/nfx-storages/admin|object|iam|notify` (dev adds `/dev`). Admin code hardcodes `Group("/admin/v3")`. `RegisterRoutes()` on object, iam, and notify is empty, so the browser uses admin
- Dial Identity: `GRPC_HOST_AUTH` is the NAS IP, dev **10031**, secure **10036**
- Console: PathPrefix `/console/nfx-storages`. The LAN 302 lands on **10101**

S3 HTTP: `GET /health`, then `ALL /` and `ALL /*` into `S3.Handle`. Every admin route except `POST /session/credentials` runs Storages IAM authorize. Users, groups, policies, service accounts, cluster info, event targets, tiers, KMS, IAM import/export, pools, and remote targets are all under `/admin/v3`. KMS keys are not REST `DELETE /kms/keys/:id`. The real paths are `GET/POST /kms/keys`, `GET /kms/keys/:id`, `DELETE /kms/keys/delete`, and `POST /kms/keys/cancel-deletion`.

## Ports

Container HTTP is `8080`. Vite is `5176`. The console port is `CONSOLE_EXTERNAL_PORT`, not gRPC.

| Module | In-container gRPC | dev HTTP / gRPC | secure HTTP / gRPC |
|--------|-------------------|-----------------|--------------------|
| s3 | 50072 | **10080 / 10081** | **10091 / 10092** |
| admin | 50075 | **10082 / 10083** | **10093 / 10094** |
| object | 50073 | **10084 / 10085** | **10095 / 10096** |
| iam | 50074 | **10086 / 10087** | **10097 / 10098** |
| notify | 50076 | **10088 / 10089** | **10099 / 10100** |
| console | — | **10090** | **10101** |

## Console and database

Guest login uses the Identity hooks. Profile pages are still `/user/profile/*`, with `UserTopBar` above the content column. Product pages: `/config`, `/browser`, `/browser/:bucket`, `/buckets/:key`, `/access-keys`, `/policies`, `/users`, `/user-groups`, `/import-export`, `/performance`, `/pools`, `/events`, `/replication`, `/lifecycle`, `/tiers`, `/events-target`, `/sse`, `/license`. Pages use hooks. Do not put `useQuery` plus a repository in a page. Pin **nfx-ui 0.36.0**.

Tables: `access_keys`, `policies`, `groups`, `tiers`, `event_targets`, `remote_targets`, `kms_keys`, `kms_state`. Postgres **10004**, Redis **10006**, Kafka `NAS_IP:10008`.

```bash
cp .example.env .env
task proto:gen
task atlas:pipeline:run
task console
sudo docker compose -f docker-compose.dev.yml up -d
```

There is no `task db:create`. `task atlas:pipeline:run` creates the databases. To create them alone, run `bash scripts/create_databases.sh` after exporting the Postgres variables. The default `docker-compose.yml` is **secure**. The `-f docker-compose.dev.yml` line above is dev. `task run` is the other way to start dev.

Full detail: [NFX-Documentation chapter 9](https://github.com/NebulaForgeX/NFX-Documentation/blob/main/books/en/chapter-09-nfx-storages-deployment.md).
