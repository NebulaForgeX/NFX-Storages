package core

import (
	"context"
	"fmt"
	"nfxstorages/pkgs/cachex/config"
	"nfxstorages/pkgs/utils/id"

	"golang.org/x/sync/singleflight"
)

type listCache[ID id.IDtype] struct {
	base BaseCache
	kb   KeyBuilder
	cfg  config.CacheConfig
	sf   singleflight.Group
}

func NewListCache[ID id.IDtype](base BaseCache, kb KeyBuilder, cfg config.CacheConfig) ListCache[ID] {
	return &listCache[ID]{
		base: base,
		kb:   kb,
		cfg:  cfg,
	}
}

func (l *listCache[ID]) Base() BaseCache            { return l.base }
func (l *listCache[ID]) KeyBuilder() KeyBuilder     { return l.kb }
func (l *listCache[ID]) Config() config.CacheConfig { return l.cfg }

func (l *listCache[ID]) GetIDsOrLoad(
	ctx context.Context,
	name string,
	fetch func(context.Context) ([]ID, error),
	opts ...config.CacheCallOption,
) ([]ID, error) {
	key := l.kb.List(name)
	// Fast path: try cache first
	var ids []ID
	if err := l.base.GetStruct(ctx, key, &ids); err == nil {
		return ids, nil
	}

	// Singleflight to avoid duplicate loads for the same key
	v, err, _ := l.sf.Do(key, func() (any, error) {
		// Recheck inside the flight window
		var cached []ID
		if err := l.base.GetStruct(ctx, key, &cached); err == nil {
			return cached, nil
		}
		loaded, err := fetch(ctx)
		if err != nil {
			return nil, err
		}
		_ = l.base.Set(ctx, key, loaded, l.cfg.EffectiveTTL())
		return loaded, nil
	})
	if err != nil {
		return nil, err
	}

	// Safe type assertion with panic recovery
	if result, ok := v.([]ID); ok {
		return result, nil
	}

	// If type assertion fails, return empty slice and log error
	return []ID{}, fmt.Errorf("unexpected type returned from singleflight: %T", v)
}

type listPage[ID id.IDtype] struct {
	IDs   []ID  `json:"ids"   msgpack:"ids"`
	Total int64 `json:"total" msgpack:"total"`
}

func (l *listCache[ID]) GetPageIDsOrLoad(
	ctx context.Context,
	page, size int,
	fetch func(context.Context) ([]ID, int64, error),
	opts ...config.CacheCallOption,
) ([]ID, int64, error) {
	key := l.kb.PageIDs(page, size)
	// Fast path: try cache first
	var cached listPage[ID]
	if err := l.base.GetStruct(ctx, key, &cached); err == nil {
		return cached.IDs, cached.Total, nil
	}

	// Singleflight on the composite key
	v, err, _ := l.sf.Do(key, func() (any, error) {
		// Recheck cache inside the flight window
		var cached2 listPage[ID]
		if err := l.base.GetStruct(ctx, key, &cached2); err == nil {
			return cached2, nil
		}
		ids, total, err := fetch(ctx)
		if err != nil {
			return nil, err
		}
		val := listPage[ID]{IDs: ids, Total: total}
		_ = l.base.Set(ctx, key, val, l.cfg.EffectiveTTL())
		return val, nil
	})
	if err != nil {
		return nil, 0, err
	}

	// Safe type assertion with panic recovery
	if p, ok := v.(listPage[ID]); ok {
		return p.IDs, p.Total, nil
	}

	// If type assertion fails, return empty result and log error
	return []ID{}, 0, fmt.Errorf("unexpected type returned from singleflight: %T", v)
}

// InvalidateList deletes a specific named list key
func (l *listCache[ID]) InvalidateList(ctx context.Context, name string) error {
	return l.base.Delete(ctx, l.kb.List(name))
}

// InvalidatePage deletes a specific page key
func (l *listCache[ID]) InvalidatePage(ctx context.Context, page, size int) error {
	return l.base.Delete(ctx, l.kb.PageIDs(page, size))
}
