package ratelimit

import (
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/limiter"
	"github.com/gofiber/storage/redis/v3"
)

// RateLimiterConfig holds the configuration for rate limiting
type RateLimiterConfig struct {
	Max        int
	Expiration time.Duration
	Storage    fiber.Storage

	// Optional configurations
	SkipIPs      []string
	KeyGenerator func(c fiber.Ctx) string
	LimitReached func(c fiber.Ctx) error
	LimiterType  limiter.Handler
}

// RateLimiterOption is a function that modifies RateLimiterConfig
type RateLimiterOption func(*RateLimiterConfig)

// WithMax sets the maximum number of requests
func WithMax(max int) RateLimiterOption {
	return func(cfg *RateLimiterConfig) {
		cfg.Max = max
	}
}

// WithExpiration sets the expiration time for rate limiting
func WithExpiration(expiration time.Duration) RateLimiterOption {
	return func(cfg *RateLimiterConfig) {
		cfg.Expiration = expiration
	}
}

// WithStorage sets the storage backend for rate limiting
func WithStorage(storage fiber.Storage) RateLimiterOption {
	return func(cfg *RateLimiterConfig) {
		cfg.Storage = storage
	}
}

// WithRedisStorage sets Redis as the storage backend
func WithRedisStorage(host string, port int, password string) RateLimiterOption {
	return func(cfg *RateLimiterConfig) {
		cfg.Storage = redis.New(redis.Config{
			Host:     host,
			Port:     port,
			Password: password,
		})
	}
}

// WithSkipIPs sets IP addresses that should skip rate limiting
func WithSkipIPs(ips ...string) RateLimiterOption {
	return func(cfg *RateLimiterConfig) {
		cfg.SkipIPs = ips
	}
}

// WithKeyGenerator sets a custom key generator function
func WithKeyGenerator(generator func(c fiber.Ctx) string) RateLimiterOption {
	return func(cfg *RateLimiterConfig) {
		cfg.KeyGenerator = generator
	}
}

// WithLimitReached sets a custom limit reached handler
func WithLimitReached(handler func(c fiber.Ctx) error) RateLimiterOption {
	return func(cfg *RateLimiterConfig) {
		cfg.LimitReached = handler
	}
}

// WithLimiterType sets the type of limiter to use
func WithLimiterType(limiterType limiter.Handler) RateLimiterOption {
	return func(cfg *RateLimiterConfig) {
		cfg.LimiterType = limiterType
	}
}

// RateLimiterMiddleware creates a new rate limiter middleware with the given options
func RateLimiterMiddleware(opts ...RateLimiterOption) fiber.Handler {
	// Default configuration
	cfg := &RateLimiterConfig{
		Max:          200,
		Expiration:   1 * time.Minute,
		Storage:      limiter.ConfigDefault.Storage,
		SkipIPs:      []string{"127.0.0.1"},
		LimiterType:  limiter.SlidingWindow{},
		KeyGenerator: defaultKeyGenerator,
		LimitReached: defaultLimitReached,
	}

	// Apply options
	for _, opt := range opts {
		opt(cfg)
	}

	return limiter.New(limiter.Config{
		Next: func(c fiber.Ctx) bool {
			return shouldSkip(c.IP(), cfg.SkipIPs)
		},
		Max:               cfg.Max,
		Expiration:        cfg.Expiration,
		KeyGenerator:      cfg.KeyGenerator,
		LimitReached:      cfg.LimitReached,
		LimiterMiddleware: cfg.LimiterType,
		Storage:           cfg.Storage,
	})
}

// defaultKeyGenerator generates keys based on IP address with X-Forwarded-For support
func defaultKeyGenerator(c fiber.Ctx) string {
	forwarded := c.Get("X-Forwarded-For")
	if forwarded != "" {
		ips := strings.Split(forwarded, ",")
		return strings.TrimSpace(ips[0])
	}
	return c.IP()
}

// defaultLimitReached is the default handler when rate limit is reached
func defaultLimitReached(c fiber.Ctx) error {
	return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
		"message": "Too many requests",
	})
}

// shouldSkip checks if the given IP should skip rate limiting
func shouldSkip(ip string, skipIPs []string) bool {
	for _, skipIP := range skipIPs {
		if ip == skipIP {
			return true
		}
	}
	return false
}
