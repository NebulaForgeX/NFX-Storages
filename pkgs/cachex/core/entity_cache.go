package core

import (
	"context"
	"crypto/sha1"
	"fmt"
	"maps"
	"nfxstorages/pkgs/cachex/config"
	"nfxstorages/pkgs/utils/id"
	"nfxstorages/pkgs/utils/slice"
	"sort"
	"strings"

	"golang.org/x/sync/singleflight"
)

type entityCache[T any, ID id.IDtype] struct {
	base      BaseCache
	kb        KeyBuilder
	cfg       config.CacheConfig
	converter id.IDConverter[ID]
	sf        singleflight.Group
}

func NewEntityCache[T any, ID id.IDtype](base BaseCache, kb KeyBuilder, cfg config.CacheConfig) EntityCache[T, ID] {
	return &entityCache[T, ID]{
		base:      base,
		kb:        kb,
		cfg:       cfg,
		converter: id.NewIDConverter[ID](),
	}
}

func (e *entityCache[T, ID]) Base() BaseCache            { return e.base }
func (e *entityCache[T, ID]) KeyBuilder() KeyBuilder     { return e.kb }
func (e *entityCache[T, ID]) Config() config.CacheConfig { return e.cfg }

func (e *entityCache[T, ID]) Get(ctx context.Context, key string) (T, error) {
	var zero T
	var v any
	var err error
	baseCache := e.base

	// Attempt direct retrieval for native types first.
	// We use type switches on zero to select the correct helper.
	switch any(zero).(type) {
	case string:
		v, err = baseCache.GetString(ctx, key)
	case int:
		v, err = baseCache.GetInt(ctx, key)
	case int64:
		v, err = baseCache.GetInt64(ctx, key)
	case uint64:
		v, err = baseCache.GetUint64(ctx, key)
	case float32:
		v, err = baseCache.GetFloat32(ctx, key)
	case float64:
		v, err = baseCache.GetFloat64(ctx, key)
	case bool:
		v, err = baseCache.GetBool(ctx, key)
	case []byte:
		v, err = baseCache.GetBytes(ctx, key)
	default:
		// For struct / slice / map etc. use codec decoding
		var dest T
		if err := baseCache.GetStruct(ctx, key, &dest); err != nil {
			return zero, err
		}
		return dest, nil
	}

	if err != nil {
		return zero, err
	}

	return any(v).(T), nil
}

// Invalidate deletes the entity and its negative cache (if enabled)
func (e *entityCache[T, ID]) Invalidate(ctx context.Context, id ID) error {
	var firstErr error
	if err := e.base.Delete(ctx, e.buildKey(id)); err != nil {
		firstErr = err
	}
	if e.cfg.IsNegativeCacheEnabled() {
		if err := e.base.Delete(ctx, e.buildNilKey(id)); err != nil && firstErr == nil {
			firstErr = err
		}
	}
	return firstErr
}

func (e *entityCache[T, ID]) MGet(ctx context.Context, keys []string) ([]*T, error) {
	raw, err := e.base.MGet(ctx, keys...)
	if err != nil {
		return nil, err
	}

	results := make([]*T, len(keys))
	for i, val := range raw {
		if val == nil {
			continue
		}
		if ent, ok := e.decodeFromMGet(val); ok {
			results[i] = ent
			continue
		}
		// Fallback: one extra GET via typed cache to ensure correct codec/type
		if entV, err := e.Get(ctx, keys[i]); err == nil {
			results[i] = &entV
		}
	}
	return results, nil
}

