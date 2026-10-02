package kafkax

import (
	"crypto/tls"
	"strings"
	"time"

	"github.com/IBM/sarama"
)

func BuildSaramaConfig(c *Config) (*sarama.Config, error) {
	sc := sarama.NewConfig()
	sc.Version = sarama.V3_6_0_0
	if c.ClientID != "" {
		sc.ClientID = c.ClientID
	}

	ConfigureProducer(sc, c.Producer)
	ConfigureConsumer(sc, c.Consumer)
	ConfigureNetwork(sc, c.Network)
	ConfigureSecurity(sc, c.Security)

	if err := sc.Validate(); err != nil {
		return nil, err
	}
	return sc, nil
}

func ConfigureProducer(sc *sarama.Config, p ProducerConfig) {
	switch strings.ToLower(p.Acks) {
	case "0":
		sc.Producer.RequiredAcks = sarama.NoResponse
	case "1":
		sc.Producer.RequiredAcks = sarama.WaitForLocal
	default: // "all"
		sc.Producer.RequiredAcks = sarama.WaitForAll
	}

	switch strings.ToLower(p.Compression) {
	case "gzip":
		sc.Producer.Compression = sarama.CompressionGZIP
	case "snappy":
		sc.Producer.Compression = sarama.CompressionSnappy
	case "lz4":
		sc.Producer.Compression = sarama.CompressionLZ4
	case "zstd":
		sc.Producer.Compression = sarama.CompressionZSTD
	default:
		sc.Producer.Compression = sarama.CompressionNone
	}

	if p.Retries > 0 {
		sc.Producer.Retry.Max = p.Retries
	}

	if p.BatchBytes > 0 {
		sc.Producer.Flush.Bytes = p.BatchBytes
	}

	if p.LingerMS > 0 {
		sc.Producer.Flush.Frequency = time.Duration(p.LingerMS) * time.Millisecond
	}

	sc.Producer.Return.Successes = true
	sc.Producer.Idempotent = p.Idempotent

	if p.Idempotent {
		sc.Net.MaxOpenRequests = 1
	}
}

func ConfigureConsumer(sc *sarama.Config, c ConsumerConfig) {
	switch strings.ToLower(c.InitialOffset) {
	case "earliest":
		sc.Consumer.Offsets.Initial = sarama.OffsetOldest
	default:
		sc.Consumer.Offsets.Initial = sarama.OffsetNewest
	}

	if c.SessionTimeoutMS > 0 {
		sc.Consumer.Group.Session.Timeout = time.Duration(c.SessionTimeoutMS) * time.Millisecond
	}

	if c.HeartbeatIntervalMS > 0 {
		sc.Consumer.Group.Heartbeat.Interval = time.Duration(c.HeartbeatIntervalMS) * time.Millisecond
	}

	if c.FetchMinBytes > 0 {
		sc.Consumer.Fetch.Min = int32(c.FetchMinBytes)
	}
	if c.FetchMaxBytes > 0 {
		sc.Consumer.Fetch.Default = int32(c.FetchMaxBytes)
	}

	sc.Consumer.Return.Errors = c.ReturnErrors
}

func ConfigureNetwork(sc *sarama.Config, n NetworkConfig) {
	if n.MaxOpenRequests > 0 {
		sc.Net.MaxOpenRequests = n.MaxOpenRequests
	}
}

func ConfigureSecurity(sc *sarama.Config, s SecurityConfig) {
	if !s.Enabled {
		return
	}

	// Open SASL
	sc.Net.SASL.Enable = true
	sc.Net.SASL.User = s.Username
	sc.Net.SASL.Password = s.Password

	// Configure SASL mechanism
	switch strings.ToUpper(s.Mechanism) {
	case "SCRAM-SHA-512":
		sc.Net.SASL.Mechanism = sarama.SASLTypeSCRAMSHA512
	case "SCRAM-SHA-256":
		sc.Net.SASL.Mechanism = sarama.SASLTypeSCRAMSHA256
	default:
		sc.Net.SASL.Mechanism = sarama.SASLTypePlaintext
	}

	// Enable TLS
	sc.Net.TLS.Enable = true
	sc.Net.TLS.Config = &tls.Config{
		InsecureSkipVerify: s.TLSInsecureSkipVerify,
	}
}
