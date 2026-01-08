# TOMLX - TOML Configuration Loader

TOMLX 是 NebulaFX 的通用 TOML 配置文件加载模块，提供类型安全的配置加载功能，支持从文件路径或字符串加载配置。

## 📋 功能概述

TOMLX 负责 NebulaFX 系统的 TOML 配置文件加载：

### 📄 核心服务功能

- **配置加载**
  - 从文件路径加载配置
  - 从字符串加载配置
  - 类型安全的配置解析

- **配置验证**
  - TOML 语法验证
  - 类型检查
  - 错误报告

- **配置输出**
  - 可选的 JSON 格式输出（用于调试）
  - 配置内容打印

## 🚀 快速开始

### 从文件加载

```rust
use nebulafx_tomlx::load_config;

#[derive(Debug, serde::Deserialize, serde::Serialize)]
struct AppConfig {
    host: String,
    port: u16,
    database: DatabaseConfig,
}

#[derive(Debug, serde::Deserialize, serde::Serialize)]
struct DatabaseConfig {
    host: String,
    port: u16,
}

// 从文件加载配置（打印配置内容）
let config: AppConfig = load_config("config.toml", true)?;

// 从文件加载配置（不打印）
let config: AppConfig = load_config("config.toml", false)?;
```

### 从字符串加载

```rust
use nebulafx_tomlx::load_config_from_str;

let toml_content = r#"
host = "localhost"
port = 8080
[database]
host = "localhost"
port = 5432
"#;

let config: AppConfig = load_config_from_str(toml_content)?;
```

## 📦 主要 API

### load_config

从文件路径加载配置：

```rust
pub fn load_config<T>(path: impl AsRef<Path>, if_print: bool) -> Result<T>
where
    T: serde::de::DeserializeOwned + serde::Serialize
```

### load_config_from_str

从字符串加载配置：

```rust
pub fn load_config_from_str<T>(content: &str) -> Result<T>
where
    T: serde::de::DeserializeOwned
```

## 📝 使用示例

### 基本使用

```rust
use nebulafx_tomlx::load_config;

#[derive(serde::Deserialize, serde::Serialize)]
struct Config {
    app_name: String,
    version: String,
    settings: Settings,
}

#[derive(serde::Deserialize, serde::Serialize)]
struct Settings {
    debug: bool,
    log_level: String,
}

let config: Config = load_config("config.toml", true)?;
```

### 错误处理

```rust
use nebulafx_tomlx::{load_config, TomlConfigError};

match load_config::<Config>("config.toml", false) {
    Ok(config) => println!("Config loaded: {:?}", config),
    Err(TomlConfigError::NotFound(path)) => {
        eprintln!("Config file not found: {}", path);
    }
    Err(TomlConfigError::Parse(e)) => {
        eprintln!("Failed to parse config: {}", e);
    }
    Err(TomlConfigError::Io(e)) => {
        eprintln!("IO error: {}", e);
    }
}
```

## 🔧 依赖

- **toml**: TOML 解析库
- **serde**: 序列化/反序列化
- **serde_json**: JSON 输出（用于调试）

## 📄 License

Apache License 2.0 - 详见 [LICENSE](../../LICENSE) 文件。

