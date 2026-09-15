package connection

import (
	"context"
	"fmt"
	"nfxstorages/pkgs/health"
	"time"
)

var _ health.Resource = (*Connection)(nil)

// Name returns the Redis connection name for health check identification
func (r *Connection) Name() string {
	return r.options.Addr
}

// Check performs a health check on the Redis connection
func (r *Connection) Check(ctx context.Context) error {
	if r.client == nil {
		return fmt.Errorf("redis client not initialized")
	}
	ctx, cancel := context.WithTimeout(ctx, 1*time.Second)
	defer cancel()
	return r.client.Ping(ctx).Err()
}

// Recover attempts to recover the Redis connection
func (r *Connection) Recover() error {
	r.mu.Lock()
	defer r.mu.Unlock()

	_ = r.Close()
	return r.ConnectWithBackoff()
}
