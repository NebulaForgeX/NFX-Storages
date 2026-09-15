# 基本用法 / Basic Usage

## 1. 配置

在 `example.toml` 或你的配置文件中添加 Kafka 配置：

```toml
[kafka]
    brokers = ["localhost:9092"]
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
        enabled = false
        mechanism = "PLAIN"
        username = ""
        password = ""
        tls_insecure_skip_verify = false

    # ProducerTopics 映射事件键到 Topic 名称
    [kafka.producer_topics]
        access = "nfx-identity-access"
        clients = "nfx-identity-clients"
        directory = "nfx-identity-directory"

    # ConsumerTopics 映射事件键到 Topic 名称
    [kafka.consumer_topics]
        access = "nfx-identity-access"
        clients = "nfx-identity-clients"
        directory = "nfx-identity-directory"
```

## 2. 创建 Publisher（发布者）

```go
package main

import (
    "nfxstorages/pkgs/kafkax"
    "nfxstorages/pkgs/kafkax/eventbus"
)

func createPublisher(cfg *kafkax.Config) (*eventbus.BusPublisher, error) {
    // 验证配置
    if err := cfg.Validate(); err != nil {
        return nil, fmt.Errorf("invalid kafka config: %w", err)
    }

    // 创建 Publisher
    publisher, err := kafkax.NewPublisher(cfg)
    if err != nil {
        return nil, fmt.Errorf("failed to create kafka publisher: %w", err)
    }

    return publisher, nil
}
```

## 3. 创建 Subscriber（订阅者）

```go
func createSubscriber(cfg *kafkax.Config) (*eventbus.BusSubscriber, error) {
    // 验证配置
    if err := cfg.Validate(); err != nil {
        return nil, fmt.Errorf("invalid kafka config: %w", err)
    }

    // 创建 Subscriber
    subscriber, err := kafkax.NewSubscriber(cfg)
    if err != nil {
        return nil, fmt.Errorf("failed to create kafka subscriber: %w", err)
    }

    return subscriber, nil
}
```

## 4. 定义事件类型

```go
package access

import "nfxstorages/pkgs/kafkax/eventbus"

// 方式一：自动生成 EventType（推荐）
type GrantsInvalidateCacheEvent struct {
    ID string `json:"id"`
}

func (GrantsInvalidateCacheEvent) TopicKey() eventbus.TopicKey {
    return "access"  // 返回主题键
}

// 方式二：自定义 EventType
type UserCreatedEvent struct {
    UserID string `json:"user_id"`
    Name   string `json:"name"`
}

func (UserCreatedEvent) EventType() eventbus.EventType {
    return "custom.user.created"
}

func (UserCreatedEvent) TopicKey() eventbus.TopicKey {
    return "custom"
}
```

## 5. 发布事件

```go
package main

import (
    "context"
    "nfxstorages/pkgs/kafkax/eventbus"
)

func publishEvent(ctx context.Context, publisher *eventbus.BusPublisher) error {
    event := access.GrantsInvalidateCacheEvent{
        ID: "grant-123",
    }

    // 发布事件（自动根据事件类型找到对应的 Topic）
    err := eventbus.PublishEvent(ctx, publisher, event)
    if err != nil {
        return fmt.Errorf("failed to publish event: %w", err)
    }

    return nil
}
```

## 6. 创建 EventRouter 并注册处理器