// GetOrLoad implements single-entity get or load with singleflight and optional negative cache
func (e *entityCache[T, ID]) GetOrLoad(
	ctx context.Context,
	id ID,
	fetch func(context.Context, ID) (*T, error),
	opts ...config.CacheCallOption,
) (*T, error) {
	cfg := e.cfg
	for _, opt := range opts {
		opt(&cfg)
	}

	// Evaluate bypass flags
	bypassRead := cfg.BypassRead
	bypassWrite := cfg.BypassWrite

	key := e.buildKey(id)
	nilKey := e.buildNilKey(id)

	// Bypass read path, but optionally write back
	if bypassRead {
		ent, err := fetch(ctx, id)
		if err != nil {
			// Handle not found errors - treat as cacheable not found based on matcher
			if cfg.IsNotFound(err) {
				if !bypassWrite {
					e.setNil(ctx, id)
				}
				return nil, ErrNotFound
			}
			return nil, err
		}
		if ent == nil {
			if !bypassWrite {
				e.setNil(ctx, id)
			}
			return nil, ErrNotFound
		}
		if !bypassWrite {
			_ = e.base.Set(ctx, key, *ent, e.cfg.EffectiveTTL())
		}
		return ent, nil
	}

	// Try to get from cache first
	if v, err := e.Get(ctx, key); err == nil {
		return &v, nil
	}

	// Check negative cache
	if e.cfg.IsNegativeCacheEnabled() {
		if s, err := e.base.GetString(ctx, nilKey); err == nil && s == "1" {
			return nil, ErrNotFound
		}
	}

	// singleflight per key
	v, err, _ := e.sf.Do(key, func() (any, error) {
		// Recheck cache inside flight
		if v2, err2 := e.Get(ctx, key); err2 == nil {
			return &v2, nil
		}

		// Recheck negative cache inside flight
		if e.cfg.IsNegativeCacheEnabled() {
			if s, err := e.base.GetString(ctx, nilKey); err == nil && s == "1" {
				return nil, ErrNotFound
			}
		}

		// Fetch from source
		ent, err := fetch(ctx, id)
		if err != nil {
			// Handle not found errors - treat as cacheable not found based on matcher
			if cfg.IsNotFound(err) {
				if !bypassWrite {
					e.setNil(ctx, id)
				}
				return nil, ErrNotFound
			}
			return nil, err
		}

		if ent == nil {
			// Treat as not found; prefer SETNX with jittered TTL to avoid races
			if !bypassWrite {
				e.setNil(ctx, id)
			}
			return nil, ErrNotFound
		}

		// Cache the entity
		if !bypassWrite {
			_ = e.base.Set(ctx, key, *ent, e.cfg.EffectiveTTL())
		}

		return ent, nil
	})

	if err != nil {
		return nil, err
	}
	return v.(*T), nil
}

// MGetOrLoad performs batch MGET and backfills missing via a single batch fetch
func (e *entityCache[T, ID]) MGetOrLoad(
	ctx context.Context,
	ids []ID,
	fetch func(context.Context, []ID) ([]T, error),
	idOf func(*T) ID,
	opts ...config.CacheCallOption,
) (map[ID]*T, error) {
	if len(ids) == 0 {
		return make(map[ID]*T), nil
	}

	cfg := e.cfg
	for _, opt := range opts {
		opt(&cfg)
	}

	// Deduplicate input IDs to reduce round-trips and source load
	ids = slice.Deduplicate(ids)

	// Bypass read path, but optionally write back and negative cache
	if cfg.BypassRead {
		itemsFetched, err := fetch(ctx, ids)
		if err != nil {
			return nil, err
		}

		if !cfg.BypassWrite {
			if err := e.writeBack(ctx, ids, itemsFetched, idOf); err != nil {
				return nil, err
			}
		}

		result := make(map[ID]*T, len(itemsFetched))
		for i := range itemsFetched {
			result[idOf(&itemsFetched[i])] = &itemsFetched[i]
		}
		return result, nil
	}

	// Try MGET for both entity keys and nil keys
	items, err := e.MGet(ctx, e.keysOf(ids))
	if err != nil {
		return nil, err
	}

	result, missingIDs := e.toFilledMapAndMissingIDs(ids, items)
	if len(missingIDs) == 0 {
		return result, nil
	}

	if e.cfg.IsNegativeCacheEnabled() {
		if filtered, err := e.filterByNegativeCache(ctx, missingIDs); err == nil {
			if len(filtered) == 0 {
				return result, nil
			}
			missingIDs = filtered
		}
	}

	// singleflight by normalized hash key of missing ids to avoid stampede
	flightKey := e.sfKeyOf(missingIDs)
	v, loadErr, _ := e.sf.Do(flightKey, func() (any, error) {
		// Double-check cache before fetching to reduce source load
		items2, _ := e.MGet(ctx, e.keysOf(missingIDs))

		filled, stillMissing := e.toFilledMapAndMissingIDs(missingIDs, items2)
		if len(stillMissing) == 0 {
			return filled, nil
		}

		if e.cfg.IsNegativeCacheEnabled() {
			if filtered, err := e.filterByNegativeCache(ctx, stillMissing); err == nil {
				if len(filtered) == 0 {
					return filled, nil
				}
				stillMissing = filtered
			}
		}

		// Fetch missing items
		itemsFetched, err := fetch(ctx, stillMissing)
		if err != nil {
			return nil, err
		}

		if !cfg.BypassWrite {
			if err := e.writeBack(ctx, stillMissing, itemsFetched, idOf); err != nil {
				return nil, err
			}
		}

		for i := range itemsFetched {
			id := idOf(&itemsFetched[i])
			filled[id] = &itemsFetched[i]
		}
		return filled, nil
	})
	if loadErr != nil {
		return result, loadErr
	}

	if v != nil {
		maps.Copy(result, v.(map[ID]*T))
	}

	return result, nil
}

