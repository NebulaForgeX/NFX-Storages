package circuitbreaker

import (
	"errors"
	"sync"
	"time"

	"github.com/sony/gobreaker"
)

type KeyFunc func(fullMethod, target string) string
type SettingsFor func(key string) gobreaker.Settings

type Manager struct {
	breakers     sync.Map // key -> *gobreaker.CircuitBreaker
	keyFn        KeyFunc
	settingsFor  SettingsFor
	isSuccessful func(error) bool
}

type Option func(*Manager)

func WithKeyFunc(f KeyFunc) Option               { return func(m *Manager) { m.keyFn = f } }
func WithSettingsFor(f SettingsFor) Option       { return func(m *Manager) { m.settingsFor = f } }
func WithIsSuccessful(f func(error) bool) Option { return func(m *Manager) { m.isSuccessful = f } }

func defaultSettingsFor(key string) gobreaker.Settings {
	return gobreaker.Settings{
		Name:        key,
		MaxRequests: 5,
		Interval:    10 * time.Second,
		Timeout:     5 * time.Second,
		ReadyToTrip: func(c gobreaker.Counts) bool { return c.ConsecutiveFailures >= 5 },
		// IsSuccessful 可在 New() 覆盖
		OnStateChange: func(name string, from, to gobreaker.State) {},
	}
}

// New Manager
func NewManager(opts ...Option) *Manager {
	m := &Manager{
		keyFn:       func(fullMethod, target string) string { return fullMethod }, // per-method
		settingsFor: defaultSettingsFor,
		isSuccessful: func(err error) bool {
			// 默认：非可用性错误算成功；你可以在外层传入 IsAvailabilityError 的取反
			return err == nil
		},
	}
	for _, opt := range opts {
		opt(m)
	}
	return m
}

func (m *Manager) get(key string) *gobreaker.CircuitBreaker {
	if cb, ok := m.breakers.Load(key); ok {
		return cb.(*gobreaker.CircuitBreaker)
	}
	// 懒创建
	st := m.settingsFor(key)
	// 把外部 isSuccessful 接到 settings 上
	if st.IsSuccessful == nil && m.isSuccessful != nil {
		st.IsSuccessful = m.isSuccessful
	}
	cb := gobreaker.NewCircuitBreaker(st)
	actual, _ := m.breakers.LoadOrStore(key, cb)
	return actual.(*gobreaker.CircuitBreaker)
}

func IsCircuitBreakerError(err error) bool {
	return errors.Is(err, gobreaker.ErrOpenState) || errors.Is(err, gobreaker.ErrTooManyRequests)
}