```go
package eventbus

import (
    "context"
    "time"
    "nfxstorages/pkgs/kafkax"
    "nfxstorages/pkgs/kafkax/eventbus"
    "nfxstorages/pkgs/logx"
    wmMiddleware "github.com/ThreeDotsLabs/watermill/message/router/middleware"
)

type Router struct {
    *eventbus.EventRouter
}

func NewRouter(cfg *kafkax.Config) (*Router, error) {
    // 创建订阅者
    sub, err := kafkax.NewSubscriber(cfg)
    if err != nil {
        return nil, err
    }

    // 创建路由器
    router, err := eventbus.NewEventRouter(sub, eventbus.EventRouterConfig{
        CloseTimeout: 10 * time.Second,
        Logger:       logx.NewZapWatermillLogger(logx.L()),
    })
    if err != nil {
        return nil, err
    }

    // 添加中间件（可选）
    router.AddMiddleware(
        wmMiddleware.CorrelationID,
        wmMiddleware.Recoverer,
        wmMiddleware.Retry{
            MaxRetries:      3,
            InitialInterval: 200 * time.Millisecond,
            MaxInterval:     2 * time.Second,
            Multiplier:      2.0,
        }.Middleware,
        wmMiddleware.Timeout(10*time.Second),
    )

    return &Router{
        EventRouter: router,
    }, nil
}

// 注册事件处理器
func (r *Router) RegisterHandlers() {
    // 注册处理器（自动根据事件类型路由）
    eventbus.RegisterHandler(r.EventRouter, r.handleUserCreated)
    eventbus.RegisterHandler(r.EventRouter, r.handleUserUpdated)
}

// 事件处理器示例
func (r *Router) handleUserCreated(ctx context.Context, evt UserCreatedEvent, rawMsg *message.Message) error {
    logx.S().Infof("Received user created event: %+v", evt)
    // 处理事件逻辑
    return nil
}

func (r *Router) handleUserUpdated(ctx context.Context, evt UserUpdatedEvent, rawMsg *message.Message) error {
    logx.S().Infof("Received user updated event: %+v", evt)
    // 处理事件逻辑
    return nil
}

// 启动路由器
func (r *Router) Run(ctx context.Context) error {
    logx.S().Info("Starting Kafka event router...")
    return r.EventRouter.Run(ctx)
}

// 关闭路由器
func (r *Router) Close() error {
    return r.EventRouter.Close()
}
```

## 7. 完整示例

```go
package server

import (
    "context"
    "nfxstorages/pkgs/kafkax"
    "nfxstorages/pkgs/kafkax/eventbus"
)

type Deps struct {
    KafkaConfig *kafkax.Config
}

func NewServer(deps Deps) (*Server, error) {
    // 创建 Publisher
    publisher, err := kafkax.NewPublisher(deps.KafkaConfig)
    if err != nil {
        return nil, fmt.Errorf("failed to create publisher: %w", err)
    }

    // 创建 Router
    router, err := NewRouter(deps.KafkaConfig)
    if err != nil {
        return nil, fmt.Errorf("failed to create router: %w", err)
    }

    // 注册处理器
    router.RegisterHandlers()

    return &Server{
        publisher: publisher,
        router:    router,
    }, nil
}

type Server struct {
    publisher *eventbus.BusPublisher
    router    *Router
}

func (s *Server) Start(ctx context.Context) error {
    // 启动事件路由器
    go func() {
        if err := s.router.Run(ctx); err != nil {
            logx.S().Errorf("Router error: %v", err)
        }
    }()

    // 发布事件示例
    event := UserCreatedEvent{ID: "123", Email: "test@example.com"}
    if err := eventbus.PublishEvent(ctx, s.publisher, event); err != nil {
        return err
    }

    return nil
}

func (s *Server) Stop() error {
    if err := s.router.Close(); err != nil {
        return err
    }
    return nil
}
```

## 8. 发布事件的高级选项

### 带元数据发布

```go
err := eventbus.PublishEvent(ctx, publisher, event,
    eventbus.WithMetadata(map[string]string{
        "trace_id": "abc123",
        "user_id":  "user-456",
    }),
)
```

### 自定义分区键

```go
err := eventbus.PublishEvent(ctx, publisher, event,
    eventbus.WithPartitionKey("tenant-123"),  // 根据租户 ID 分区
)
```

### 自定义消息 ID

```go
err := eventbus.PublishEvent(ctx, publisher, event,
    eventbus.WithMessageID("custom-message-id"),
)
```

## EventType 自动生成规则

当事件没有实现 `EventType()` 方法时，会自动从类型名生成：

- 类型名: `GrantsInvalidateCacheEvent`
- 去掉 "Event" 后缀: `GrantsInvalidateCache`
- 转换为 snake_case: `grants_invalidate_cache`
- 加上 topicKey 前缀: `access.grants_invalidate_cache`

最终 EventType: `"access.grants_invalidate_cache"`

## 下一步

- 了解 Topic 和 Partition 的使用：[USAGE_TOPIC.md](./USAGE_TOPIC.md)
- 查看完整配置选项：[USAGE_CONFIG.md](./USAGE_CONFIG.md)
