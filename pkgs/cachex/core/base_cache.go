package core

import (
	"context"
	"fmt"
	"strings"
	"time"

	"nfxstorages/pkgs/cachex/config"
	"nfxstorages/pkgs/utils/typeutil"

	"github.com/redis/go-redis/v9"
	"golang.org/x/sync/errgroup"
)

type baseCache struct {
	client *redis.Client
	codec  config.Codec
}

// NewBaseCache creates a new cache instance
func NewBaseCache(client *redis.Client, codec config.Codec) BaseCache {
	if codec == nil {
		codec = &config.JSONCodec{}
	}
	return &baseCache{client: client, codec: codec}
}

func (c *baseCache) Client() *redis.Client {
	return c.client
}

func (c *baseCache) Codec() config.Codec {
	return c.codec
}

// =============================== Set ===============================
func (c *baseCache) Set(ctx context.Context, key string, value any, ttl time.Duration) error {
	if typeutil.IsNativeType(value) {
		return c.client.Set(ctx, key, value, ttl).Err()
	}
	data, err := c.codec.Encode(value)
	if err != nil {
		return fmt.Errorf("failed to encode value with %s codec: %w", c.codec.Name(), err)
	}
	return c.client.Set(ctx, key, data, ttl).Err()
}

// SetNX sets a value only if the key doesn't exist
func (c *baseCache) SetNX(ctx context.Context, key string, value any, ttl time.Duration) (bool, error) {
	if typeutil.IsNativeType(value) {
		return c.client.SetNX(ctx, key, value, ttl).Result()
	}
	data, err := c.codec.Encode(value)
	if err != nil {
		return false, fmt.Errorf("failed to encode value with %s codec: %w", c.codec.Name(), err)
	}
	return c.client.SetNX(ctx, key, data, ttl).Result()
}

// =============================== Get ===============================
func (c *baseCache) GetString(ctx context.Context, key string) (string, error) {
	return c.client.Get(ctx, key).Result()
}

func (c *baseCache) GetInt(ctx context.Context, key string) (int, error) {
	return c.client.Get(ctx, key).Int()
}

func (c *baseCache) GetInt64(ctx context.Context, key string) (int64, error) {
	return c.client.Get(ctx, key).Int64()
}

func (c *baseCache) GetUint64(ctx context.Context, key string) (uint64, error) {
	return c.client.Get(ctx, key).Uint64()
}

func (c *baseCache) GetFloat32(ctx context.Context, key string) (float32, error) {
	return c.client.Get(ctx, key).Float32()
}

func (c *baseCache) GetFloat64(ctx context.Context, key string) (float64, error) {
	return c.client.Get(ctx, key).Float64()
}

func (c *baseCache) GetBool(ctx context.Context, key string) (bool, error) {
	return c.client.Get(ctx, key).Bool()
}

func (c *baseCache) GetBytes(ctx context.Context, key string) ([]byte, error) {
	return c.client.Get(ctx, key).Bytes()
}

func (c *baseCache) GetStruct(ctx context.Context, key string, v any) error {
	data, err := c.client.Get(ctx, key).Bytes()
	if err != nil {
		return err
	}
	if err := c.codec.Decode(data, v); err != nil {
		return fmt.Errorf("failed to decode value with %s codec: %w", c.codec.Name(), err)
	}
	return nil
}

func (c *baseCache) Delete(ctx context.Context, key string) error {
	return c.client.Del(ctx, key).Err()
}

// Exists checks if a key exists in cache
func (c *baseCache) Exists(ctx context.Context, key string) (bool, error) {
	result, err := c.client.Exists(ctx, key).Result()
	if err != nil {
		return false, err
	}
	return result > 0, nil
}

func (c *baseCache) TTL(ctx context.Context, key string) (time.Duration, error) {
	return c.client.TTL(ctx, key).Result()
}

// Expire sets the expiration time for a key
func (c *baseCache) Expire(ctx context.Context, key string, ttl time.Duration) error {
	result, err := c.client.Expire(ctx, key, ttl).Result()
	if err != nil {
		return err
	}
	if !result {
		return fmt.Errorf("key %s does not exist", key)
	}
	return nil
}

// =============================== Counter ===============================

// Incr increments a key's value by 1
func (c *baseCache) Incr(ctx context.Context, key string) (int64, error) {
	return c.client.Incr(ctx, key).Result()
}

// IncrBy increments a key's value by the specified amount
func (c *baseCache) IncrBy(ctx context.Context, key string, value int64) (int64, error) {
	return c.client.IncrBy(ctx, key, value).Result()
}

// Decr decrements a key's value by 1
func (c *baseCache) Decr(ctx context.Context, key string) (int64, error) {
	return c.client.Decr(ctx, key).Result()
}

// DecrBy decrements a key's value by the specified amount
func (c *baseCache) DecrBy(ctx context.Context, key string, value int64) (int64, error) {
	return c.client.DecrBy(ctx, key, value).Result()
}

// =============================== Batch ===============================

