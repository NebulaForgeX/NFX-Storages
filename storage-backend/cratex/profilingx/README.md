# ProfilingX - Performance Profiling Tools

ProfilingX 是 NebulaFX 的性能分析工具模块，提供 CPU 和内存性能分析功能，支持生成 pprof 格式的性能分析报告。

## 📋 功能概述

ProfilingX 负责 NebulaFX 系统的性能分析和监控：

### 📊 核心服务功能

- **CPU 性能分析**
  - CPU profiling 初始化
  - 定时采样和报告生成
  - pprof 格式输出
  - 支持多种采样模式

- **内存性能分析**
  - jemalloc 内存 profiling
  - 内存快照生成
  - 内存使用分析

- **配置管理**
  - Profiling 配置加载
  - 输出目录管理
  - 采样间隔配置

- **报告生成**
  - pprof protobuf 格式输出
  - 时间戳命名
  - 自动目录创建

## 🚀 快速开始

### 初始化 Profiling

```rust
use nebulafx_profilingx::{init_profiling, ProfilingConfig};

let config = ProfilingConfig {
    cpu_enabled: true,
    memory_enabled: true,
    output_dir: "/tmp/profiling".to_string(),
    cpu_interval: Some(30), // 30 秒
    ..Default::default()
};

init_profiling(&config).await?;
```

### 手动生成报告

```rust
use nebulafx_profilingx::{dump_cpu_pprof_for, dump_memory_pprof_now};

// 生成 CPU profiling 报告（持续 30 秒）
dump_cpu_pprof_for(Duration::from_secs(30)).await?;

// 立即生成内存 profiling 报告
dump_memory_pprof_now().await?;
```

## 📦 主要 API

### ProfilingConfig

配置结构：

- `cpu_enabled` - 启用 CPU profiling
- `memory_enabled` - 启用内存 profiling
- `output_dir` - 输出目录
- `cpu_interval` - CPU 采样间隔（秒）
- `cpu_mode` - CPU 采样模式

### 核心函数

- `init_profiling(config)` - 初始化 profiling
- `dump_cpu_pprof_for(duration)` - 生成 CPU 报告
- `dump_memory_pprof_now()` - 生成内存报告
- `check_jemalloc_profiling()` - 检查 jemalloc profiling 状态

## 📝 使用示例

### 基本使用

```rust
use nebulafx_profilingx::{init_profiling, ProfilingConfig, CpuMode};

let config = ProfilingConfig {
    cpu_enabled: true,
    memory_enabled: true,
    output_dir: "./profiles".to_string(),
    cpu_interval: Some(60),
    cpu_mode: Some(CpuMode::Cpu),
    ..Default::default()
};

init_profiling(&config).await?;
```

### 手动触发

```rust
use std::time::Duration;
use nebulafx_profilingx::{dump_cpu_pprof_for, dump_memory_pprof_now};

// CPU profiling（持续 30 秒）
dump_cpu_pprof_for(Duration::from_secs(30)).await?;

// 内存 profiling（立即）
dump_memory_pprof_now().await?;
```

## 🔧 依赖

- **pprof**: pprof 格式的 profiling 支持
- **jemalloc_pprof**: jemalloc 内存 profiling
- **tikv-jemalloc-ctl**: jemalloc 控制接口
- **tokio**: 异步运行时
- **chrono**: 时间处理

## 📄 License

Apache License 2.0 - 详见 [LICENSE](../../LICENSE) 文件。

