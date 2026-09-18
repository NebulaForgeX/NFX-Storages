# License-free DB pipeline (psqldef/pg_dump + goose + schemagen)

一套**不依赖 Atlas / Atlas Pro** 的并行流水线，直接连现有数据库（RDS），复用与 Atlas 相同的 shadow 库（`POSTGRES_DB_SHADOW` = `pulsoloop_diff`）。**不修改任何 Atlas 文件**——`atlas.hcl`、`run_atlas_pipeline.sh`、`templates/`、`scripts/gen_*.sh`、`atlas:*` task 原样保留。

A parallel pipeline that needs **no Atlas / Atlas Pro seat**. It connects directly to the existing database and reuses the same shadow DB as Atlas. It never edits any Atlas file.

## 组成 / Components

| 步骤 | Atlas（旧） | 本方案（新） | 工具 |
|---|---|---|---|
| 扁平化 schema | `atlas:import` | `schemagen --print-bundle` | Go |
| 代码生成 (enums/models/views) | `atlas schema inspect` + templates（**需 Pro**） | `schemagen` | Go + psql |
| Schema diff | `atlas migrate diff` | `db_migrate_diff.sh` | pg_dump / psqldef |
| 应用迁移 | `atlas migrate apply` | `db_migrate_apply.sh` | goose |
| 版本基线 | — | `db_goose_baseline.sh` | goose |

## 代码生成（核心，已验证逐字节一致）/ Code generation (core, byte-for-byte verified)

```bash
task databases:gen            # 生成 enums+models+views（KIND=enums|models|views|all）
# 或 / or
bash databases/scripts/db_gen.sh all
```

`db_gen.sh` 会：重建 shadow 库 → 用 `schemagen --print-bundle` 载入扁平化 schema → `schemagen` 内省 shadow 并写出 `enums/*_enum_dbgen.go`、`modules/*/infrastructure/rdb/{models,views}/*_dbgen.go` → `goimports`+`gofmt`。产物与 Atlas 旧模板输出**逐字节一致**（内省自 `pg_catalog`，忠实复刻命名/类型/GORM tag/索引/常量等规则）。

schemagen 源码：`databases/cmd/schemagen/`（`bundle/`、`introspect/`、`render/`）。构建产物 `databases/bin/schemagen` 已被 `.gitignore` 忽略。

## Schema diff

```bash
task databases:migrate-diff              # 默认 pgdump 引擎：打印 current->desired 的 schema 差异（供审阅）
task databases:migrate-diff -- --write   # 同时写一个 goose 迁移草稿
task databases:migrate-diff -- --engine psqldef --apply   # psqldef 直接生成/应用可执行 delta
```

- **pgdump 引擎（默认）**：对 shadow(desired) 与 target(current) 做 `pg_dump --schema-only` 后 `diff -u`，能原生处理 CamelCase 带引号标识符、多 schema、PostGIS。**要求本地 `pg_dump` 版本 ≥ 服务器版本**（本仓库 RDS 为 PG18，需 pg_dump 18；见下方“环境要求”）。
- **psqldef 引擎（可选）**：产出可执行 delta，但**当前发布版 psqldef 无法内省本 schema 的带引号大小写敏感标识符**（如 `"Accounts"`），对本仓库不可用；仅适用于全小写标识符的 schema。

## 自动建库 / Auto-create target database

和 Atlas 首次建库一样,`db_migrate_apply.sh` 和 `db_goose_baseline.sh` 在运行前会调用 `db_ensure_database`:**目标库(`POSTGRES_DB`,如 `pulsoloop_dev`)不存在时自动 `CREATE DATABASE`**(通过 `postgres` 维护库)。`run_db_pipeline.sh` 还会判断目标是否已初始化:

- **未初始化(空库/新库)** → 走 `db_goose_baseline.sh`,把完整 schema 作为**可执行**迁移 `goose up` 建起来。
- **已初始化** → 产出“供审阅”的增量 diff,并 `goose up` 应用已写好的迁移。

## 应用迁移 / Apply migrations (goose)

```bash
task databases:baseline                  # 首次：以当前 schema 建立 goose 基线
task databases:migrate-apply             # goose up（应用 databases/migrations/goose/*.sql）
task databases:migrate-apply -- status   # 任意 goose 子命令
```

`goose` 通过 pgx 连接，不受 pg_dump 版本限制。迁移目录：`databases/migrations/goose/`（与 Atlas 的 `migrations/development|secure` 分离）。

## 一键流水线 / One-shot pipeline

```bash
task databases:pipeline:run                     # diff(--write) -> apply -> generate
task databases:pipeline:run -- --skip-migrations # 仅生成代码
```

## 环境要求 / Environment

- Go（构建 schemagen）、`psql`（载入 shadow）。
- `goose`：`go install github.com/pressly/goose/v3/cmd/goose@latest`
- diff（pgdump 引擎）：`pg_dump` 版本需 ≥ 服务器。RDS = PostgreSQL 18，故需 **PostgreSQL 18 客户端**（PGDG apt 源），否则 `db_migrate_diff.sh` 会明确报版本不匹配并退出。
- 连接变量沿用 `.env` 的 `POSTGRESQL_*`，由 Taskfile 映射为 `POSTGRES_*`（与 atlas task 一致）。

## 已知限制 / Known limitations

- `psqldef`（发布版）不支持大小写敏感/多 schema 标识符 → 本仓库 diff 默认走 pgdump 引擎。
- pgdump 引擎的差异是**供审阅**的文本 diff，不是可直接执行的 ALTER；据此手写 goose 迁移，或安装 PG18 客户端后由 pgdump 精确对比。
- 若需要“自动生成可执行增量迁移”，可评估 `migra`（Python，需 `apt install python3-venv`）——能处理本 schema，但引入 Python 依赖。
