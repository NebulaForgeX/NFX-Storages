package core

import (
	"context"
	"sync"
	"sync/atomic"
	"time"

	"github.com/redis/go-redis/v9"
	"golang.org/x/sync/singleflight"
)

// verProvider provides version strings for cache key building with
// in-process caching and optional pub/sub invalidation.
type verProvider struct {
	base  BaseCache
	ttl   time.Duration
	cache sync.Map // map[string]*verEntry, key: localKey(prefix,ns,suffix)
	sf    singleflight.Group
}

type verEntry struct {
	v      atomic.Value // string
	expire atomic.Pointer[time.Time]
}

// NewVerProvider creates a new version provider.
func NewVerProvider(base BaseCache, ttl time.Duration) VersionProvider {
	if ttl <= 0 {
		// default to 5 minutes if not specified
		ttl = 30 * time.Minute
	}
	return &verProvider{base: base, ttl: ttl}
}

func (vp *verProvider) verKey(prefix, ns, suffix string) string {
	return "ver:" + prefix + ":" + ns + ":" + suffix
}

func (vp *verProvider) localKey(prefix, ns, suffix string) string {
	return prefix + ":" + ns + ":" + suffix
}

// Get returns the version string with best-effort semantics.
// It uses in-process cache with TTL, and falls back to "1" on errors.
func (vp *verProvider) Get(prefix, ns, suffix string) string {
	lk := vp.localKey(prefix, ns, suffix)
	if eAny, ok := vp.cache.Load(lk); ok {
		e := eAny.(*verEntry)
		if exp := e.expire.Load(); exp != nil && time.Now().Before(*exp) {
			if vAny := e.v.Load(); vAny != nil {
				return vAny.(string)
			}
		}
	}

	vAny, _, _ := vp.sf.Do(lk, func() (any, error) {
		// re-check after acquiring singleflight key
		if eAny, ok := vp.cache.Load(lk); ok {
			e := eAny.(*verEntry)
			if exp := e.expire.Load(); exp != nil && time.Now().Before(*exp) {
				if vAny := e.v.Load(); vAny != nil {
					return vAny.(string), nil
				}
			}
		}

		ctx := context.Background()
		v, err := vp.base.GetString(ctx, vp.verKey(prefix, ns, suffix))
		if err == redis.Nil {
			v = "1"
		} else if err != nil {
			// best-effort fallback: keep old value if any, otherwise default
			if eAny, ok := vp.cache.Load(lk); ok {
				e := eAny.(*verEntry)
				if vAny := e.v.Load(); vAny != nil {
					return vAny.(string), nil
				}
			}
			v = "1"
		}

		e := &verEntry{}
		e.v.Store(v)
		exp := time.Now().Add(vp.ttl)
		e.expire.Store(&exp)
		vp.cache.Store(lk, e)
		return v, nil
	})

	return vAny.(string)
}

// RunInvalidator subscribes to the pub/sub channel and invalidates local cache entries.
// Channel: "ver:changed" with message payload "<prefix>:<ns>:<suffix>"
func (vp *verProvider) RunInvalidator(ctx context.Context) error {
	sub := vp.base.Subscribe(ctx, "ver:changed")
	ch := sub.Channel()
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case msg := <-ch:
			if msg == nil {
				continue
			}
			vp.cache.Delete(msg.Payload)
		}
	}
}

// Bump increments the version in Redis and publishes invalidation.
func (vp *verProvider) Bump(ctx context.Context, prefix, ns, suffix string) error {
	if _, err := vp.base.Incr(ctx, vp.verKey(prefix, ns, suffix)); err != nil {
		return err
	}
	return vp.base.Publish(ctx, "ver:changed", vp.localKey(prefix, ns, suffix))
}
