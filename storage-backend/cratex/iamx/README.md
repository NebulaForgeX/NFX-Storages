# IAMX - Identity & Access Management

IAMX 是 NebulaFX 分布式对象存储系统的身份和访问管理核心模块，提供完整的用户认证、授权和权限管理功能。

## 📋 功能概述

IAMX 负责 NebulaFX 系统的所有身份和访问管理功能：

### 🔐 核心服务功能

- **用户管理服务**
  - 用户创建、更新、删除
  - 用户状态管理（启用/禁用）
  - 访问密钥（Access Key）和秘密密钥（Secret Key）管理
  - 临时用户和会话管理
  - 服务账户（Service Account）管理

- **策略管理服务**
  - IAM 策略的创建、更新、删除
  - 策略文档（Policy Document）管理
  - 策略版本控制

- **组管理服务**
  - 用户组的创建和管理
  - 组成员管理
  - 组策略关联

- **权限映射服务**
  - 用户策略映射（User Policy Mapping）
  - 组策略映射（Group Policy Mapping）
  - STS 用户策略映射

- **认证与授权服务**
  - 访问密钥验证
  - 权限检查（is_allowed）
  - 策略评估和决策

## 💾 数据存储

所有 IAM 数据（用户、策略、组、映射关系）都存储在 **PostgreSQL 数据库**中，使用 `sqlx` 进行异步数据库操作，使用 `refinery` 进行数据库版本迁移管理。

## 🚀 快速开始

### 初始化

```rust
use iamx::{init_iam_sys, get};
use sqlx::PgPool;

// 初始化 IAM 系统
let pool: PgPool = /* 创建数据库连接池 */;
init_iam_sys(pool).await?;

// 获取 IAM 系统实例
let iam_sys = get()?;

// 使用 IAM 功能
iam_sys.create_user("access_key", &user_req).await?;
```

### 数据库初始化

```rust
use iamx::init;

// 初始化数据库（执行迁移）
init::init_database(database_url).await?;

// 初始化根用户
init::init_root_user(&pool, "root_access_key", "root_secret_key").await?;
```

## 📦 主要 API

### IamSys - 核心系统类

提供所有 IAM 功能的统一入口：

- `create_user()` - 创建用户
- `get_user()` - 获取用户信息
- `set_user_status()` - 设置用户状态
- `delete_user()` - 删除用户
- `list_users()` - 列出所有用户
- `set_policy()` - 设置策略
- `get_policy_doc()` - 获取策略文档
- `list_polices()` - 列出所有策略
- `is_allowed()` - 权限检查
- `check_key()` - 验证访问密钥

### 类型

- `UserType`: 用户类型枚举（Regular, Service Account, STS, Temp）
- `MappedPolicy`: 策略映射
- `GroupInfo`: 组信息

### Repository 层

- `UserRepository`: 用户数据访问
- `PolicyRepository`: 策略数据访问
- `GroupRepository`: 组数据访问
- `MappedPolicyRepository`: 映射策略数据访问
- `UserIdentityRepository`: 用户身份数据访问

## 📝 使用示例

### 用户管理

```rust
let iam_sys = iamx::get()?;

// 创建用户
iam_sys.create_user("access_key", &user_req).await?;

// 获取用户信息
let user = iam_sys.get_user("access_key").await?;

// 设置用户状态
iam_sys.set_user_status("access_key", AccountStatus::Enabled).await?;
```

### 策略管理

```rust
// 设置策略
iam_sys.set_policy("policy_name", policy).await?;

// 获取策略
let policy_doc = iam_sys.get_policy_doc("policy_name").await?;

// 列出所有策略
let policies = iam_sys.list_polices("").await?;
```

### 权限检查

```rust
let is_allowed = iam_sys.is_allowed(&Args {
    account: &access_key,
    groups: &groups,
    action: Action::S3Action(S3Action::GetObjectAction),
    bucket: "my-bucket",
    object: "my-object",
    conditions: &conditions,
    is_owner: false,
    claims: &claims,
    deny_only: false,
}).await;
```

## 🔧 依赖

- **sqlx**: 异步 PostgreSQL 数据库操作
- **refinery**: 数据库迁移管理
- **tokio-postgres**: PostgreSQL 客户端（用于迁移）
- **nebulafx-policy**: 策略引擎
- **nebulafx-crypto**: 加密工具

## 📄 License

Apache License 2.0 - 详见 [LICENSE](../../LICENSE) 文件。
