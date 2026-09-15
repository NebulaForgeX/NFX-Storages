// Package eventbus 提供类型安全的事件总线功能。
//
// 核心功能:
//   - 类型化事件发布：基于泛型提供类型安全的事件发布
//   - 事件路由：根据事件类型自动路由到对应处理器
//   - 主题管理：通过 TopicResolver 管理主题键到主题名称的映射
//   - 事件验证：支持 Validatable 接口进行事件数据验证
//
// # 创建事件的多种方式
//
// ## 方式一：自动生成 EventType（推荐，最简洁）
//
// 只需要实现 TopicKey() 方法，EventType 会自动从类型名生成。
// 生成的规则：类型名去掉 "Event" 后缀，转换为 snake_case，加上 topicKey 前缀。
//
//	package access
//
//	import "nfxstorages/events"
//
//	// GrantsInvalidateCacheEvent 会自动生成 EventType: "access.grants_invalidate_cache"
//	type GrantsInvalidateCacheEvent struct {
//	    ID string `json:"id"`
//	}
//
//	func (GrantsInvalidateCacheEvent) TopicKey() events.TopicKey {
//	    return events.TKAccess
//	}
//
//	// 使用：直接创建结构体
//	event := access.GrantsInvalidateCacheEvent{ID: "grant-123"}
//
// ## 方式二：自定义 EventType
//
// 如果需要自定义 EventType，实现 EventType() 方法即可。
//
//	package custom
//
//	import "nfxstorages/events"
//
//	type UserCreatedEvent struct {
//	    UserID string `json:"user_id"`
//	    Name   string `json:"name"`
//	}
//
//	// 自定义 EventType
//	func (UserCreatedEvent) EventType() events.EventType {
//	    return "custom.user.created"  // 自定义的事件类型
//	}
//
//	func (UserCreatedEvent) TopicKey() events.TopicKey {
//	    return "custom"
//	}
//
//	// 使用：直接创建结构体
//	event := custom.UserCreatedEvent{
//	    UserID: "user-123",
//	    Name:   "John Doe",
//	}
//
// ## 方式三：使用 BaseEvent（可选，适用于需要动态设置 EventType 的场景）
//
//	package example
//
//	import (
//	    "nfxstorages/events"
//	    "nfxstorages/pkgs/kafkax/eventbus"
//	)
//
//	type DynamicEvent struct {
//	    eventbus.BaseEvent
//	    Data map[string]interface{} `json:"data"`
//	}
//
//	// 使用构造函数创建
//	event := DynamicEvent{
//	    BaseEvent: eventbus.NewEvent(
//	        "example.dynamic.event",
//	        "example",
//	    ),
//	    Data: map[string]interface{}{"key": "value"},
//	}
//
// # 发布事件
//
//	// 创建发布器
//	publisher := eventbus.NewBusPublisher(kafkaPublisher, topicResolver)
//
//	// 发布事件（自动生成 EventType）
//	event := access.GrantsInvalidateCacheEvent{ID: "grant-123"}
//	err := eventbus.PublishEvent(ctx, publisher, event)
//
//	// 发布事件（带元数据）
//	err := eventbus.PublishEvent(ctx, publisher, event,
//	    eventbus.WithMetadata(map[string]string{
//	        "trace_id": "abc123",
//	        "user_id":  "user-456",
//	    }),
//	)
//
//	// 发布事件（自定义消息 ID）
//	err := eventbus.PublishEvent(ctx, publisher, event,
//	    eventbus.WithMessageID("custom-message-id"),
//	)
//
// # 注册事件处理器
//
//	// 创建订阅器和路由器
//	subscriber := eventbus.NewSubscriber(kafkaSubscriber, topicResolver)
//	router, _ := eventbus.NewEventRouter(subscriber, eventbus.EventRouterConfig{
//	    CloseTimeout: 30 * time.Second,
//	    Logger:       logger,
//	})
//
//	// 注册处理器（自动生成 EventType 的事件）
//	eventbus.RegisterHandler(router, func(ctx context.Context, evt access.GrantsInvalidateCacheEvent, msg *message.Message) error {
//	    // 处理事件
//	    log.Printf("处理缓存清除事件: %s", evt.ID)
//	    return cache.Clear(evt.ID)
//	})
//
//	// 注册处理器（自定义 EventType 的事件）
//	eventbus.RegisterHandler(router, func(ctx context.Context, evt custom.UserCreatedEvent, msg *message.Message) error {
//	    // 处理事件
//	    log.Printf("用户创建: %s - %s", evt.UserID, evt.Name)
//	    return nil
//	})
//
//	// 启动路由器
//	go func() {
//	    if err := router.Run(ctx); err != nil {
//	        log.Fatal(err)
//	    }
//	}()
//
// # EventType 生成规则
//
// 当事件没有实现 EventType() 方法时，会自动从类型名生成：
//
//   - 类型名: GrantsInvalidateCacheEvent
//   - 去掉 "Event" 后缀: GrantsInvalidateCache
//   - 转换为 snake_case: grants_invalidate_cache
//   - 加上 topicKey 前缀: access.grants_invalidate_cache
//
// 最终 EventType: "access.grants_invalidate_cache"
package eventbus

