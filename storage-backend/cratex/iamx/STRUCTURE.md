# IAM Crate 结构说明

## 目录结构

```
src/
├── lib.rs              # 公共 API 和模块导出
├── error.rs            # 错误定义
├── types.rs            # 类型定义（UserType, MappedPolicy, GroupInfo）
│
├── entity/             # 数据库实体（对应数据库表）
│   └── entity.rs      # UserEntity, PolicyEntity, GroupEntity 等
│
├── repository/         # 数据访问层（使用 sqlx）
│   ├── mod.rs
│   ├── user.rs         # 用户数据库操作
│   ├── user_identity.rs # 用户身份数据库操作
│   ├── policy.rs       # 策略数据库操作
│   ├── group.rs        # 组数据库操作
│   └── mapped_policy.rs # 映射策略数据库操作
│
├── manager/            # 业务逻辑层
│   ├── mod.rs
│   ├── user.rs         # 用户管理逻辑
│   ├── policy.rs       # 策略管理逻辑
│   ├── group.rs        # 组管理逻辑
│   ├── mapped_policy.rs # 映射策略管理逻辑
│   └── utils.rs        # 业务逻辑工具函数
│
├── sys.rs              # IAM 系统主类（IamSys）
├── init.rs             # 初始化函数（数据库迁移、根用户）
├── migrations/         # 数据库迁移（使用 refinery）
│   └── mod.rs
└── utils.rs            # 通用工具函数
```

## 模块职责

### Core（核心模块）
- **error.rs**: 错误类型定义
- **types.rs**: 业务类型定义
- **sys.rs**: IAM 系统主类，提供公共 API

### Database Layer（数据库层）
- **entity/**: 数据库实体，对应数据库表结构
- **repository/**: 数据访问层，使用 sqlx 执行 SQL
- **migrations/**: 数据库迁移，使用 refinery 管理

### Business Logic Layer（业务逻辑层）
- **manager/**: 业务逻辑实现，调用 repository 层

### Initialization（初始化）
- **init.rs**: 数据库初始化和根用户创建

### Utilities（工具）
- **utils.rs**: 通用工具函数

## 数据流

```
外部调用
  ↓
sys.rs (IamSys)
  ↓
manager/ (业务逻辑)
  ↓
repository/ (数据访问)
  ↓
entity/ (数据实体)
  ↓
PostgreSQL 数据库
```

## 迁移流程

```
应用启动
  ↓
init.rs::init_database()
  ↓
migrations::run_migrations() (使用 refinery)
  ↓
执行 SQL 迁移文件
  ↓
refinery_schema_history 表记录版本
```

