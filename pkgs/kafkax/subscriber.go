package kafkax

import (
	"nfxstorages/pkgs/kafkax/eventbus"
	"nfxstorages/pkgs/logx"

	"github.com/IBM/sarama"
	wmKafka "github.com/ThreeDotsLabs/watermill-kafka/v3/pkg/kafka"
)

func NewSubscriber(cfg *Config) (*eventbus.BusSubscriber, error) {
	saramaConfig, err := BuildSaramaConfig(cfg)
	if err != nil {
		return nil, err
	}

	logx.S().Infof("🔄 Initializing Kafka Subscriber with brokers: %v (group: %s)", cfg.Brokers, cfg.Consumer.GroupID)
	sub, err := wmKafka.NewSubscriber(
		wmKafka.SubscriberConfig{
			Brokers:               cfg.Brokers,
			ConsumerGroup:         cfg.Consumer.GroupID,
			OverwriteSaramaConfig: saramaConfig,
			Unmarshaler:           wmKafka.DefaultMarshaler{},
			InitializeTopicDetails: &sarama.TopicDetail{ //  Automatically create topic
				NumPartitions:     3,
				ReplicationFactor: 1,
			},
		},
		logx.NewZapWatermillLogger(logx.L()),
	)
	if err != nil {
		logx.S().Errorf("❌ Failed to create Kafka Subscriber: %v", err)
		return nil, err
	}

	topicResolver, err := eventbus.NewTopicResolver(cfg.ConsumerTopics)
	if err != nil {
		logx.S().Errorf("❌ Failed to create topic resolver: %v", err)
		return nil, err
	}

	logx.S().Infof("✅ Successfully connected to Kafka Subscriber: %v (group: %s)", cfg.Brokers, cfg.Consumer.GroupID)
	return eventbus.NewSubscriber(sub, topicResolver), nil
}
