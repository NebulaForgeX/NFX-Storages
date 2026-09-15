package eventbus

import (
	"context"

	"github.com/ThreeDotsLabs/watermill/message"
)

// BusSubscriber 事件总线订阅器。
// 封装了消息订阅器和主题解析器，提供主题键到主题名称的转换。
type BusSubscriber struct {
	sub           message.Subscriber
	topicResolver *TopicResolver
}

// NewSubscriber 创建新的事件总线订阅器。
//
// 参数:
//   - sub: 底层消息订阅器（如 Kafka 订阅器）
//   - topicResolver: 主题解析器，用于将主题键转换为实际主题名称
//
// 返回:
//   - *BusSubscriber: 事件总线订阅器实例
//
// 示例:
//
//	subscriber := eventbus.NewSubscriber(kafkaSubscriber, topicResolver)
func NewSubscriber(
	sub message.Subscriber,
	topicResolver *TopicResolver,
) *BusSubscriber {
	return &BusSubscriber{sub, topicResolver}
}

// Subscribe 订阅指定主题的消息。
//
// 参数:
//   - ctx: 上下文，用于控制订阅的生命周期
//   - topic: 主题名称（实际的主题名称，不是主题键）
//
// 返回:
//   - <-chan *message.Message: 消息通道
//   - error: 订阅失败时返回错误
//
// 示例:
//
//	messages, err := subscriber.Subscribe(ctx, "nfx-identity-access")
//	if err != nil {
//	    return err
//	}
//	for msg := range messages {
//	    // 处理消息
//	}
func (s *BusSubscriber) Subscribe(ctx context.Context, topic string) (<-chan *message.Message, error) {
	return s.sub.Subscribe(ctx, topic)
}

// Close 关闭订阅器。
// 释放所有资源并停止订阅。
//
// 返回:
//   - error: 关闭失败时返回错误
func (s *BusSubscriber) Close() error {
	return s.sub.Close()
}

// GetTopic 根据主题键获取主题名称。
//
// 参数:
//   - key: 主题键，例如 "access"
//
// 返回:
//   - string: 主题名称，如果找到
//   - bool: 是否找到对应的主题名称
//
// 示例:
//
//	topicName, ok := subscriber.GetTopic("access")
//	if ok {
//	    fmt.Println("Topic:", topicName) // 输出: "nfx-identity-access"
//	}
func (s *BusSubscriber) GetTopic(key TopicKey) (string, bool) {
	return s.topicResolver.GetName(key)
}
