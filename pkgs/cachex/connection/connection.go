package connection

import (
	"context"
	"crypto/tls"
	"fmt"
	"nfxstorages/pkgs/logx"
	"nfxstorages/pkgs/retry"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

type Config struct {
	Host       string           `koanf:"host"`
	Port       int              `koanf:"port"`
	Password   string           `koanf:"password"`
	DB         int              `koanf:"db"` // Redis 数据库编号，0-15，可配置不用默认 0
	Connection ConnectionConfig `koanf:"connection"`
	TLS        TLSConfig        `koanf:"tls"`
}

type ConnectionConfig struct {
	DialTimeout   time.Duration `koanf:"dial_timeout"`
	WriteTimeout  time.Duration `koanf:"write_timeout"`
	ReadTimeout   time.Duration `koanf:"read_timeout"`
	MaxRetries    int           `koanf:"max_retries"`
	RetryInterval time.Duration `koanf:"retry_interval"`
}

type TLSConfig struct {
	Enabled    bool   `koanf:"enabled"`
	ServerName string `koanf:"server_name"`
}

type Connection struct {
	client  *redis.Client
	options *redis.Options
	cfg     Config
	ctx     context.Context
	mu      sync.Mutex
}

// Init initializes a new Redis connection
func Init(ctx context.Context, cacheCfg Config) (*Connection, error) {
	rConn := &Connection{
		options: &redis.Options{
			Addr:         fmt.Sprintf("%s:%d", cacheCfg.Host, cacheCfg.Port),
			Password:     cacheCfg.Password,
			DB:           cacheCfg.DB,
			DialTimeout:  cacheCfg.Connection.DialTimeout,
			ReadTimeout:  cacheCfg.Connection.ReadTimeout,
			WriteTimeout: cacheCfg.Connection.WriteTimeout,
		},
		cfg: cacheCfg,
		ctx: ctx,
	}

	if cacheCfg.TLS.Enabled {
		rConn.options.TLSConfig = &tls.Config{ServerName: cacheCfg.TLS.ServerName}
		logx.S().Infof("🔐 TLS enabled, ServerName: %s", cacheCfg.TLS.ServerName)
	}

	if err := rConn.ConnectWithBackoff(); err != nil {
		return nil, fmt.Errorf("failed to connect to redis: %w", err)
	}
	logx.S().Infof("✅ Successfully connected to Redis: %s", rConn.options.Addr)

	return rConn, nil
}

func (r *Connection) ConnectWithBackoff() error {
	return retry.RetryVoid(
		r.ctx,
		func(ctx context.Context) error {
			return r.open()
		},
		retry.Config{
			InitialInterval: r.cfg.Connection.RetryInterval,
			MaxInterval:     r.cfg.Connection.RetryInterval * 2,
			MaxTries:        uint(r.cfg.Connection.MaxRetries),
			Notify: func(err error, attempt uint, duration time.Duration) {
				logx.S().Warnf("Redis connection attempt failed in attempt %d: %v, retrying in %s", attempt, err, duration)
			},
		})
}

// Close closes the Redis connection
func (r *Connection) Close() error {
	if r.client != nil {
		r.client.Close()
		r.client = nil
	}
	return nil
}

// Client returns the Redis client instance
func (r *Connection) Client() *redis.Client {
	return r.client
}

// Options returns the Redis options
func (r *Connection) Options() *redis.Options {
	return r.options
}

// Config returns the Redis configuration
func (r *Connection) Config() Config {
	return r.cfg
}

// open establishes the actual Redis connection
func (r *Connection) open() error {
	client := redis.NewClient(r.options)
	_, err := client.Ping(r.ctx).Result()
	if err == nil {
		r.client = client
	}
	return err
}
