package cachex

import (
	"errors"
	"time"

	"gorm.io/gorm"
)

// ---- Stable（i.e. Category/Brand/ShippingMethod） ----
var StableEntity = CacheConfig{
	TTL: 24 * time.Hour, NegativeTTL: 15 * time.Minute, JitterPercent: 10,
	NotFoundMatcher: func(err error) bool { return errors.Is(err, gorm.ErrRecordNotFound) },
}

var StableList = CacheConfig{
	TTL:           12 * time.Hour,
	JitterPercent: 10,
}

var StableIndex = CacheConfig{
	TTL: 24 * time.Hour, NegativeTTL: 15 * time.Minute, JitterPercent: 10,
	NotFoundMatcher: func(err error) bool { return errors.Is(err, gorm.ErrRecordNotFound) },
}

// ---- Dynamic（i.e. Product） ----
var DynamicEntity = CacheConfig{
	TTL: 5 * time.Minute, NegativeTTL: 2 * time.Minute, JitterPercent: 10,
	NotFoundMatcher: func(err error) bool { return errors.Is(err, gorm.ErrRecordNotFound) },
}

var DynamicList = CacheConfig{
	TTL:           1 * time.Minute,
	JitterPercent: 10,
}

var DynamicIndex = CacheConfig{
	TTL: 5 * time.Minute, NegativeTTL: 2 * time.Minute, JitterPercent: 10,
	NotFoundMatcher: func(err error) bool { return errors.Is(err, gorm.ErrRecordNotFound) },
}

// ---- Hot（i.e. Order） ----
var HotEntity = CacheConfig{
	TTL: 30 * time.Second, NegativeTTL: 30 * time.Second, JitterPercent: 10,
	NotFoundMatcher: func(err error) bool { return errors.Is(err, gorm.ErrRecordNotFound) },
}

// Recommend not to cache
var HotList = CacheConfig{
	TTL:           15 * time.Second,
	JitterPercent: 10,
}

var HotIndex = CacheConfig{
	TTL: 1 * time.Minute, NegativeTTL: 30 * time.Second, JitterPercent: 10,
	NotFoundMatcher: func(err error) bool { return errors.Is(err, gorm.ErrRecordNotFound) },
}
