package core

import (
	"context"
	"nfxstorages/pkgs/cachex/config"
	"nfxstorages/pkgs/utils/id"
	"time"

	"github.com/redis/go-redis/v9"
)

type BaseCache interface {
	Client() *redis.Client
	Codec() config.Codec

	// Basic operations
	Set(ctx context.Context, key string, value any, ttl time.Duration) error
	SetNX(ctx context.Context, key string, value any, ttl time.Duration) (bool, error)

	// Get operations for different types
	GetString(ctx context.Context, key string) (string, error)
	GetInt(ctx context.Context, key string) (int, error)
	GetInt64(ctx context.Context, key string) (int64, error)
	GetUint64(ctx context.Context, key string) (uint64, error)
	GetFloat32(ctx context.Context, key string) (float32, error)
	GetFloat64(ctx context.Context, key string) (float64, error)
	GetBool(ctx context.Context, key string) (bool, error)
	GetBytes(ctx context.Context, key string) ([]byte, error)
	GetStruct(ctx context.Context, key string, v any) error

	// Key management
	Delete(ctx context.Context, key string) error
	Exists(ctx context.Context, key string) (bool, error)
	TTL(ctx context.Context, key string) (time.Duration, error)
	Expire(ctx context.Context, key string, ttl time.Duration) error

	// Counter operations
	Incr(ctx context.Context, key string) (int64, error)
	IncrBy(ctx context.Context, key string, value int64) (int64, error)
	Decr(ctx context.Context, key string) (int64, error)
	DecrBy(ctx context.Context, key string, value int64) (int64, error)

	// Batch operations
	MGet(ctx context.Context, keys ...string) ([]any, error)
	MSet(ctx context.Context, pairs map[string]any, ttl time.Duration) error
	MSetNX(ctx context.Context, pairs map[string]string, ttl time.Duration) error
	Clear(ctx context.Context, pattern string) error

	// Hash operations
	SetHash(ctx context.Context, key string, fields map[string]any, ttl time.Duration) error
	GetHash(ctx context.Context, key string) (map[string]string, error)
	GetHashField(ctx context.Context, key, field string) (string, error)
	SetHashField(ctx context.Context, key, field string, value any) error
	DeleteHashField(ctx context.Context, key string, fields ...string) error
	HashExists(ctx context.Context, key, field string) (bool, error)

	// Sub & Pub
	Subscribe(ctx context.Context, channels ...string) *redis.PubSub
	Publish(ctx context.Context, channel string, message any) error
}

// EntityCache is a higher-level cache specialized for entities by ID with batch support
// ID can be either string or uuid.UUID
type EntityCache[T any, ID id.IDtype] interface {
	Base() BaseCache
	KeyBuilder() KeyBuilder

	Get(ctx context.Context, key string) (T, error)
	// Invalidate deletes cache for the specific entity ID, including negative-cache key when enabled
	Invalidate(ctx context.Context, id ID) error

	// GetOrLoad fetches by ID with internal key building and optional overrides
	GetOrLoad(
		ctx context.Context,
		id ID,
		fetch func(context.Context, ID) (*T, error),
		opts ...config.CacheCallOption,
	) (*T, error)

	// MGetOrLoad fetches a batch of IDs in one round-trip and backfills cache
	// Returns a map aligned by ID with found entities. Missing IDs are omitted.
	MGetOrLoad(
		ctx context.Context,
		ids []ID,
		fetch func(context.Context, []ID) ([]T, error),
		idOf func(*T) ID,
		opts ...config.CacheCallOption,
	) (map[ID]*T, error)
}

// ListCache caches lists of IDs with optional pagination metadata.
// It owns a KeyBuilder so callers don't need to assemble cache keys.
// ID can be either string or uuid.UUID
type ListCache[ID id.IDtype] interface {
	Base() BaseCache
	KeyBuilder() KeyBuilder

	// GetIDsOrLoad fetches a named list of IDs (key: KeyBuilder.List(name))
	GetIDsOrLoad(
		ctx context.Context,
		name string,
		fetch func(context.Context) ([]ID, error),
		opts ...config.CacheCallOption,
	) ([]ID, error)

	// GetPageIDsOrLoad fetches paginated IDs with total count (key: KeyBuilder.PageIDs(page,size))
	GetPageIDsOrLoad(
		ctx context.Context,
		page, size int,
		fetch func(context.Context) ([]ID, int64, error),
		opts ...config.CacheCallOption,
	) ([]ID, int64, error)

	// InvalidateList deletes a specific named list key
	InvalidateList(ctx context.Context, name string) error
	// InvalidatePage deletes a specific page key
	InvalidatePage(ctx context.Context, page, size int) error
}

// IndexCache caches an index (unique) that maps to an entity ID.
// It owns a KeyBuilder so callers don't need to assemble cache keys.
// ID can be either string or uuid.UUID
type IndexCache[ID id.IDtype] interface {
	Base() BaseCache
	KeyBuilder() KeyBuilder
	// GetIDByIndexOrLoad fetches an ID by index type/value (key: KeyBuilder.Index(type,value))
	GetIDByIndexOrLoad(
		ctx context.Context,
		indexType, value string,
		fetchID func(context.Context, string) (ID, error),
		opts ...config.CacheCallOption,
	) (ID, error)

	// Invalidate deletes a specific index key
	Invalidate(ctx context.Context, indexType, value string) error
}

// CounterCache provides increment/get/reset and scan-and-consume utilities for counters
// ID can be either string or uuid.UUID
type CounterCache[ID id.IDtype] interface {
	Base() BaseCache
	KeyBuilder() KeyBuilder

	Incr(ctx context.Context, name string, id ID) (int64, error)
	IncrBy(ctx context.Context, name string, id ID, delta int64) (int64, error)
	Get(ctx context.Context, name string, id ID) (int64, error)
	GetAndReset(ctx context.Context, name string, id ID) (int64, error)
	Reset(ctx context.Context, name string, id ID) error

	// Pattern returns the SCAN pattern for a given counter name
	Pattern(name string) string

	// ScanAndConsume scans keys by name with SCAN COUNT and consumes them in batches using GETDEL
	// count: hint for SCAN COUNT per iteration (e.g., 1000)
	// batchSize: number of keys per pipeline execution (e.g., 500)
	// consume: callback invoked for each (id, delta) pair
	ScanAndConsume(
		ctx context.Context,
		name string,
		count int64,
		batchSize int,
		consume func(id ID, delta int64),
	) error
}

type KeyBuilder interface {
	Entity(id string) string
	EntityNil(id string) string
	Index(indexType, value string) string
	List(name string) string
	PageIDs(page, size int) string
	ListWithFilter(name string, normalizedParts []string) string
	Counter(name, id string) string
	CounterPattern(name string) string
	GetIDFromCounterKey(key string, name string) (string, bool)
}

type VersionProvider interface {
	Get(prefix, ns, suffix string) string
	RunInvalidator(ctx context.Context) error
	Bump(ctx context.Context, prefix, ns, suffix string) error
}