import (
	"context"

	"github.com/ThreeDotsLabs/watermill/message"
)

// EventType 标识事件的唯一类型。
// 例如: "access.grants.invalidate_cache", "clients.apps.invalidate_cache"
type EventType = string

// EventHandler 处理特定类型的事件。
//
// 参数:
//   - ctx: 上下文，用于传递追踪信息、超时控制等
//   - evt: 事件对象，已反序列化的类型化事件
//   - msg: 原始消息，包含元数据和载荷
//
// 返回:
//   - error: 处理错误，如果返回非 nil，事件将被标记为失败
type EventHandler[T TypedEvent] func(ctx context.Context, evt T, msg *message.Message) error

// Validatable 可验证接口。
// 实现此接口的事件可以在处理前进行验证。
type Validatable interface {
	// Validate 验证事件数据的有效性。
	// 如果事件数据无效，返回错误。
	Validate() error
}

// TypedEvent 类型化事件接口。
// 所有事件都必须实现此接口，提供主题键。
// 如果事件实现了 CustomTypedEvent 接口（包含 EventType() 方法），则使用自定义的 EventType。
// 否则，EventType 会自动从类型名生成。
type TypedEvent interface {
	// TopicKey 返回事件所属的主题键。
	// 用于确定事件应该发布到哪个主题。
	TopicKey() TopicKey
}

// CustomTypedEvent 自定义类型化事件接口。
// 如果事件实现了此接口，EventTypeOf 会使用自定义的 EventType() 方法。
// 如果事件只实现了 TypedEvent（没有 EventType()），则自动生成 EventType。
type CustomTypedEvent interface {
	TypedEvent
	// EventType 返回事件的类型标识符。
	// 用于在消息路由时识别事件类型。
	EventType() EventType
}

