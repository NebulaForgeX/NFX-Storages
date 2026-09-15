package postgresqlx

import (
	"context"
	"fmt"
	"nfxstorages/pkgs/logx"
	"nfxstorages/pkgs/retry"
	"sync"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Config struct {
	User             string           `koanf:"user"`
	Password         string           `koanf:"password"`
	Host             string           `koanf:"host"`
	Port             int              `koanf:"port"`
	DBName           string           `koanf:"dbname"`
	SSLMode          string           `koanf:"sslmode"`
	TimeZone         string           `koanf:"timezone"`
	LoggerLevel      string           `koanf:"logger_level"`
	AutoMigrate      bool             `koanf:"auto_migrate"`
	ConnectionConfig ConnectionConfig `koanf:"connection"`
}

type ConnectionConfig struct {
	Timeout            time.Duration `koanf:"timeout"`
	MaxOpenConnections int           `koanf:"max_open_connections"`
	MaxIdleConnections int           `koanf:"max_idle_connections"`
	ConnMaxIdleTime    time.Duration `koanf:"conn_max_idle_time"`
	ConnMaxLifetime    time.Duration `koanf:"conn_max_lifetime"`
	RetryInterval      time.Duration `koanf:"retry_interval"`
	MaxRetries         int           `koanf:"max_retries"`
}

type Connection struct {
	gormDB *gorm.DB
	dsn    string
	cfg    Config
	ctx    context.Context
	mu     sync.Mutex
}

// Init initializes a new PostgreSQL connection
func Init(ctx context.Context, postgresCfg Config, models ...any) (*Connection, error) {
	dbConn := &Connection{
		dsn: buildPostgresDSN(postgresCfg),
		cfg: postgresCfg,
		ctx: ctx,
	}

	logLevel := parseLogLevel(postgresCfg.LoggerLevel)
	gormCfg := &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	}

	if err := dbConn.connect(gormCfg); err != nil {
		return nil, err
	}

	if err := dbConn.setupConnectionPool(); err != nil {
		return nil, err
	}

	if postgresCfg.AutoMigrate && len(models) > 0 {
		if err := dbConn.gormDB.AutoMigrate(models...); err != nil {
			return nil, fmt.Errorf("auto migrate failed: %w", err)
		}
	}

	return dbConn, nil
}

func (c *Connection) connect(gormCfg *gorm.Config) error {
	var db *gorm.DB
	var err error

	retryFunc := func(ctx context.Context) (*gorm.DB, error) {
		db, err := gorm.Open(postgres.Open(c.dsn), gormCfg)
		if err != nil {
			logx.S().Warnf("Failed to connect to PostgreSQL: %v. Retrying...", err)
			return nil, err
		}
		sqlDB, err := db.DB()
		if err != nil {
			return nil, err
		}
		if err := sqlDB.Ping(); err != nil {
			return nil, err
		}
		return db, nil
	}

	db, err = retry.Retry(c.ctx, retryFunc, retry.Config{
		MaxTries:        uint(c.cfg.ConnectionConfig.MaxRetries),
		InitialInterval: c.cfg.ConnectionConfig.RetryInterval,
	})
	if err != nil {
		return fmt.Errorf("failed to connect to PostgreSQL after retries: %w", err)
	}

	c.gormDB = db
	logx.S().Infof("✅ Successfully connected to PostgreSQL: %s@%s:%d/%s", c.cfg.User, c.cfg.Host, c.cfg.Port, c.cfg.DBName)
	return nil
}

func (c *Connection) setupConnectionPool() error {
	sqlDB, err := c.gormDB.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	sqlDB.SetMaxOpenConns(c.cfg.ConnectionConfig.MaxOpenConnections)
	sqlDB.SetMaxIdleConns(c.cfg.ConnectionConfig.MaxIdleConnections)
	sqlDB.SetConnMaxIdleTime(c.cfg.ConnectionConfig.ConnMaxIdleTime)
	sqlDB.SetConnMaxLifetime(c.cfg.ConnectionConfig.ConnMaxLifetime)

	return nil
}

func (c *Connection) DB() *gorm.DB {
	return c.gormDB
}

func (c *Connection) Close() error {
	sqlDB, err := c.gormDB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

func buildPostgresDSN(cfg Config) string {
	sslMode := cfg.SSLMode
	if sslMode == "" {
		sslMode = "disable"
	}

	timeZone := cfg.TimeZone
	if timeZone == "" {
		timeZone = "UTC"
	}

	return fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%d sslmode=%s TimeZone=%s",
		cfg.Host,
		cfg.User,
		cfg.Password,
		cfg.DBName,
		cfg.Port,
		sslMode,
		timeZone,
	)
}

func parseLogLevel(level string) logger.LogLevel {
	switch level {
	case "silent":
		return logger.Silent
	case "error":
		return logger.Error
	case "warn":
		return logger.Warn
	case "info":
		return logger.Info
	default:
		return logger.Info
	}
}
