package config

import (
	"time"
)

type CacheCallOption func(*CacheConfig)

func WithTTL(ttl time.Duration) CacheCallOption {
	return func(o *CacheConfig) { o.TTL = ttl }
}

func WithNegativeTTL(ttl time.Duration) CacheCallOption {
	return func(o *CacheConfig) { o.NegativeTTL = ttl }
}

func WithJitterPercent(percent int) CacheCallOption {
	return func(o *CacheConfig) { o.JitterPercent = percent }
}

func WithEnableSWR() CacheCallOption {
	return func(o *CacheConfig) { o.EnableSWR = true }
}

func WithBypassRead() CacheCallOption {
	return func(o *CacheConfig) { o.BypassRead = true }
}

func WithBypassWrite() CacheCallOption {
	return func(o *CacheConfig) { o.BypassWrite = true }
}

// WithNotFoundMatcher configures a function to identify not-found errors coming from data sources.
func WithNotFoundMatcher(matcher func(error) bool) CacheCallOption {
	return func(o *CacheConfig) { o.NotFoundMatcher = matcher }
}
