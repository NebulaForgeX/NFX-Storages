# Storages backend (Go)

NFX-Storages serves S3 and admin HTTP from Go modules. Object bytes are written to NAS paths in `STORAGES_VOLUME_*` with optional Reed-Solomon shards. IAM and KMS metadata are in PostgreSQL schema `storages`.

## Modules

| Module | Role |
|---|---|
| `s3` | S3 + STS AssumeRole (SigV4) |
| `admin` | Console admin API under `/nfxstorages/admin/v3` |
| `object` / `iam` / `notify` / `system` | Supporting HTTP/gRPC |

## Auth

- Console login is Identity HTTP (nfx-ui), not a local password table.
- `POST /nfxstorages/admin/v3/session/credentials` (Bearer) issues temporary AK/SK.
- S3 and most admin calls use AWS SigV4. AssumeRole also issues AK/SK.

## Messaging and telemetry

Kafka only. OTEL is enabled via `[otel]` (OTLP endpoint), with `otelgrpc` on gRPC servers/clients.

## Not in this runtime

RustFS, rustfsconsole, RabbitMQ, MySQL, OpenSearch, Identity MinIO for object data.
