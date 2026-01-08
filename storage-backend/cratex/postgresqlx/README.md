# PostgreSQLX - PostgreSQL Connection Pool Management

PostgreSQLX 是 NebulaFX 的 PostgreSQL 数据库连接池管理模块，负责创建、配置和管理 PostgreSQL 连接池，为其他模块（如 IAMX）提供数据库连接服务。

## 📋 功能概述

PostgreSQLX 负责 NebulaFX 系统的所有 PostgreSQL 数据库连接管理：

### 🔌 核心服务功能

- **连接池管理**
  - PostgreSQL 连接池的创建和配置
  - 连接池参数配置（最大连接数、最小连接数、超时时间等）
  - 全局连接池单例管理

- **配置管理**
  - 从 TOML 配置文件加载数据库配置
  - 连接字符串构建
  - 连接参数验证

- **Schema 管理**
  - 自动创建数据库 Schema
  - 设置 search_path

- **迁移支持**
  - 数据库迁移执行
  - 批量迁移执行

- **健康检查**
  - 连接池健康状态检查
  - 连接可用性验证

## 💾 架构设计

### 与 IAMX 的关系

PostgreSQLX 是数据库连接层，IAMX 是业务逻辑层：

```
应用启动
  ↓
PostgreSQLX::init() - 创建连接池
  ↓
IAMX::init_iam_sys(pool) - 使用连接池
  ↓
IAMX 通过连接池操作数据库
```

**重要**：IAMX 不直接连接数据库，而是使用 PostgreSQLX 提供的连接池（`PgPool`）来操作数据库。

## 🚀 快速开始

### 初始化连接池

```rust
use nebulafx_postgresqlx::{PostgreSQLConfig, PostgreSQLPool};

// 从配置创建连接池
let config = PostgreSQLConfig {
    host: Some("localhost".to_string()),
    port: Some(5432),
    user: Some("postgres".to_string()),
    password: Some("password".to_string()),
    database: Some("nebulafx".to_string()),
    // ...
};

// 初始化全局连接池
PostgreSQLPool::init(Some(&config)).await?;

// 获取连接池实例
let pool = PostgreSQLPool::get()?;

// 获取底层 PgPool 供其他模块使用
let pg_pool = pool.inner();
```

### 配置示例

```toml
[database]
host = "localhost"
port = 5432
user = "postgres"
password = "password"
database = "nebulafx"
schema = "public"

[database.connection]
max_open_connections = 100
max_idle_connections = 10
timeout = "5s"
conn_max_lifetime = "1h"
conn_max_idle_time = "15m"
```

## 📦 主要 API

### PostgreSQLPool

- `init(config)` - 初始化全局连接池
- `get()` - 获取连接池实例
- `inner()` - 获取底层 `PgPool`
- `health_check()` - 健康检查

### PostgreSQLConfig

- `build_connection_url()` - 构建连接字符串
- `create_pool()` - 创建连接池

### 迁移功能

- `execute_migration()` - 执行单个迁移
- `execute_migrations()` - 执行批量迁移

## 📝 使用示例

### 基本使用

```rust
// 初始化
PostgreSQLPool::init(Some(&config)).await?;

// 获取连接池
let pool = PostgreSQLPool::get()?;

// 执行查询
let result = pool.execute("SELECT 1").await?;

// 健康检查
let is_healthy = pool.health_check().await?;
```

### 与其他模块集成

```rust
// 在应用启动时初始化
let pool = PostgreSQLPool::get()?;

// 传递给 IAMX
nebulafx_iamx::init_iam_sys(pool.inner().clone()).await?;
```

## 🔧 依赖

- **sqlx**: PostgreSQL 异步数据库操作
- **tokio**: 异步运行时
- **serde**: 配置序列化/反序列化
- **humantime**: 时间字符串解析

## 📄 License

Apache License 2.0 - 详见 [LICENSE](../../LICENSE) 文件。

