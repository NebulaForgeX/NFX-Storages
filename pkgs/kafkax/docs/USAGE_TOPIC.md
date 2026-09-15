# Topic 详解 / Topic Guide

Topic（主题）是 Kafka 的核心概念，用于组织和存储消息。

## Topic 是什么？

```
Producer → Topic → Partition → Consumer Group → Consumer
```

Topic 是消息的逻辑分类：

1. **消息分类**：Producer 将消息发布到 Topic
2. **分区存储**：Topic 被分成多个 Partition，提高并发性能
3. **消费订阅**：Consumer 通过 Consumer Group 订阅 Topic

## Topic 的核心概念

### 1. Topic（主题）

**特点**：

- Topic 是消息的逻辑分类
- 一个 Topic 可以有多个 Partition
- 消息按顺序存储在 Partition 中

**配置示例**：

```toml
[kafka.producer_topics]
    access = "nfx-identity-access"
    clients = "nfx-identity-clients"
```

### 2. Partition（分区）

**特点**：

- Partition 是 Topic 的物理分片
- 每个 Partition 是一个有序的消息队列
- 消息在 Partition 内有序，但跨 Partition 无序
- 通过分区键（Partition Key）控制消息路由到哪个 Partition

**分区键示例**：

```go
// 使用分区键控制消息路由
err := eventbus.PublishEvent(ctx, publisher, event,
    eventbus.WithPartitionKey("tenant-123"),  // 相同分区键的消息会路由到同一个 Partition
)
```

**分区的作用**：

- **提高并发**：多个 Partition 可以并行处理
- **水平扩展**：增加 Partition 数量可以提高吞吐量
- **顺序保证**：同一 Partition 内的消息有序

### 3. Consumer Group（消费者组）

**特点**：

- Consumer Group 用于实现负载均衡
- 同一个 Group 内的消费者会共享 Partition
- 每个 Partition 只能被同一个 Group 内的一个消费者消费

**工作方式**：

```
Topic: nfx-identity-access
  Partition 0 → Consumer 1 (Group: nfxidentity-group)
  Partition 1 → Consumer 2 (Group: nfxidentity-group)
  Partition 2 → Consumer 3 (Group: nfxidentity-group)
```

**配置示例**：

```toml
[kafka.consumer]
    group_id = "nfxidentity-consumer-group"
```

## Topic 配置

### Topic 名称（Name）

```toml
[kafka.producer_topics]
    access = "nfx-identity-access"  # Topic 名称
```

**命名规范**：

- 使用有意义的名称：`nfx-identity-access` 而不是 `topic1`
- 使用连字符分隔：`nfx-identity-access` 而不是 `nfx_identity_access`
- 包含服务前缀：便于识别和管理

### Topic 自动创建

Kafka 支持自动创建 Topic（如果配置了 `InitializeTopicDetails`）：

```go
// 在 NewSubscriber 中自动创建 Topic
InitializeTopicDetails: &sarama.TopicDetail{
    NumPartitions:     3,  // 分区数
    ReplicationFactor: 1,  // 副本数
}
```

**注意**：生产环境建议手动创建 Topic，以便精确控制配置。

## Partition 的使用

### 分区键的作用

分区键用于控制消息路由到哪个 Partition：

```go
// 场景 1：按租户 ID 分区（保证同一租户的消息有序）
err := eventbus.PublishEvent(ctx, publisher, event,
    eventbus.WithPartitionKey("tenant-123"),
)

// 场景 2：按用户 ID 分区
err := eventbus.PublishEvent(ctx, publisher, event,
    eventbus.WithPartitionKey("user-456"),
)

// 场景 3：不使用分区键（随机分区）
err := eventbus.PublishEvent(ctx, publisher, event)
```

### 分区策略

1. **随机分区**：不使用分区键，消息随机分配到 Partition
2. **哈希分区**：使用分区键的哈希值决定 Partition（默认）
3. **自定义分区**：通过 `WithPartitionKey` 指定分区键

### 分区数量选择

**建议**：

- **小规模**：1-3 个 Partition
- **中等规模**：3-10 个 Partition
- **大规模**：10-100 个 Partition

**考虑因素**：

- Consumer 数量：Partition 数量应该 >= Consumer 数量
- 吞吐量需求：更多 Partition 可以提高并发
- 顺序要求：需要全局顺序时，使用 1 个 Partition

## Consumer Group 的使用

### 负载均衡

同一个 Consumer Group 内的消费者会共享 Partition，实现负载均衡：

```
Topic: nfx-identity-access (3 Partitions)
Consumer Group: nfxidentity-group

Consumer 1 → Partition 0
Consumer 2 → Partition 1
Consumer 3 → Partition 2

如果 Consumer 2 下线：
Consumer 1 → Partition 0, Partition 1
Consumer 3 → Partition 2
```

### 多个 Consumer Group

不同的 Consumer Group 可以独立消费同一个 Topic：

```
Topic: nfx-identity-access

Group 1 (nfxidentity-group-1):
  Consumer 1 → Partition 0
  Consumer 2 → Partition 1

Group 2 (nfxidentity-group-2):
  Consumer 3 → Partition 0  (独立消费)
  Consumer 4 → Partition 1
```

**使用场景**：

- 不同服务需要独立处理相同的消息
- 实现发布-订阅模式

### Offset 管理

Consumer Group 会维护每个 Partition 的消费偏移量（Offset）：

- **自动提交**：定期自动提交 Offset
- **手动提交**：处理完成后手动提交 Offset
- **初始 Offset**：通过 `initial_offset` 配置（`earliest` 或 `latest`）

## Kafka vs RabbitMQ：核心区别

### 消息模型对比

#### Kafka 模型：

```
Producer → Topic → Partition → Consumer Group → Consumer
```

