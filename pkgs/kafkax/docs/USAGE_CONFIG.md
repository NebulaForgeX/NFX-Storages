# 配置详解 / Configuration Guide

完整的 Kafka 配置选项说明。

## 配置示例

```toml
[kafka]
    brokers = ["localhost:9092", "localhost:9093"]
    client_id = "nfxidentity-service"

    [kafka.producer]
        acks = "all"
        compression = "gzip"
        retries = 3
        batch_bytes = 1048576
        linger_ms = 10
        idempotent = true

    [kafka.consumer]
        group_id = "nfxidentity-consumer-group"
        initial_offset = "latest"
        session_timeout_ms = 30000
        heartbeat_interval_ms = 3000
        fetch_min_bytes = 1024
        fetch_max_bytes = 10485760
        return_errors = true

    [kafka.network]
        max_open_requests = 5

    [kafka.security]
        enabled = true
        mechanism = "SCRAM-SHA-256"
        username = "kafka-user"
        password = "kafka-password"
        tls_insecure_skip_verify = false

    [kafka.producer_topics]
        access = "nfx-identity-access"
        clients = "nfx-identity-clients"
        directory = "nfx-identity-directory"

    [kafka.consumer_topics]
        access = "nfx-identity-access"
        clients = "nfx-identity-clients"
        directory = "nfx-identity-directory"
```

## 配置项说明

### 基础配置

#### `brokers`

- **类型**：`[]string`
- **说明**：Kafka Broker 地址列表
- **格式**：`["host1:port1", "host2:port2"]`
- **示例**：`["localhost:9092", "kafka1:9092", "kafka2:9092"]`
- **必填**：是

#### `client_id`

- **类型**：`string`
- **说明**：客户端标识符
- **用途**：用于日志和监控，标识客户端应用
- **必填**：是

### Producer 配置

#### `acks`

- **类型**：`string`
- **默认值**：`"all"`
- **可选值**：`"0"`, `"1"`, `"all"`
- **说明**：消息确认模式
  - `"0"`：不等待确认，性能最高但可能丢失消息
  - `"1"`：等待 Leader 确认，平衡性能和可靠性
  - `"all"`：等待所有 ISR（In-Sync Replicas）确认，最可靠但性能较低

#### `compression`

- **类型**：`string`
- **默认值**：`""`（无压缩）
- **可选值**：`"gzip"`, `"snappy"`, `"lz4"`, `"zstd"`
- **说明**：消息压缩算法
  - `"gzip"`：压缩率高，CPU 消耗较高
  - `"snappy"`：压缩率和性能平衡
  - `"lz4"`：压缩速度快
  - `"zstd"`：压缩率和性能都很好（推荐）

#### `retries`

- **类型**：`int`
- **默认值**：`0`
- **说明**：重试次数，0 表示不重试
- **建议**：生产环境建议设置为 3-5

#### `batch_bytes`

- **类型**：`int`
- **默认值**：`0`
- **说明**：批次大小（字节），0 表示不限制
- **建议**：根据消息大小设置，如 1MB (1048576)

#### `linger_ms`

- **类型**：`int`
- **默认值**：`0`
- **说明**：等待批次填满的时间（毫秒），0 表示立即发送
- **建议**：10-100ms，平衡延迟和吞吐量

#### `idempotent`

- **类型**：`bool`
- **默认值**：`false`
- **说明**：是否启用幂等性，确保消息不重复
- **注意**：启用后 `max_open_requests` 会自动设置为 1

### Consumer 配置

#### `group_id`

- **类型**：`string`
- **说明**：Consumer Group ID
- **用途**：用于负载均衡和偏移量管理
- **必填**：是
- **注意**：同一个 Group ID 的消费者会共享分区，实现负载均衡

#### `initial_offset`

- **类型**：`string`
- **默认值**：`"latest"`
- **可选值**：`"earliest"`, `"latest"`
- **说明**：初始偏移量
  - `"earliest"`：从最早的消息开始消费
  - `"latest"`：从最新的消息开始消费（只消费新消息）

#### `session_timeout_ms`

- **类型**：`int`
- **默认值**：`30000`（30 秒）
- **说明**：会话超时时间（毫秒）
- **注意**：如果消费者在此时间内没有发送心跳，会被认为已失效

#### `heartbeat_interval_ms`

- **类型**：`int`
- **默认值**：`3000`（3 秒）
- **说明**：心跳间隔（毫秒）
- **建议**：通常设置为 `session_timeout_ms` 的 1/3

#### `fetch_min_bytes`

- **类型**：`int`
- **默认值**：`1024`（1KB）
- **说明**：最小拉取字节数
- **用途**：减少网络往返次数，提高吞吐量

#### `fetch_max_bytes`

- **类型**：`int`
- **默认值**：`10485760`（10MB）
- **说明**：最大拉取字节数
- **注意**：受 Broker 的 `message.max.bytes` 限制

#### `return_errors`

- **类型**：`bool`
- **默认值**：`false`
- **说明**：是否返回错误到错误通道
- **用途**：用于错误监控和处理

### Network 配置

#### `max_open_requests`

