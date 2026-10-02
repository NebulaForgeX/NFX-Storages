package kafkax

import (
	"fmt"
)

func (c *Config) Validate() error {
	if len(c.Brokers) == 0 {
		return fmt.Errorf("kafka brokers is empty")
	}

	if c.ClientID == "" {
		return fmt.Errorf("kafka client_id is empty")
	}

	if c.Consumer.GroupID == "" {
		return fmt.Errorf("kafka consumer.group_id is empty")
	}

	return nil
}