- **Topic**：消息分类（类似 Exchange）
- **Partition**：Topic 的分区（提高并发）
- **Consumer Group**：消费者组（负载均衡）

#### RabbitMQ 模型：

```
Producer → Exchange → Queue → Consumer
           ↓
        RoutingKey
```

- **Exchange**：消息路由中心（类似 Topic，但更灵活）
- **Queue**：消息存储（类似 Partition，但更灵活）
- **RoutingKey**：路由键（Kafka 没有这个概念）

### 路由能力对比

| 场景           | Kafka                  | RabbitMQ                      |
| -------------- | ---------------------- | ----------------------------- |
| **精确路由**   | ✅ Topic 名称          | ✅ Direct Exchange            |
| **模式匹配**   | ❌ 不支持              | ✅ Topic Exchange (`user.*`)  |
| **广播**       | ✅ 多个 Consumer Group | ✅ Fanout Exchange            |
| **多队列路由** | ❌ 需要多个 Topic      | ✅ 一个 Exchange → 多个 Queue |
| **动态路由**   | ❌ 需要重新创建 Topic  | ✅ 动态绑定 Queue             |

### 实际场景对比

#### 场景 1：用户事件需要发送到多个服务

**Kafka 方式**：

```go
// 每个服务使用不同的 Consumer Group
// Group 1: auth-service-group
// Group 2: notification-service-group
// Group 3: analytics-service-group
// 所有 Group 都订阅同一个 Topic
publisher.Publish("user-events", event)
// 每个 Group 都会收到消息
```

优势：一个 Topic，多个 Consumer Group 独立消费

**RabbitMQ 方式**：

```toml
[rabbitmq.exchange]
    name = "user-events"
    type = "fanout"
```

```go
// 只需发布一次
messaging.PublishMessage(ctx, publisher, UserCreatedEvent{...})
// Exchange 自动路由到所有绑定的 Queue
```

优势：发布一次，自动路由到多个服务

#### 场景 2：需要按消息类型路由

**Kafka 方式**：

```go
// 需要创建多个 Topic
publisher.Publish("user-created", event)
publisher.Publish("user-updated", event)
publisher.Publish("user-deleted", event)
```

**RabbitMQ 方式**：

```toml
[rabbitmq.exchange]
    name = "user-events"
    type = "topic"

[rabbitmq.consumer_queues]
    user_created = { queue = "user-queue", binding_key = "user.created" }
    user_updated = { queue = "user-queue", binding_key = "user.updated" }
```

```go
// 使用同一个 Exchange，通过 RoutingKey 区分
messaging.PublishMessage(ctx, publisher, UserCreatedEvent{...})
messaging.PublishMessage(ctx, publisher, UserUpdatedEvent{...})
```

优势：一个 Exchange，灵活的路由规则

### Topic vs Exchange 总结

| 特性           | Kafka Topic            | RabbitMQ Exchange             |
| -------------- | ---------------------- | ----------------------------- |
| **作用**       | 消息分类存储           | 消息路由中心                  |
| **路由能力**   | 固定分区路由           | 灵活路由规则                  |
| **模式匹配**   | ❌ 不支持              | ✅ 支持通配符                 |
| **多目标路由** | ✅ 多个 Consumer Group | ✅ 一个 Exchange → 多个 Queue |
| **动态绑定**   | ❌ 需要重新创建 Topic  | ✅ 动态绑定 Queue             |
| **消息存储**   | ✅ Topic 存储消息      | ❌ Exchange 不存储消息        |
| **消息顺序**   | ✅ 分区内有序          | ✅ Queue 内有序               |
| **消息保留**   | ✅ 可配置保留时间      | ❌ 消费后删除                 |

## 最佳实践

1. **使用有意义的 Topic 名称**

   ```toml
   access = "nfx-identity-access"  # 而不是 "topic1"
   ```

2. **合理设置 Partition 数量**
   - Partition 数量 >= Consumer 数量
   - 根据吞吐量需求调整

3. **使用分区键保证顺序**

   ```go
   // 同一租户的消息路由到同一个 Partition，保证有序
   eventbus.WithPartitionKey("tenant-123")
   ```

4. **为不同服务使用不同的 Consumer Group**

   ```toml
   # 服务 A
   group_id = "service-a-group"

   # 服务 B
   group_id = "service-b-group"
   ```

5. **生产环境手动创建 Topic**
   - 精确控制 Partition 数量和副本数
   - 配置保留策略和压缩策略

6. **监控 Consumer Lag**
   - 及时发现消费延迟问题
   - 调整 Consumer 数量或 Partition 数量

## 使用场景

### 场景 1：事件流处理

```go
// 发布用户事件
eventbus.PublishEvent(ctx, publisher, UserCreatedEvent{
    UserID: "123",
    Email:  "user@example.com",
})

// 多个服务独立消费
// - 认证服务：更新用户缓存
// - 通知服务：发送欢迎邮件
// - 分析服务：记录用户注册事件
```

### 场景 2：日志聚合

```go
// 发布日志事件
eventbus.PublishEvent(ctx, publisher, LogEvent{
    Level:   "error",
    Message: "Database connection failed",
})

// 日志服务消费并存储到 Elasticsearch
```

### 场景 3：数据同步

```go
// 发布数据变更事件
eventbus.PublishEvent(ctx, publisher, DataUpdatedEvent{
    Table: "users",
    ID:    "123",
})

// 多个服务同步数据
// - 搜索服务：更新搜索索引
// - 缓存服务：清除缓存
// - 分析服务：更新统计数据
```

## 相关文档

- [基本用法](./USAGE_BASIC.md) - 快速上手指南
- [配置详解](./USAGE_CONFIG.md) - 完整配置选项
