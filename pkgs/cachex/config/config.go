package config

import (
	"math/rand"
	"time"
)

type CacheConfig struct {
	// TTL for successful entities
	TTL time.Duration
	// NegativeTTL > 0 enables negative caching using a separate ":nil" key
	NegativeTTL time.Duration
	// JitterPercent applies ±percent TTL jitter to avoid avalanches (e.g., 10)
	JitterPercent int
	// EnableSWR: return stale value and revalidate in background
	EnableSWR bool
	// BypassRead skips reading from cache but still allows optional write-back unless BypassWrite is also set
	BypassRead bool
	// BypassWrite skips writing back to cache
	BypassWrite bool
	// NotFoundMatcher determines if an error from the data source represents a "not found"
	// condition that should be translated to cache.ErrNotFound and optionally negative-cached.
	// If nil, no error will be treated as not-found by default.
	NotFoundMatcher func(error) bool
}

func (o CacheConfig) IsNegativeCacheEnabled() bool {
	return o.NegativeTTL > 0
}

func (o CacheConfig) IsJitterEnabled() bool {
	return o.JitterPercent > 0
}

func (o CacheConfig) EffectiveTTL() time.Duration {
	return getJitteredTTL(o.TTL, o.JitterPercent)
}

func (o CacheConfig) EffectiveNegativeTTL() time.Duration {
	return getJitteredTTL(o.NegativeTTL, o.JitterPercent)
}

// IsNotFound returns true if the configured NotFoundMatcher considers the error a not-found condition.
func (o CacheConfig) IsNotFound(err error) bool {
	if err == nil {
		return false
	}
	if o.NotFoundMatcher == nil {
		return false
	}
	return o.NotFoundMatcher(err)
}

func getJitteredTTL(baseTTL time.Duration, jitterPercent int) time.Duration {
	if jitterPercent == 0 {
		return baseTTL
	}
	jitterRange := int64(baseTTL) * int64(jitterPercent) / 100
	jitter := rand.Int63n(jitterRange*2+1) - jitterRange
	return baseTTL + time.Duration(jitter)
}
