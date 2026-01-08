# ProfilingX Crate 结构说明

## 目录结构

```
src/
├── lib.rs              # 公共 API 和模块导出
├── config.rs           # Profiling 配置（ProfilingConfig）
└── profiler.rs         # Profiling 实现
```

## 模块职责

### Core（核心模块）
- **lib.rs**: 公共 API 和模块导出

### Configuration（配置）
- **config.rs**: 
  - `ProfilingConfig`: Profiling 配置结构
  - `CpuMode`: CPU 采样模式枚举
  - 配置默认值

### Profiling Implementation（Profiling 实现）
- **profiler.rs**:
  - `init_profiling()`: 初始化 profiling
  - `dump_cpu_pprof_for()`: 生成 CPU profiling 报告
  - `dump_memory_pprof_now()`: 生成内存 profiling 报告
  - `check_jemalloc_profiling()`: 检查 jemalloc 状态
  - pprof 报告生成和文件写入

## 数据流

```
配置加载
  ↓
init_profiling()
  ↓
初始化 jemalloc profiling（如果启用）
  ↓
启动 CPU profiling 定时任务（如果启用）
  ↓
定时生成报告或手动触发
  ↓
生成 pprof 格式文件
```

## Profiling 类型

### CPU Profiling
- 使用 `pprof` crate
- 支持定时采样
- 输出 pprof protobuf 格式

### Memory Profiling
- 使用 `jemalloc_pprof`
- 基于 jemalloc 的内存分析
- 立即生成快照

## 输出格式

- 文件格式：pprof protobuf
- 文件命名：`{type}_{timestamp}.pb`
- 输出目录：可配置，默认当前目录

