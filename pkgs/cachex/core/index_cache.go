package core

import (
	"context"

	"nfxstorages/pkgs/cachex/config"
	"nfxstorages/pkgs/utils/id"

	"golang.org/x/sync/singleflight"
)

type indexCache[ID id.IDtype] struct {
	base      BaseCache
	kb        KeyBuilder
	cfg       config.CacheConfig
	converter id.IDConverter[ID]
	sf        singleflight.Group
}

func NewIndexCache[ID id.IDtype](base BaseCache, kb KeyBuilder, cfg config.CacheConfig) IndexCache[ID] {
	return &indexCache[ID]{
		base:      base,
		kb:        kb,
		cfg:       cfg,
		converter: id.NewIDConverter[ID](),
	}
}

func (i *indexCache[ID]) Base() BaseCache            { return i.base }
func (i *indexCache[ID]) KeyBuilder() KeyBuilder     { return i.kb }
func (i *indexCache[ID]) Config() config.CacheConfig { return i.cfg }

func (i *indexCache[ID]) GetIDByIndexOrLoad(
	ctx context.Context,
	indexType, value string,
	fetchID func(context.Context, string) (ID, error),
	opts ...config.CacheCallOption,
) (ID, error) {
	var zero ID
	indexKey := i.kb.Index(indexType, value)
	if s, err := i.base.GetString(ctx, indexKey); err == nil && s != "" {
		return i.converter.ToID(s), nil
	}
	v, err, _ := i.sf.Do(indexKey, func() (any, error) {
		// Recheck within flight window
		if s, err := i.base.GetString(ctx, indexKey); err == nil && s != "" {
			return i.converter.ToID(s), nil
		}
		id, err := fetchID(ctx, value)
		if err != nil {
			return nil, err
		}
		_ = i.base.Set(ctx, indexKey, i.converter.ToString(id), i.cfg.EffectiveTTL())
		return id, nil
	})
	if err != nil {
		return zero, err
	}
	return v.(ID), nil
}

// Invalidate deletes a specific index key
func (i *indexCache[ID]) Invalidate(ctx context.Context, indexType, value string) error {
	return i.base.Delete(ctx, i.kb.Index(indexType, value))
}
