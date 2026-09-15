package kafkax

import (
	"nfxstorages/pkgs/kafkax/eventbus"
	"nfxstorages/pkgs/logx"

	wmKafka "github.com/ThreeDotsLabs/watermill-kafka/v3/pkg/kafka"
	"github.com/ThreeDotsLabs/watermill/message"
)

func NewPublisher(cfg *Config) (*eventbus.BusPublisher, error) {
	saramaConfig, err := BuildSaramaConfig(cfg)
	if err != nil {
		return nil, err
	}

	marshaler := wmKafka.NewWithPartitioningMarshaler(func(topic string, msg *message.Message) (string, error) {
		return msg.Metadata.Get(eventbus.DefaultPartitionKey), nil
	})

	logx.S().Infof("🔄 Initializing Kafka Publisher with brokers: %v", cfg.Brokers)
	pub, err := wmKafka.NewPublisher(wmKafka.PublisherConfig{
		Brokers:               cfg.Brokers,
		OverwriteSaramaConfig: saramaConfig,
		Marshaler:             marshaler,
	}, logx.NewZapWatermillLogger(logx.L()))
	if err != nil {
		logx.S().Errorf("❌ Failed to create Kafka Publisher: %v", err)
		return nil, err
	}

	topicResolver, err := eventbus.NewTopicResolver(cfg.ProducerTopics)
	if err != nil {
		logx.S().Errorf("❌ Failed to create topic resolver: %v", err)
		return nil, err
	}

	logx.S().Infof("✅ Successfully connected to Kafka Publisher: %v", cfg.Brokers)
	return eventbus.NewBusPublisher(pub, topicResolver), nil

}
