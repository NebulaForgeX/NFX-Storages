# PostgreSQLX Crate 结构说明

## 目录结构

```
src/
├── lib.rs              # 公共 API 和模块导出
├── error.rs            # 错误类型定义
├── pool.rs             # 连接池管理（PostgreSQLPool）
└── migration.rs        # 数据库迁移功能
```

## 模块职责

### Core（核心模块）
- **lib.rs**: 公共 API 和模块导出
- **error.rs**: 错误类型定义（PostgreSQLError）

### Connection Pool（连接池）
- **pool.rs**: 
  - `PostgreSQLPool`: 全局连接池单例管理
  - 连接池初始化和获取
  - 健康检查
  - Schema 自动创建

### Configuration（配置）
- **lib.rs**:
  - `PostgreSQLConfig`: 数据库配置结构
  - `PostgreSQLConnectionConfig`: 连接参数配置
  - `build_connection_url()`: 构建连接字符串
  - `create_pool()`: 创建连接池

### Migration（迁移）
- **migration.rs**: 数据库迁移执行功能

## 数据流

```
配置文件 (TOML)
  ↓
PostgreSQLConfig
  ↓
create_pool() → PgPool
  ↓
PostgreSQLPool::init() → 全局单例
  ↓
PostgreSQLPool::get() → 提供给其他模块
  ↓
IAMX 使用连接池操作数据库
```

## 初始化流程

```
应用启动
  ↓
读取数据库配置
  ↓
PostgreSQLConfig::create_pool()
  ↓
创建 Schema（如果指定）
  ↓
PostgreSQLPool::init() 设置全局单例
  ↓
其他模块通过 PostgreSQLPool::get() 获取连接池
```

