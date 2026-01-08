# TOMLX Crate 结构说明

## 目录结构

```
src/
├── lib.rs              # 公共 API 和模块导出
├── error.rs            # 错误类型定义（TomlConfigError）
└── loader.rs           # 配置加载实现
```

## 模块职责

### Core（核心模块）
- **lib.rs**: 公共 API 和模块导出
  - `load_config()`: 从文件路径加载配置

### Error Handling（错误处理）
- **error.rs**: 
  - `TomlConfigError`: 配置加载错误类型
  - `Result<T>`: 结果类型别名

### Configuration Loading（配置加载）
- **loader.rs**:
  - `load_config_from_path()`: 从文件路径加载配置
  - `load_config_from_str()`: 从字符串加载配置
  - 配置验证和错误处理
  - 可选的 JSON 格式输出

## 数据流

```
TOML 文件/字符串
  ↓
load_config_from_path/load_config_from_str
  ↓
toml::from_str() 解析
  ↓
serde::Deserialize 反序列化
  ↓
类型安全的配置对象
  ↓
（可选）JSON 格式输出
```

## 错误类型

- `NotFound`: 配置文件不存在
- `Parse`: TOML 解析错误
- `Io`: 文件 IO 错误