// MGet retrieves multiple values from cache
func (c *baseCache) MGet(ctx context.Context, keys ...string) ([]any, error) {
	if len(keys) == 0 {
		return []any{}, nil
	}
	// Group by hash tag to avoid CROSSSLOT in cluster and enable per-slot parallelism
	groups := groupKeysByHashTag(keys)
	out := make([]any, len(keys))

	var g errgroup.Group
	g.SetLimit(8)

	for _, grp := range groups {
		g.Go(func() error {
			vals, err := c.client.MGet(ctx, grp.keys...).Result()
			if err != nil {
				return err
			}
			for i := range vals {
				if i < len(grp.indexes) {
					out[grp.indexes[i]] = vals[i]
				}
			}
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		return nil, err
	}
	return out, nil
}

func (c *baseCache) MSet(ctx context.Context, pairs map[string]any, ttl time.Duration) error {
	if len(pairs) == 0 {
		return nil
	}
	grouped := groupPairsByHashTag(pairs)

	var g errgroup.Group
	g.SetLimit(8)
	for _, kv := range grouped {
		g.Go(func() error {
			pipe := c.client.Pipeline()
			for k, v := range kv {
				if typeutil.IsNativeType(v) {
					pipe.Set(ctx, k, v, ttl)
				} else {
					b, err := c.codec.Encode(v)
					if err != nil {
						return err
					}
					pipe.Set(ctx, k, b, ttl)
				}
			}
			_, err := pipe.Exec(ctx)
			return err
		})
	}
	return g.Wait()
}

func (c *baseCache) MSetNX(ctx context.Context, pairs map[string]string, ttl time.Duration) error {
	if len(pairs) == 0 {
		return nil
	}
	grouped := groupPairsByHashTag(pairs)

	var g errgroup.Group
	g.SetLimit(8)
	for _, kv := range grouped {
		g.Go(func() error {
			pipe := c.client.Pipeline()
			for k, v := range kv {
				if typeutil.IsNativeType(v) {
					pipe.SetNX(ctx, k, v, ttl)
				} else {
					b, err := c.codec.Encode(v)
					if err != nil {
						return err
					}
					pipe.SetNX(ctx, k, b, ttl)
				}
			}
			_, err := pipe.Exec(ctx)
			return err
		})
	}
	return g.Wait()
}

// Clear removes all keys matching the pattern
func (c *baseCache) Clear(ctx context.Context, pattern string) error {
	iter := c.client.Scan(ctx, 0, pattern, 0).Iterator()
	for iter.Next(ctx) {
		if err := c.client.Del(ctx, iter.Val()).Err(); err != nil {
			return err
		}
	}
	return iter.Err()
}

// =============================== Hash ===============================

// SetHash sets multiple fields in a Redis hash
func (c *baseCache) SetHash(ctx context.Context, key string, fields map[string]any, ttl time.Duration) error {
	if len(fields) == 0 {
		return nil
	}

	err := c.client.HSet(ctx, key, fields).Err()
	if err != nil {
		return err
	}

	// Set TTL if specified
	if ttl > 0 {
		return c.client.Expire(ctx, key, ttl).Err()
	}
	return nil
}

func (c *baseCache) GetHash(ctx context.Context, key string) (map[string]string, error) {
	return c.client.HGetAll(ctx, key).Result()
}

func (c *baseCache) GetHashField(ctx context.Context, key, field string) (string, error) {
	return c.client.HGet(ctx, key, field).Result()
}

func (c *baseCache) SetHashField(ctx context.Context, key, field string, value any) error {
	return c.client.HSet(ctx, key, field, value).Err()
}

func (c *baseCache) DeleteHashField(ctx context.Context, key string, fields ...string) error {
	return c.client.HDel(ctx, key, fields...).Err()
}

func (c *baseCache) HashExists(ctx context.Context, key, field string) (bool, error) {
	return c.client.HExists(ctx, key, field).Result()
}

// =============================== Sub & Pub ===============================
func (c *baseCache) Subscribe(ctx context.Context, channels ...string) *redis.PubSub {
	return c.client.Subscribe(ctx, channels...)
}

func (c *baseCache) Publish(ctx context.Context, channel string, message any) error {
	return c.client.Publish(ctx, channel, message).Err()
}

// =============================== Helpers ===============================

type keyGroup struct {
	keys    []string
	indexes []int
}

// groupKeysByHashTag groups keys by Redis Cluster hash tag.
// Keys without a hash tag are isolated to avoid cross-slot batches.
func groupKeysByHashTag(keys []string) map[string]*keyGroup {
	groups := make(map[string]*keyGroup)
	for i, k := range keys {
		tag := extractHashTag(k)
		groupKey := tag
		if groupKey == "" {
			groupKey = "single:" + k
		}
		grp, ok := groups[groupKey]
		if !ok {
			grp = &keyGroup{keys: make([]string, 0, 4), indexes: make([]int, 0, 4)}
			groups[groupKey] = grp
		}
		grp.keys = append(grp.keys, k)
		grp.indexes = append(grp.indexes, i)
	}
	return groups
}

func groupPairsByHashTag[V any](pairs map[string]V) map[string]map[string]V {
	grouped := make(map[string]map[string]V)
	for k, v := range pairs {
		tag := extractHashTag(k)
		groupKey := tag
		if groupKey == "" {
			groupKey = "single:" + k
		}
		if _, ok := grouped[groupKey]; !ok {
			grouped[groupKey] = make(map[string]V)
		}
		grouped[groupKey][k] = v
	}
	return grouped
}

// extractHashTag returns the substring inside {...} if present; otherwise empty string.
func extractHashTag(key string) string {
	start := strings.IndexByte(key, '{')
	if start < 0 {
		return ""
	}
	end := strings.IndexByte(key[start+1:], '}')
	if end < 0 {
		return ""
	}
	return key[start+1 : start+1+end]
}
