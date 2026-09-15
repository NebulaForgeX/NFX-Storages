package cachex

import (
	"nfxstorages/pkgs/cachex/config"
	"nfxstorages/pkgs/cachex/core"
	"nfxstorages/pkgs/utils/id"
	"time"

	"github.com/redis/go-redis/v9"
)

type JSONCodec = config.JSONCodec
type MessagePackCodec = config.MessagePackCodec

type CacheConfig = config.CacheConfig

func NewBaseCache(client *redis.Client, codec config.Codec) BaseCache {
	return core.NewBaseCache(client, codec)
}

func NewEntityCache[T any, ID id.IDtype](base BaseCache, kb KeyBuilder, cfg CacheConfig) EntityCache[T, ID] {
	return core.NewEntityCache[T, ID](base, kb, cfg)
}

func NewListCache[ID id.IDtype](base BaseCache, kb KeyBuilder, cfg CacheConfig) ListCache[ID] {
	return core.NewListCache[ID](base, kb, cfg)
}

func NewIndexCache[ID id.IDtype](base BaseCache, kb KeyBuilder, cfg CacheConfig) IndexCache[ID] {
	return core.NewIndexCache[ID](base, kb, cfg)
}

func NewCounterCache[ID id.IDtype](base BaseCache, kb KeyBuilder) CounterCache[ID] {
	return core.NewCounterCache[ID](base, kb)
}

func NewKeyBuilder(prefix, ns string, version func() string) KeyBuilder {
	return core.NewKeyBuilder(prefix, ns, version)
}

func NewVerProvider(base BaseCache, ttl time.Duration) VersionProvider {
	return core.NewVerProvider(base, ttl)
}

// func CacheWrapperWithSWR[T any, R any](
// 	ctx context.Context,
// 	cache TypedCache[T],
// 	key string,
// 	options WrapperCacheOptions,
// 	fetchFromDB func(context.Context) (R, error),
// 	transformFromCache func(T) R,
// 	transformToCache func(R) T,
// ) (R, error) {
// 	// 1. 尝试从缓存获取
// 	cached, err := cache.Get(ctx, key)
// 	if err == nil {
// 		// 检查缓存是否过期
// 		ttl, ttlErr := cache.Base().TTL(ctx, key)
// 		if ttlErr == nil && ttl > 0 {
// 			// 缓存未过期，直接返回
// 			return transformFromCache(cached), nil
// 		} else if options.EnableSWR {
// 			// 缓存过期但启用 SWR，立即返回过期数据
// 			go func() {
// 				// 后台异步重新验证
// 				freshData, err := fetchFromDB(context.Background())
// 				if err == nil {
// 					cache.Set(context.Background(), key, transformToCache(freshData), options.getEffectiveTTL())
// 				}
// 			}()
// 			return transformFromCache(cached), nil
// 		}
// 	}

// 	// 2. 缓存未命中或 SWR 未启用，同步获取
// 	result, err := fetchFromDB(ctx)
// 	if err != nil {
// 		return result, err
// 	}

// 	// 3. 更新缓存
// 	go func() {
// 		cache.Set(context.Background(), key, transformToCache(result), options.getEffectiveTTL())
// 	}()

// 	return result, nil
// }
