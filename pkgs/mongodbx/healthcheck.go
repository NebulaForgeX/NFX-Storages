package mongodbx

import (
	"context"
	"fmt"
	"time"

	"nfxstorages/pkgs/health"
)

var _ health.Resource = (*Client)(nil)

func (c *Client) Name() string {
	return c.cfg.Database
}

func (c *Client) Check(ctx context.Context) error {
	c.mu.Lock()
	client := c.client
	c.mu.Unlock()

	if client == nil {
		return fmt.Errorf("mongodb client not initialized")
	}

	timeout := c.cfg.PingTimeout
	if timeout <= 0 {
		timeout = time.Second
	}

	pingCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	return client.Ping(pingCtx, nil)
}

func (c *Client) Recover() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.client != nil {
		_ = c.client.Disconnect(context.Background())
		c.client = nil
		c.db = nil
	}

	return c.connect()
}
