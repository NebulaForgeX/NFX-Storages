<div align="center" id="nfx-storages">

<a href="https://github.com/NebulaForgeX/NFX-Storages" title="NFX-Storages">
  <img src="logo_red.png" alt="NFX-Storages Logo" width="120" height="120">
</a>

<h1>NFX-Storages</h1>

S3-compatible object storage in **Go**, with NAS-backed volumes, Identity login, and a React console.

[中文文档 / Chinese](README.cn.md) | [Documentation](docs/)

</div>

---

## Overview

**NFX-Storages** is a Go object-storage service. Object bytes live on NAS disks (`STORAGES_VOLUME_*`), not on Identity MinIO. Metadata and IAM (users, policies, groups, access keys, KMS, tiers, event targets) live in PostgreSQL. Messaging is **Kafka-only**. There is no RustFS/rustfs runtime.

### Highlights

- **Go S3 API**: buckets, objects, multipart, tagging, lifecycle, replication, encryption, notifications, object lock, STS AssumeRole
- **Admin API**: IAM users/policies/groups, service accounts, KMS, tiers, events, pools, IAM import/export
- **Login**: nfx-ui Identity HTTP (email/GitHub), then `POST /nfxstorages/admin/v3/session/credentials` for AK/SK
- **Storage**: erasure-coded shards on `STORAGES_VOLUME_0` … `STORAGES_VOLUME_3`
- **Observability**: OpenTelemetry (OTLP) like NFX-Identity

## Layout

```
NFX-Storages/
├── modules/s3/           # S3 HTTP + gRPC
├── modules/admin/        # Admin HTTP (console)
├── modules/object|iam|notify|system
├── engine/store          # NAS object engine
├── engine/iam            # IAM + session keys
├── engine/sigv4          # AWS SigV4
├── console/              # Vite + React console (nfx-ui)
├── databases/src        # PostgreSQL schema
└── docker-compose.yml
```

## Login

1. Console uses **nfx-ui** to call NFX-Identity HTTP (`LoginWithEmail` / signup / GitHub).
2. After a profile is selected, console `POST`s `/session/credentials` with the Identity Bearer token.
3. Storages verifies the token, checks profile ownership via Identity gRPC, and issues temporary AK/SK (+ session token).
4. Browser and AWS SDK calls use SigV4 against the S3 endpoint. There is **no** local username/password schema.

## Quick start

```bash
cp .example.env .env
# set STORAGES_VOLUME_0..3 to NAS paths, Identity gRPC, Kafka, OTEL, Postgres, Redis
docker compose up -d
```

Console talks to Traefik (`VITE_API_URL`) for `/nfxstorages/admin/v3` and S3 `/`. Identity HTTP is `VITE_IDENTITY_API_URL`.

## Ports (example)

See `.example.env`. Host HTTP is Traefik; S3 is path `/`, admin is `/nfxstorages/admin/v3`. Object data is never stored in Identity MinIO.

## Stack

PostgreSQL, Redis, Kafka, OTEL collector. Kafka-only (no RabbitMQ, no OpenSearch, no MySQL, no Rust runtime).