- **类型**：`int`
- **默认值**：`5`
- **说明**：最大并发请求数
- **注意**：启用幂等性时自动设置为 1

### Security 配置

#### `enabled`

- **类型**：`bool`
- **默认值**：`false`
- **说明**：是否启用 SASL 认证

#### `mechanism`

- **类型**：`string`
- **默认值**：`"PLAIN"`
- **可选值**：`"PLAIN"`, `"SCRAM-SHA-256"`, `"SCRAM-SHA-512"`
- **说明**：SASL 认证机制
  - `"PLAIN"`：简单用户名密码认证
  - `"SCRAM-SHA-256"`：SCRAM-SHA-256 认证（推荐）
  - `"SCRAM-SHA-512"`：SCRAM-SHA-512 认证

#### `username`

- **类型**：`string`
- **说明**：SASL 用户名
- **必填**：启用 Security 时必填

#### `password`

- **类型**：`string`
- **说明**：SASL 密码
- **必填**：启用 Security 时必填

#### `tls_insecure_skip_verify`

- **类型**：`bool`
- **默认值**：`false`
- **说明**：是否跳过 TLS 证书验证（仅用于开发环境）
- **警告**：生产环境必须设置为 `false`

### Topic 配置

#### `producer_topics`

- **类型**：`map[string]string`
- **说明**：映射事件键（TopicKey）到实际 Topic 名称
- **格式**：
  ```toml
  [kafka.producer_topics]
      access = "nfx-identity-access"
      clients = "nfx-identity-clients"
  ```
- **用途**：发布事件时，根据事件的 `TopicKey()` 找到对应的 Topic

#### `consumer_topics`

- **类型**：`map[string]string`
- **说明**：映射事件键（TopicKey）到实际 Topic 名称
- **格式**：
  ```toml
  [kafka.consumer_topics]
      access = "nfx-identity-access"
      clients = "nfx-identity-clients"
  ```
- **用途**：订阅事件时，根据事件的 `TopicKey()` 找到对应的 Topic

## 配置示例

### 开发环境配置

```toml
[kafka]
    brokers = ["localhost:9092"]
    client_id = "nfxidentity-dev"

    [kafka.producer]
        acks = "1"
        compression = "snappy"
        retries = 1

    [kafka.consumer]
        group_id = "nfxidentity-dev-group"
        initial_offset = "latest"
```

### 生产环境配置

```toml
[kafka]
    brokers = ["kafka1:9092", "kafka2:9092", "kafka3:9092"]
    client_id = "nfxidentity-prod"

    [kafka.producer]
        acks = "all"
        compression = "zstd"
        retries = 5
        batch_bytes = 1048576
        linger_ms = 10
        idempotent = true

    [kafka.consumer]
        group_id = "nfxidentity-prod-group"
        initial_offset = "earliest"
        session_timeout_ms = 30000
        heartbeat_interval_ms = 3000
        fetch_min_bytes = 1024
        fetch_max_bytes = 10485760

    [kafka.security]
        enabled = true
        mechanism = "SCRAM-SHA-256"
        username = "kafka-user"
        password = "secure-password"
        tls_insecure_skip_verify = false
```

### 高吞吐量配置

```toml
[kafka]
    brokers = ["kafka1:9092", "kafka2:9092"]
    client_id = "nfxidentity-high-throughput"

    [kafka.producer]
        acks = "1"  # 降低确认要求，提高吞吐量
        compression = "lz4"  # 快速压缩
        batch_bytes = 2097152  # 2MB 批次
        linger_ms = 50  # 等待批次填满
        idempotent = false  # 关闭幂等性以提高性能

    [kafka.consumer]
        group_id = "nfxidentity-high-throughput-group"
        fetch_min_bytes = 5120  # 5KB
        fetch_max_bytes = 52428800  # 50MB
```

### 高可靠性配置

```toml
[kafka]
    brokers = ["kafka1:9092", "kafka2:9092", "kafka3:9092"]
    client_id = "nfxidentity-high-reliability"

    [kafka.producer]
        acks = "all"  # 等待所有副本确认
        compression = "zstd"
        retries = 10  # 更多重试
        idempotent = true  # 启用幂等性

    [kafka.consumer]
        group_id = "nfxidentity-high-reliability-group"
        initial_offset = "earliest"  # 从最早开始，不丢失消息
        return_errors = true  # 返回错误以便处理
```

## 最佳实践

1. **生产环境使用 `acks = "all"`**：确保消息不丢失
2. **启用幂等性**：`idempotent = true`，防止消息重复
3. **使用压缩**：根据场景选择压缩算法（推荐 `zstd`）
4. **合理设置批次大小**：平衡延迟和吞吐量
5. **配置 Consumer Group**：实现负载均衡和容错
6. **启用 SASL/TLS**：生产环境必须启用安全认证
7. **监控 Consumer Lag**：及时发现消费延迟问题

## 相关文档

- [基本用法](./USAGE_BASIC.md) - 快速上手指南
- [Topic 详解](./USAGE_TOPIC.md) - Topic、Partition、Consumer Group 详解
