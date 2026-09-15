package cachex

import (
	"nfxstorages/pkgs/cachex/core"
	"nfxstorages/pkgs/utils/id"
)

// exported interfaces
type BaseCache = core.BaseCache
type KeyBuilder = core.KeyBuilder
type VersionProvider = core.VersionProvider

type EntityCache[T any, ID id.IDtype] = core.EntityCache[T, ID]
type ListCache[ID id.IDtype] = core.ListCache[ID]
type IndexCache[ID id.IDtype] = core.IndexCache[ID]
type CounterCache[ID id.IDtype] = core.CounterCache[ID]

type CacheSet[T any, ID id.IDtype] interface {
	Base() BaseCache
	EntityCache() EntityCache[T, ID]
	ListCache() ListCache[ID]
	IndexCache() IndexCache[ID]
	CounterCache() CounterCache[ID]
}
