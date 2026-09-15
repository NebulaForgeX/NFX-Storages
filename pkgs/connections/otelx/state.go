package otelx

import "sync/atomic"

var (
	enabled       atomic.Bool
	tracesEnabled atomic.Bool
)

func IsEnabled() bool {
	return enabled.Load()
}

func TracesEnabled() bool {
	return tracesEnabled.Load()
}

func setEnabled(on bool) {
	enabled.Store(on)
}

func setTracesEnabled(on bool) {
	tracesEnabled.Store(on)
}
