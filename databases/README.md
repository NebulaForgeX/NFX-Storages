# nfxstorages 数据库（PostgreSQL）

结构与 **CityPulso PulsoLoop-API** / **NFX-Identity** 的 `databases/` 对齐：Atlas 或 license-free（psqldef/goose）管理 schema 与迁移，模板生成 Go 模型等。

HTTP 入口只有 **NFX-Edge**；本仓不跑 Traefik。

## Schema 概览

| Schema     | 说明 |
| ---------- | ---- |
| `storages` | IAM + 对象元数据：访问密钥、策略、组、事件目标、分层、KMS、远程目标 |
| `system`   | 系统状态（与其它 NFX 产品同构） |

### `storages` 表

| 表名 | 说明 |
| ---- | ---- |
| `access_keys` | AK/SK、会话、账号/资料归属 |
| `policies` | IAM 策略文档 |
| `groups` | IAM 组与成员 |
| `event_targets` | 桶事件通知目标 |
| `tiers` | 远程分层 |
| `kms_keys` / `kms_state` | KMS |
| `remote_targets` | 复制/远程目标 |

对象字节不在 PostgreSQL：写在 NAS 卷 `STORAGES_VOLUME_*`。

## 目录结构

```
databases/
├── atlas.hcl
├── README.md
├── src/
│   ├── main.sql
│   ├── extensions/
│   └── schemas/
│       ├── storages/
│       └── system/
├── migrations/
└── scripts/          # gen_*.sh / db_*.sh / *.ps1
```

改 schema 请改 `databases/src/**` 源 SQL，再跑：

```bash
task db:create
task atlas:pipeline:run        # 或 task databases:pipeline:run
task atlas:gen
```

勿手改 `*_dbgen.go`。
