package eventbus

import (
	"github.com/ThreeDotsLabs/watermill/message"
)

// BusPublisher 事件总线发布器。
// 封装了消息发布器和主题解析器，提供主题键到主题名称的转换。
type BusPublisher struct {
	pub           message.Publisher
	topicResolver *TopicResolver
}

// NewBusPublisher 创建新的事件总线发布器。
//
// 参数:
//   - pub: 底层消息发布器（如 Kafka 发布器）
//   - topicResolver: 主题解析器，用于将主题键转换为实际主题名称
//
// 返回:
//   - *BusPublisher: 事件总线发布器实例
//
// 示例:
//
//	publisher := eventbus.NewBusPublisher(kafkaPublisher, topicResolver)
func NewBusPublisher(
	pub message.Publisher,
	topicResolver *TopicResolver,
) *BusPublisher {
	return &BusPublisher{pub, topicResolver}
}

// Publish 发布消息到指定主题。
//
// 参数:
//   - topic: 主题名称（实际的主题名称，不是主题键）
//   - msgs: 要发布的消息列表
//
// 返回:
//   - error: 发布失败时返回错误
//
// 注意: 通常使用 PublishEvent 函数来发布类型化事件，而不是直接调用此方法
func (p *BusPublisher) Publish(topic string, msgs ...*message.Message) error {
	return p.pub.Publish(topic, msgs...)
}

// Close 关闭发布器。
// 释放所有资源并停止发布。
//
// 返回:
//   - error: 关闭失败时返回错误
func (p *BusPublisher) Close() error {
	return p.pub.Close()
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
//	topicName, ok := publisher.GetTopic("access")
//	if ok {
//	    fmt.Println("Topic:", topicName) // 输出: "nfx-identity-access"
//	}
func (p *BusPublisher) GetTopic(key TopicKey) (string, bool) {
	return p.topicResolver.GetName(key)
}
