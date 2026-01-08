# TokioX Crate 结构说明

## 目录结构

```
src/
├── lib.rs              # 公共 API 和模块导出
├── config.rs           # 运行时配置（RuntimeConfig）
└── runtime.rs          # Runtime builder 创建逻辑
```

## 模块职责

### Core（核心模块）
- **lib.rs**: 公共 API 和模块导出

### Configuration（配置）
- **config.rs**: 
  - `RuntimeConfig`: 运行时配置结构
  - 配置值获取方法（支持环境变量）
  - 默认值计算

### Runtime Builder（运行时构建）
- **runtime.rs**:
  - `get_tokio_runtime_builder()`: 创建配置好的 builder
  - `detect_cores()`: 检测 CPU 核心数
  - `compute_default_worker_threads()`: 计算默认 worker 线程数
  - `compute_default_max_blocking_threads()`: 计算默认阻塞线程数
  - `compute_default_thread_stack_size()`: 计算默认线程栈大小

## 配置优先级

```
环境变量 (最高优先级)
  ↓
RuntimeConfig 配置值
  ↓
自动检测/默认值 (最低优先级)
```

## 自动检测逻辑

### CPU 核心数检测
- 优先使用物理核心数
- 回退到逻辑核心数
- 最小值为 1

### 阻塞线程数计算
- 16 核心以下：1024 线程
- 超过 16 核心：每翻倍一次，线程数翻倍
- 17-32 核心：2048 线程
- 33-64 核心：4096 线程
- 以此类推

### 线程栈大小
- Release 模式：1 MB
- Debug 模式或 macOS：2 MB

