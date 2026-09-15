package cachex

import (
	"context"
	"nfxstorages/pkgs/cachex/config"
	"nfxstorages/pkgs/utils/id"
)

type NoopEntityCache[T any, ID id.IDtype] struct {
	kb   KeyBuilder
	base BaseCache
}

func (n NoopEntityCache[T, ID]) Base() BaseCache        { return n.base }
func (n NoopEntityCache[T, ID]) KeyBuilder() KeyBuilder { return n.kb }
func (n NoopEntityCache[T, ID]) Get(ctx context.Context, key string) (T, error) {
	var zero T
	return zero, nil
}
func (n NoopEntityCache[T, ID]) GetOrLoad(ctx context.Context, id ID, fetch func(context.Context, ID) (*T, error), _ ...config.CacheCallOption) (*T, error) {
	return nil, nil
}

func (n NoopEntityCache[T, ID]) MGetOrLoad(
	ctx context.Context,
	ids []ID,
	fetch func(context.Context, []ID) ([]T, error),
	idOf func(*T) ID,
	_ ...config.CacheCallOption,
) (map[ID]*T, error) {
	return nil, nil
}
func (n NoopEntityCache[T, ID]) Invalidate(ctx context.Context, id ID) error { return nil }

type NoopListCache[ID id.IDtype] struct {
	kb   KeyBuilder
	base BaseCache
}

func (n NoopListCache[ID]) Base() BaseCache        { return n.base }
func (n NoopListCache[ID]) KeyBuilder() KeyBuilder { return n.kb }

func (n NoopListCache[ID]) GetIDsOrLoad(
	ctx context.Context,
	name string,
	fetch func(context.Context) ([]ID, error),
	_ ...config.CacheCallOption,
) ([]ID, error) {
	return fetch(ctx) // 直接穿透
}

func (n NoopListCache[ID]) GetPageIDsOrLoad(
	ctx context.Context,
	page, size int,
	fetch func(context.Context) ([]ID, int64, error),
	_ ...config.CacheCallOption,
) ([]ID, int64, error) {
	return fetch(ctx)
}
func (n NoopListCache[ID]) InvalidateList(ctx context.Context, name string) error    { return nil }
func (n NoopListCache[ID]) InvalidatePage(ctx context.Context, page, size int) error { return nil }

type NoopIndexCache[ID id.IDtype] struct {
	kb   KeyBuilder
	base BaseCache
}

func (n NoopIndexCache[ID]) Base() BaseCache        { return n.base }
func (n NoopIndexCache[ID]) KeyBuilder() KeyBuilder { return n.kb }

func (n NoopIndexCache[ID]) GetIDByIndexOrLoad(
	ctx context.Context,
	indexType, value string,
	fetchID func(context.Context, string) (ID, error),
	_ ...config.CacheCallOption,
) (ID, error) {
	return fetchID(ctx, value)
}
func (n NoopIndexCache[ID]) Invalidate(ctx context.Context, indexType, value string) error {
	return nil
}

type NoopCounterCache[ID id.IDtype] struct {
	kb   KeyBuilder
	base BaseCache
}

func (n NoopCounterCache[ID]) Base() BaseCache        { return n.base }
func (n NoopCounterCache[ID]) KeyBuilder() KeyBuilder { return n.kb }
func (n NoopCounterCache[ID]) Incr(ctx context.Context, name string, id ID) (int64, error) {
	return 0, nil
}
func (n NoopCounterCache[ID]) IncrBy(ctx context.Context, name string, id ID, delta int64) (int64, error) {
	return 0, nil
}
func (n NoopCounterCache[ID]) Get(ctx context.Context, name string, id ID) (int64, error) {
	return 0, nil
}
func (n NoopCounterCache[ID]) GetAndReset(ctx context.Context, name string, id ID) (int64, error) {
	return 0, nil
}
func (n NoopCounterCache[ID]) Reset(ctx context.Context, name string, id ID) error { return nil }
func (n NoopCounterCache[ID]) Pattern(name string) string                          { return "" }
func (n NoopCounterCache[ID]) ScanAndConsume(ctx context.Context, name string, count int64, batchSize int, consume func(id ID, delta int64)) error {
	return nil
}