func (e *entityCache[T, ID]) toFilledMapAndMissingIDs(ids []ID, items []*T) (map[ID]*T, []ID) {
	filled := make(map[ID]*T, len(ids))
	missingIDs := make([]ID, 0, len(ids))
	for i, item := range items {
		id := ids[i]
		if item != nil {
			filled[id] = item
		} else {
			missingIDs = append(missingIDs, id)
		}
	}
	return filled, missingIDs
}

func (e *entityCache[T, ID]) filterByNegativeCache(ctx context.Context, ids []ID) ([]ID, error) {
	if len(ids) == 0 {
		return ids, nil
	}
	nilKeys := e.nilKeysOf(ids)
	nilResults, err := e.base.MGet(ctx, nilKeys...)
	if err != nil {
		return nil, err
	}
	out := make([]ID, 0, len(ids))
	for i, v := range nilResults {
		if !isNilMark(v) {
			out = append(out, ids[i])
		}
	}
	return out, nil
}

func isNilMark(v any) bool {
	switch x := v.(type) {
	case string:
		return x == "1"
	case []byte:
		return string(x) == "1"
	default:
		return false
	}
}

// setNil writes a negative cache marker with jittered TTL using SetNX
func (e *entityCache[T, ID]) setNil(ctx context.Context, id ID) {
	if !e.cfg.IsNegativeCacheEnabled() {
		return
	}
	_, _ = e.base.SetNX(ctx, e.buildNilKey(id), "1", e.cfg.EffectiveNegativeTTL())
}

func (e *entityCache[T, ID]) writeBack(ctx context.Context, ids []ID, items []T, idOf func(*T) ID) error {
	found := make(map[ID]struct{}, len(items))
	for _, item := range items {
		found[idOf(&item)] = struct{}{}
	}
	// Backfill positives
	kv := make(map[string]any, len(items))
	for _, item := range items {
		kv[e.buildKey(idOf(&item))] = item
	}
	if err := e.base.MSet(ctx, kv, e.cfg.EffectiveTTL()); err != nil {
		return err
	}
	// Backfill negatives for missing
	if e.cfg.IsNegativeCacheEnabled() {
		miss := make(map[string]string, len(ids))
		for _, id := range ids {
			if _, ok := found[id]; !ok {
				miss[e.buildNilKey(id)] = "1"
			}
		}
		if err := e.base.MSetNX(ctx, miss, e.cfg.EffectiveNegativeTTL()); err != nil {
			return err
		}
	}
	return nil
}

func (e *entityCache[T, ID]) buildKey(id ID) string {
	return e.kb.Entity(e.converter.ToString(id))
}

func (e *entityCache[T, ID]) buildNilKey(id ID) string {
	return e.kb.EntityNil(e.converter.ToString(id))
}

// keysOf builds entity keys for a list of IDs
func (e *entityCache[T, ID]) keysOf(ids []ID) []string {
	keys := make([]string, len(ids))
	for i, id := range ids {
		keys[i] = e.buildKey(id)
	}
	return keys
}

// nilKeysOf builds negative-cache keys for a list of IDs
func (e *entityCache[T, ID]) nilKeysOf(ids []ID) []string {
	keys := make([]string, len(ids))
	for i, id := range ids {
		keys[i] = e.buildNilKey(id)
	}
	return keys
}

// sfKeyOf creates a stable singleflight key by sorting+hashing IDs
func (e *entityCache[T, ID]) sfKeyOf(ids []ID) string {
	if len(ids) == 0 {
		return "batch:empty"
	}
	idStrs := e.converter.ToStringSlice(ids)
	sort.Strings(idStrs)
	joined := strings.Join(idStrs, ",")
	sum := sha1.Sum([]byte(joined))
	return fmt.Sprintf("batch:%x", sum)
}

// decodeFromMGet attempts to decode an entity T from an MGET raw value
func (e *entityCache[T, ID]) decodeFromMGet(val any) (*T, bool) {
	var zero T
	// Handle native types quickly
	switch any(zero).(type) {
	case string:
		if s, ok := val.(string); ok {
			v := any(s).(T)
			return &v, true
		}
	case int, int64, uint64, float32, float64, bool:
		// go-redis MGET returns strings; parsing ints here would require strconv; prefer fallback
		return nil, false
	case []byte:
		if b, ok := val.([]byte); ok {
			v := any(b).(T)
			return &v, true
		}
	}

	// For structs/slices/maps: expect string or []byte and decode using configured codec
	var data []byte
	switch v := val.(type) {
	case string:
		data = []byte(v)
	case []byte:
		data = v
	default:
		return nil, false
	}

	var ent T
	if err := e.base.Codec().Decode(data, &ent); err != nil {
		return nil, false
	}
	return &ent, true
}
