package core

import "errors"

// ErrNotFound indicates a negative-cacheable not-found result from the repository.
// Callers can wrap or translate their domain not-found into this error to enable
// negative caching behavior in higher-level caches.
var ErrNotFound = errors.New("cache: not found")
