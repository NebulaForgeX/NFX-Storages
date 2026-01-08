# TokioX - Tokio Runtime Configuration

TokioX 是 NebulaFX 的 Tokio 异步运行时配置模块，提供便捷的 Tokio runtime 配置和构建功能，支持从配置文件和环境变量加载配置。

## 📋 功能概述

TokioX 负责 NebulaFX 系统的 Tokio 异步运行时配置：

### ⚙️ 核心服务功能

- **Runtime 配置**
  - Worker 线程数配置
  - 阻塞线程数配置
  - 线程栈大小配置
  - 线程生命周期管理

- **自动检测**
  - CPU 核心数自动检测
  - 物理核心优先，回退到逻辑核心
  - 根据核心数自动计算阻塞线程数

- **配置优先级**
  1. 环境变量（最高优先级）
  2. RuntimeConfig 配置
  3. 自动检测/默认值（最低优先级）

- **线程管理**
  - 线程命名
  - 线程启动/停止钩子
  - 线程保活时间配置

## 🚀 快速开始

### 基本使用

```rust
use nebulafx_tokiox::{get_tokio_runtime_builder, RuntimeConfig};

// 使用默认配置（自动检测 CPU 核心数）
let builder = get_tokio_runtime_builder(None);
let runtime = builder.build().unwrap();

// 使用自定义配置
let config = RuntimeConfig {
    worker_threads: Some(8),
    max_blocking_threads: Some(1024),
    ..Default::default()
};
let builder = get_tokio_runtime_builder(Some(&config));
let runtime = builder.build().unwrap();
```

### 环境变量配置

```bash
# Worker 线程数
export TOKIO_WORKER_THREADS=8

# 最大阻塞线程数
export TOKIO_MAX_BLOCKING_THREADS=1024

# 线程栈大小（字节）
export TOKIO_THREAD_STACK_SIZE=2097152
```

## 📦 主要 API

### RuntimeConfig

配置结构，包含所有 Tokio runtime 参数：

- `worker_threads()` - Worker 线程数（默认：CPU 物理核心数）
- `max_blocking_threads()` - 最大阻塞线程数（默认：根据核心数计算）
- `thread_stack_size()` - 线程栈大小（默认：1MB，Debug/macOS 为 2MB）
- `thread_keep_alive()` - 线程保活时间
- `global_queue_interval()` - 全局队列检查间隔
- `event_interval()` - 事件循环间隔
- `thread_name()` - 线程名称前缀

### get_tokio_runtime_builder

创建配置好的 Tokio runtime builder。

## 📝 使用示例

### 默认配置

```rust
let builder = get_tokio_runtime_builder(None);
let runtime = builder.build().unwrap();
runtime.block_on(async {
    // 异步代码
});
```

### 自定义配置

```rust
let config = RuntimeConfig {
    worker_threads: Some(16),
    max_blocking_threads: Some(2048),
    thread_stack_size: Some(2 * 1024 * 1024),
    ..Default::default()
};
let builder = get_tokio_runtime_builder(Some(&config));
let runtime = builder.build().unwrap();
```

## 🔧 依赖

- **tokio**: Tokio 异步运行时
- **sysinfo**: 系统信息检测（CPU 核心数）
- **serde**: 配置序列化/反序列化
- **chrono**: 时间处理

## 📄 License

Apache License 2.0 - 详见 [LICENSE](../../LICENSE) 文件。

