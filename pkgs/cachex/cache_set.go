package cachex

import (
	"nfxstorages/pkgs/utils/id"
	"sync"
	"time"
)

type CacheSetOption func(*cacheSetOptions)

type cacheSetOptions struct {
	enableEntity  bool
	enableList    bool
	enableIndex   bool
	enableCounter bool
	ver           VersionProvider
	verTTL        time.Duration
	entitySuffix  string
	listSuffix    string
	indexSuffix   string
	entityCfg     CacheConfig
	listCfg       CacheConfig
	indexCfg      CacheConfig
}

func WithEntity(cfg CacheConfig) CacheSetOption {
	return func(o *cacheSetOptions) { o.enableEntity = true; o.entityCfg = cfg }
}
func WithList(cfg CacheConfig) CacheSetOption {
	return func(o *cacheSetOptions) { o.enableList = true; o.listCfg = cfg }
}
func WithIndex(cfg CacheConfig) CacheSetOption {
	return func(o *cacheSetOptions) { o.enableIndex = true; o.indexCfg = cfg }
}
func WithCounter() CacheSetOption { return func(o *cacheSetOptions) { o.enableCounter = true } }
func WithVersionProvider(v VersionProvider, ttl time.Duration) CacheSetOption {
	return func(o *cacheSetOptions) { o.ver = v; o.verTTL = ttl }
}
func WithSuffixes(entity, list, index string) CacheSetOption {
	return func(o *cacheSetOptions) { o.entitySuffix = entity; o.listSuffix = list; o.indexSuffix = index }
}

type cacheSet[T any, ID id.IDtype] struct {
	base   BaseCache
	ver    VersionProvider
	prefix string
	ns     string

	onceEntity  sync.Once
	onceList    sync.Once
	onceIndex   sync.Once
	onceCounter sync.Once

	entity  EntityCache[T, ID]
	list    ListCache[ID]
	index   IndexCache[ID]
	counter CounterCache[ID]

	entityKB  KeyBuilder
	listKB    KeyBuilder
	indexKB   KeyBuilder
	counterKB KeyBuilder

	opts cacheSetOptions
}

func NewCacheSet[T any, ID id.IDtype](base BaseCache, prefix, ns string, opts ...CacheSetOption) CacheSet[T, ID] {
	o := cacheSetOptions{
		verTTL:       30 * time.Minute,
		entitySuffix: "shape", listSuffix: "tree", indexSuffix: "index",
	}
	for _, opt := range opts {
		opt(&o)
	}
	if o.ver == nil {
		o.ver = NewVerProvider(base, o.verTTL)
	}

	mkKB := func(suffix string, enabled bool) KeyBuilder {
		var vf func() string
		if enabled && o.ver != nil && suffix != "" {
			vf = func() string { return suffix[:1] + o.ver.Get(prefix, ns, suffix) }
		}
		return NewKeyBuilder(prefix, ns, vf)
	}

	cs := &cacheSet[T, ID]{
		base: base, ver: o.ver, prefix: prefix, ns: ns, opts: o,
		entityKB:  mkKB(o.entitySuffix, o.enableEntity),
		listKB:    mkKB(o.listSuffix, o.enableList),
		indexKB:   mkKB(o.indexSuffix, o.enableIndex),
		counterKB: NewKeyBuilder(prefix, ns, nil),
	}
	return cs
}

func (c *cacheSet[T, ID]) Base() BaseCache {
	return c.base
}

func (c *cacheSet[T, ID]) EntityCache() EntityCache[T, ID] {
	if !c.opts.enableEntity {
		return NoopEntityCache[T, ID]{kb: c.entityKB, base: c.base}
	}
	c.onceEntity.Do(func() {
		c.entity = NewEntityCache[T, ID](c.base, c.entityKB, c.opts.entityCfg)
	})
	return c.entity
}

func (c *cacheSet[T, ID]) ListCache() ListCache[ID] {
	if !c.opts.enableList {
		return NoopListCache[ID]{kb: c.listKB, base: c.base}
	}
	c.onceList.Do(func() {
		c.list = NewListCache[ID](c.base, c.listKB, c.opts.listCfg)
	})
	return c.list
}

func (c *cacheSet[T, ID]) IndexCache() IndexCache[ID] {
	if !c.opts.enableIndex {
		return NoopIndexCache[ID]{kb: c.indexKB, base: c.base}
	}
	c.onceIndex.Do(func() {
		c.index = NewIndexCache[ID](c.base, c.indexKB, c.opts.indexCfg)
	})
	return c.index
}

func (c *cacheSet[T, ID]) CounterCache() CounterCache[ID] {
	if !c.opts.enableCounter {
		return NoopCounterCache[ID]{kb: c.counterKB, base: c.base}
	}
	c.onceCounter.Do(func() {
		c.counter = NewCounterCache[ID](c.base, c.counterKB)
	})
	return c.counter
}
