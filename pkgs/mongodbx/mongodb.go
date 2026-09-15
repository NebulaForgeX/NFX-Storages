package mongodbx

import (
	"context"
	"fmt"
	"net"
	"strconv"
	"sync"
	"time"

	"nfxstorages/pkgs/logx"
	"nfxstorages/pkgs/retry"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Config struct {
	Host             string        `koanf:"host"`
	Port             int           `koanf:"port"`
	User             string        `koanf:"user"`
	Password         string        `koanf:"password"`
	AuthSource       string        `koanf:"auth_source"`
	Database         string        `koanf:"database"`
	MinPoolSize      uint64        `koanf:"min_pool_size"`
	MaxPoolSize      uint64        `koanf:"max_pool_size"`
	ConnectTimeout   time.Duration `koanf:"connect_timeout"`
	PingTimeout      time.Duration `koanf:"ping_timeout"`
	Retry            RetryConfig   `koanf:"retry"`
	ReadPreference   string        `koanf:"read_preference"`
	WriteConcern     string        `koanf:"write_concern"`
	RetryWrites      *bool         `koanf:"retry_writes"`
	RetryReads       *bool         `koanf:"retry_reads"`
	DirectConnection *bool         `koanf:"direct_connection"`
}

type RetryConfig struct {
	MaxRetries     int           `koanf:"max_retries"`
	InitialBackoff time.Duration `koanf:"initial_backoff"`
}

type Client struct {
	mu         sync.Mutex
	client     *mongo.Client
	db         *mongo.Database
	cfg        Config
	ctx        context.Context
	cancelFunc context.CancelFunc
}

func Init(ctx context.Context, cfg Config) (*Client, error) {
	if cfg.Host == "" {
		return nil, fmt.Errorf("mongodb host is required")
	}
	if cfg.Database == "" {
		return nil, fmt.Errorf("mongodb database is required")
	}

	ctx, cancel := context.WithCancel(ctx)
	mc := &Client{
		cfg:        cfg,
		ctx:        ctx,
		cancelFunc: cancel,
	}

	if err := mc.connect(); err != nil {
		cancel()
		return nil, err
	}

	return mc, nil
}

func (c *Client) connect() error {
	uri := buildMongoURI(c.cfg.Host, c.cfg.Port)
	opts := options.Client().ApplyURI(uri)

	if c.cfg.User != "" {
		auth := options.Credential{
			Username: c.cfg.User,
			Password: c.cfg.Password,
		}
		if c.cfg.AuthSource != "" {
			auth.AuthSource = c.cfg.AuthSource
		} else if c.cfg.Database != "" {
			auth.AuthSource = c.cfg.Database
		}
		opts.SetAuth(auth)
	}

	if c.cfg.MinPoolSize > 0 {
		opts.SetMinPoolSize(c.cfg.MinPoolSize)
	}
	if c.cfg.MaxPoolSize > 0 {
		opts.SetMaxPoolSize(c.cfg.MaxPoolSize)
	}
	if c.cfg.ConnectTimeout > 0 {
		opts.SetConnectTimeout(c.cfg.ConnectTimeout)
	}
	if c.cfg.RetryWrites != nil {
		opts.SetRetryWrites(*c.cfg.RetryWrites)
	}
	if c.cfg.RetryReads != nil {
		opts.SetRetryReads(*c.cfg.RetryReads)
	}
	if c.cfg.DirectConnection != nil {
		opts.SetDirect(*c.cfg.DirectConnection)
	}

	ctx := c.ctx
	if c.cfg.ConnectTimeout > 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, c.cfg.ConnectTimeout)
		defer cancel()
	}

	retryCfg := retry.Config{
		MaxTries:        uint(maxInt(c.cfg.Retry.MaxRetries, 3)),
		InitialInterval: c.cfg.Retry.InitialBackoff,
	}
	if retryCfg.InitialInterval <= 0 {
		retryCfg.InitialInterval = time.Second
	}

	client, err := retry.Retry(ctx, func(ctx context.Context) (*mongo.Client, error) {
		client, err := mongo.Connect(ctx, opts)
		if err != nil {
			logx.S().Warnf("Failed to connect to MongoDB: %v. Retrying...", err)
			return nil, err
		}
		pingCtx := ctx
		if c.cfg.PingTimeout > 0 {
			var cancel context.CancelFunc
			pingCtx, cancel = context.WithTimeout(ctx, c.cfg.PingTimeout)
			defer cancel()
		}
		if err := client.Ping(pingCtx, nil); err != nil {
			logx.S().Warnf("Failed to ping MongoDB: %v. Retrying...", err)
			return nil, err
		}
		return client, nil
	}, retryCfg)
	if err != nil {
		return fmt.Errorf("failed to connect to MongoDB after retries: %w", err)
	}

	c.mu.Lock()
	c.client = client
	c.db = client.Database(c.cfg.Database)
	c.mu.Unlock()

	logx.S().Infof("✅ Successfully connected to MongoDB: %s (db: %s)", uri, c.cfg.Database)
	return nil
}

func (c *Client) Database() *mongo.Database {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.db
}

func (c *Client) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.cancelFunc != nil {
		c.cancelFunc()
	}

	if c.client != nil {
		if err := c.client.Disconnect(context.Background()); err != nil {
			return err
		}
		c.client = nil
		c.db = nil
	}
	return nil
}

func buildMongoURI(host string, port int) string {
	h := host
	if h == "" {
		h = "localhost"
	}
	p := port
	if p == 0 {
		p = 27017
	}
	return fmt.Sprintf("mongodb://%s", net.JoinHostPort(h, strconv.Itoa(p)))
}

func maxInt(value, fallback int) int {
	if value <= 0 {
		return fallback
	}
	return value
}
