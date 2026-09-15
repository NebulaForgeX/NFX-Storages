# Kafka 事件总线包 / Kafka Event Bus Package

`kafkax` 是一个基于 Kafka 的类型安全事件总线包，提供了完整的 Kafka 功能支持，包括 Topic、Partition、Consumer Group 等原生概念。

## 快速开始 / Quick Start

### 安装

```bash
go get nfxstorages/pkgs/kafkax
```

### 基本用法

基本用法请参考：[USAGE_BASIC.md](./docs/USAGE_BASIC.md)

### 功能文档

- **基本用法**：[USAGE_BASIC.md](./docs/USAGE_BASIC.md) - 初始化、创建 Publisher/Subscriber、发布和订阅事件
- **配置详解**：[USAGE_CONFIG.md](./docs/USAGE_CONFIG.md) - 完整的配置选项说明
- **Topic 详解**：[USAGE_TOPIC.md](./docs/USAGE_TOPIC.md) - Topic、Partition、Consumer Group 的使用场景和最佳实践

## 核心特性 / Core Features

- ✅ **类型安全**：基于泛型提供编译时类型检查
- ✅ **Kafka 原生**：完全基于 Topic、Partition、Consumer Group 等原生概念
- ✅ **自动路由**：根据事件类型自动路由到对应的 Topic
- ✅ **事件类型自动生成**：支持从类型名自动生成 EventType
- ✅ **分区支持**：支持自定义分区键进行消息分区
- ✅ **Consumer Group**：支持 Consumer Group 实现负载均衡
- ✅ **自动重连**：支持自动重连和故障恢复
- ✅ **SASL/TLS 支持**：支持 SASL 认证和 TLS 加密

## 示例代码 / Example Code

### 发布事件

```go
import (
    "context"
    "nfxstorages/pkgs/kafkax"
    "nfxstorages/pkgs/kafkax/eventbus"
)

// 创建 Publisher
publisher, err := kafkax.NewPublisher(cfg)
if err != nil {
    log.Fatal(err)
}

// 发布事件
event := MyEvent{ID: "123"}
err = eventbus.PublishEvent(ctx, publisher, event)
```

### 订阅事件

```go
// 创建 Subscriber
subscriber, err := kafkax.NewSubscriber(cfg)
if err != nil {
    log.Fatal(err)
}

// 创建 Router
router, err := eventbus.NewEventRouter(subscriber, eventbus.EventRouterConfig{
    CloseTimeout: 10 * time.Second,
})

// 注册处理器
eventbus.RegisterHandler(router, func(ctx context.Context, evt MyEvent, rawMsg *message.Message) error {
    log.Printf("Received: %+v", evt)
    return nil
})

// 启动路由器
router.Run(ctx)
```

## 文档导航 / Documentation Navigation

- [基本用法](./docs/USAGE_BASIC.md) - 快速上手指南
- [配置详解](./docs/USAGE_CONFIG.md) - 完整配置选项
- [Topic 详解](./docs/USAGE_TOPIC.md) - Topic、Partition、Consumer Group 详解

## 许可证 / License

[Your License Here]
