package postgresqlx

import (
	"context"
	"fmt"
	"nfxstorages/pkgs/health"
	"nfxstorages/pkgs/logx"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var _ health.Resource = (*Connection)(nil)

// Name returns the database name for health check identification
func (c *Connection) Name() string {
	return c.cfg.DBName
}

// Check performs a health check on the PostgreSQL connection
func (c *Connection) Check(ctx context.Context) error {
	if c.gormDB == nil {
		return fmt.Errorf("postgresql connection not initialized")
	}
	sqlDB, err := c.gormDB.DB()
	if err != nil {
		return fmt.Errorf("failed to get SQL DB: %w", err)
	}
	ctx, cancel := context.WithTimeout(ctx, 1*time.Second)
	defer cancel()
	return sqlDB.PingContext(ctx)
}

// Recover attempts to recover the PostgreSQL connection
func (c *Connection) Recover() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	logx.S().Warnf("🔁 Triggering DB recovery: %s", c.cfg.DBName)

	_ = c.Close()

	logLevel := parseLogLevel(c.cfg.LoggerLevel)
	gormCfg := &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	}

	err := c.connect(gormCfg)
	if err != nil {
		logx.S().Errorf("❌ DB reconnect failed: %v", err)
	} else {
		logx.S().Infof("✅ DB reconnect successful: %s", c.cfg.DBName)
	}
	return err
}
