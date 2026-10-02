package eventbus

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/ThreeDotsLabs/watermill/message"
	"github.com/google/uuid"
)

// DefaultEventTypeHeaderKey 默认的事件类型元数据键。
// 用于在消息元数据中存储事件类型。
const DefaultEventTypeHeaderKey = "event_type"

// DefaultPartitionKey 默认的分区键。
// 用于消息分区。
const DefaultPartitionKey = "partition"

// PublishOption 发布选项函数类型。
// 用于配置消息发布时的各种选项。
type PublishOption func(*message.Message)

// WithMetadata 设置消息的元数据。
// 将提供的键值对添加到消息的元数据中。
//
// 参数:
//   - meta: 元数据键值对映射
//
// 示例:
//
//	eventbus.PublishEvent(ctx, publisher, event,
//	    eventbus.WithMetadata(map[string]string{
//	        "trace_id": "abc123",
//	        "user_id":  "user-456",
//	    }),
//	)
func WithMetadata(meta map[string]string) PublishOption {
	return func(m *message.Message) {
		for k, v := range meta {
			m.Metadata.Set(k, v)
		}
	}
}

// WithMessageID 设置消息的 ID。
// 如果不设置，将自动生成 UUID v7。
//
// 参数:
//   - id: 消息 ID 字符串
//
// 示例:
//
//	eventbus.PublishEvent(ctx, publisher, event,
//	    eventbus.WithMessageID("custom-message-id-123"),
//	)
func WithMessageID(id string) PublishOption {
	return func(m *message.Message) { m.UUID = id }
}

// WithPartitionKey 设置消息的分区键。
// 用于控制消息路由到哪个分区。
//
// 参数:
//   - pk: 分区键字符串
//
// 示例:
//
//	eventbus.PublishEvent(ctx, publisher, event,
//	    eventbus.WithPartitionKey("tenant-123"),
//	)
func WithPartitionKey(pk string) PublishOption {
	return func(m *message.Message) { m.Metadata.Set("partition_key", pk) }
}

// WithEventTypeHeaderKey 设置事件类型头键的自定义名称。
// 默认使用 DefaultEventTypeHeaderKey ("event_type")。
//
// 参数:
//   - key: 自定义的事件类型头键名称
//
// 示例:
//
//	eventbus.PublishEvent(ctx, publisher, event,
//	    eventbus.WithEventTypeHeaderKey("x-event-type"),
//	)
func WithEventTypeHeaderKey(key string) PublishOption {
	return func(m *message.Message) { m.Metadata.Set("__event_type_header_key__", key) }
}

// PublishEvent 发布类型化事件到事件总线。
// 自动序列化事件、设置事件类型头、生成消息 ID，并发布到对应的主题。
//
// 参数:
//   - ctx: 上下文，用于传递追踪信息等
//   - bp: 事件总线发布器
//   - evt: 要发布的事件对象，必须实现 TypedEvent 接口
//   - opts: 可选的发布选项，如 WithMetadata、WithMessageID 等
//
// 返回:
//   - error: 发布失败时返回错误
//
// 示例:
//
//	// 创建事件
//	event := access.NewGrantsInvalidateCacheEvent("grant-123")
//
//	// 发布事件
//	err := eventbus.PublishEvent(ctx, publisher, event)
//	if err != nil {
//	    log.Error("failed to publish event", err)
//	}
//
//	// 带选项发布
//	err := eventbus.PublishEvent(ctx, publisher, event,
//	    eventbus.WithMetadata(map[string]string{"trace_id": "abc123"}),
//	    eventbus.WithPartitionKey("tenant-123"),
//	)
func PublishEvent[T TypedEvent](
	ctx context.Context,
	bp *BusPublisher,
	evt T,
	opts ...PublishOption,
) error {
	topicName, ok := bp.GetTopic(TopicKeyOf[T]())
	if !ok || topicName == "" {
		return fmt.Errorf("eventbus: topic not found for event type %T", evt)
	}

	payload, err := json.Marshal(evt)
	if err != nil {
		return fmt.Errorf("eventbus: marshal failed: %w", err)
	}

	id, err := uuid.NewV7()
	if err != nil {
		return fmt.Errorf("eventbus: generate id failed: %w", err)
	}

	msg := message.NewMessageWithContext(ctx, id.String(), payload)
	for _, opt := range opts {
		opt(msg)
	}

	headerKey := msg.Metadata.Get("__event_type_header_key__")
	if headerKey == "" {
		headerKey = DefaultEventTypeHeaderKey
	}

	if msg.Metadata.Get(headerKey) == "" {
		msg.Metadata.Set(headerKey, EventTypeOf[T]())
	}

	return bp.Publish(topicName, msg)
}
