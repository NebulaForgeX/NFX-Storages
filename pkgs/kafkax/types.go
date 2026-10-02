package kafkax

import "nfxstorages/pkgs/kafkax/eventbus"

type Config struct {
	Brokers        []string                     `koanf:"brokers"`
	ClientID       string                       `koanf:"client_id"`
	Producer       ProducerConfig               `koanf:"producer"`
	Consumer       ConsumerConfig               `koanf:"consumer"`
	Network        NetworkConfig                `koanf:"network"`
	Security       SecurityConfig               `koanf:"security"`
	ProducerTopics map[eventbus.TopicKey]string `koanf:"producer_topics"`
	ConsumerTopics map[eventbus.TopicKey]string `koanf:"consumer_topics"`
}

type ProducerConfig struct {
	Acks        string `koanf:"acks"`
	Compression string `koanf:"compression"`
	Retries     int    `koanf:"retries"`
	BatchBytes  int    `koanf:"batch_bytes"`
	LingerMS    int    `koanf:"linger_ms"`
	Idempotent  bool   `koanf:"idempotent"`
}

type ConsumerConfig struct {
	GroupID             string `koanf:"group_id"`
	InitialOffset       string `koanf:"initial_offset"`
	SessionTimeoutMS    int    `koanf:"session_timeout_ms"`
	HeartbeatIntervalMS int    `koanf:"heartbeat_interval_ms"`
	FetchMinBytes       int    `koanf:"fetch_min_bytes"`
	FetchMaxBytes       int    `koanf:"fetch_max_bytes"`
	ReturnErrors        bool   `koanf:"return_errors"`
}

type NetworkConfig struct {
	MaxOpenRequests int `koanf:"max_open_requests"`
}

type SecurityConfig struct {
	Enabled               bool   `koanf:"enabled"`
	Mechanism             string `koanf:"mechanism"` // PLAIN/SCRAM-*
	Username              string `koanf:"username"`
	Password              string `koanf:"password"`
	TLSInsecureSkipVerify bool   `koanf:"tls_insecure_skip_verify"`
}