// EventTypeOf 返回类型参数对应的 EventType。
// 使用泛型在编译时确定事件类型，无需创建实例。
//
// 行为:
//  1. 首先检查事件是否实现了 CustomTypedEvent 接口（有 EventType() 方法）
//  2. 如果实现了，使用自定义的 EventType() 方法
//  3. 如果没有实现，自动使用 AutoEventType 从类型名生成
//
// 示例:
//
//	// 方式一：用户实现 EventType() 方法（自定义）
//	type MyEvent struct { ID string }
//	func (MyEvent) EventType() EventType { return "custom.event.type" }
//	func (MyEvent) TopicKey() TopicKey { return "my_topic" }
//	eventType := eventbus.EventTypeOf[MyEvent]()  // 返回: "custom.event.type"
//
//	// 方式二：不实现 EventType()，自动生成（推荐，最简洁）
//	type MyEvent struct { ID string }
//	func (MyEvent) TopicKey() TopicKey { return "my_topic" }
//	// EventType() 会自动使用 AutoEventType 生成
//	eventType := eventbus.EventTypeOf[MyEvent]()  // 返回: "my_topic.my_event"
func EventTypeOf[T TypedEvent]() string {
	var zero T

	// 检查是否实现了 CustomTypedEvent 接口（有 EventType() 方法）
	if customEvent, ok := any(zero).(CustomTypedEvent); ok {
		eventType := customEvent.EventType()
		// 如果返回空字符串，也使用自动生成
		if eventType != "" {
			return eventType
		}
	}

	// 没有实现 EventType() 或返回空字符串，自动生成
	return string(AutoEventType[T]())
}

// TopicKeyOf 返回类型参数对应的 TopicKey。
// 使用泛型在编译时确定主题键，无需创建实例。
//
// 示例:
//
//	topicKey := eventbus.TopicKeyOf[access.GrantsInvalidateCacheEvent]()
//	// 返回: "access"
func TopicKeyOf[T TypedEvent]() TopicKey {
	var zero T
	return zero.TopicKey()
}

// BaseEvent 事件的基础结构体。
// 提供一种可选的方式来实现 TypedEvent 接口。
// 事件可以直接实现 EventType() 和 TopicKey() 方法，也可以嵌入 BaseEvent。
type BaseEvent struct {
	eventType EventType
	topicKey  TopicKey
}

// EventType 返回事件类型。
// 实现 TypedEvent 接口的方法。
func (e BaseEvent) EventType() EventType {
	return e.eventType
}

// TopicKey 返回主题键。
// 实现 TypedEvent 接口的方法。
func (e BaseEvent) TopicKey() TopicKey {
	return e.topicKey
}

// NewEvent 创建新事件。
// 提供一种可选的方式，类似于 Java 的构造函数，传入 eventType 和 topicKey 来创建基础事件。
//
// 参数:
//   - eventType: 事件类型，例如 "access.grants.invalidate_cache"
//   - topicKey: 主题键，例如 "access"
//
// 返回:
//   - BaseEvent: 实现了 TypedEvent 接口的基础事件
//
// 注意: 这是可选的方式之一。你也可以直接实现 EventType() 和 TopicKey() 方法，这样更简洁。
//
// 方式一 - 直接实现方法（推荐，更简洁）:
//
//	type GrantsInvalidateCacheEvent struct {
//	    ID string `json:"id"`
//	}
//
//	func (GrantsInvalidateCacheEvent) EventType() events.EventType {
//	    return events.ETGrantsInvalidateCache
//	}
//	func (GrantsInvalidateCacheEvent) TopicKey() events.TopicKey {
//	    return events.TKAccess
//	}
//
//	// 使用：直接创建结构体
//	event := access.GrantsInvalidateCacheEvent{ID: "grant-123"}
//
// 方式二 - 使用 BaseEvent 和构造函数（可选）:
//
//	type GrantsInvalidateCacheEvent struct {
//	    eventbus.BaseEvent
//	    ID string `json:"id"`
//	}
//
//	func NewGrantsInvalidateCacheEvent(id string) GrantsInvalidateCacheEvent {
//	    return GrantsInvalidateCacheEvent{
//	        BaseEvent: eventbus.NewEvent(
//	            events.ETGrantsInvalidateCache,
//	            events.TKAccess,
//	        ),
//	        ID: id,
//	    }
//	}
//
//	// 使用：通过构造函数创建
//	event := access.NewGrantsInvalidateCacheEvent("grant-123")
func NewEvent(eventType EventType, topicKey TopicKey) BaseEvent {
	return BaseEvent{
		eventType: eventType,
		topicKey:  topicKey,
	}
}
