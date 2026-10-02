package health

import (
	"context"
	// "nfxstorages/pkgs/logx"
	"sync"
	"time"
)

// Manager manages health checks for resources
type Manager struct {
	ctx       context.Context
	cancel    context.CancelFunc
	interval  time.Duration
	resources map[string]Resource
	statuses  map[string]Status
	mu        sync.RWMutex
}

type Status struct {
	Name    string `json:"name"`
	Status  string `json:"status"`
	Message string `json:"message,omitempty"`
}

// NewManager creates a new health check manager
func NewManager(ctx context.Context, interval time.Duration) *Manager {
	ctx, cancel := context.WithCancel(ctx)
	return &Manager{
		ctx:       ctx,
		cancel:    cancel,
		interval:  interval,
		resources: make(map[string]Resource),
		statuses:  make(map[string]Status),
	}
}

func (m *Manager) MRegister(resources ...Resource) {
	for _, resource := range resources {
		m.Register(resource)
	}
}

// Register registers a resource for health checking
func (m *Manager) Register(resource Resource) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.resources[resource.Name()] = resource
}

// Unregister removes a resource from health checking
func (m *Manager) Unregister(name string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.resources, name)
	delete(m.statuses, name)
}

// Start starts health checks for all registered resources
func (m *Manager) Start() {
	go func() {
		ticker := time.NewTicker(m.interval)
		defer ticker.Stop()

		for {
			select {
			case <-m.ctx.Done():
				return
			case <-ticker.C:
				m.checkAllResources()
			}
		}
	}()
}

// Stop stops all health checks
func (m *Manager) Stop() {
	m.cancel()
}

// checkAllResources performs health checks on all registered resources
func (m *Manager) checkAllResources() {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, resource := range m.resources {
		go func(r Resource) {
			name := r.Name()
			err := r.Check(m.ctx)
			if err != nil {
				if m.ctx.Err() != nil {
					return
				}
				// Only call Recover and mark as unhealthy for real errors
				_ = r.Recover()
				m.mu.Lock()
				m.statuses[name] = Status{Name: name, Status: "unhealthy", Message: err.Error()}
				m.mu.Unlock()
			} else {
				m.mu.Lock()
				m.statuses[name] = Status{Name: name, Status: "healthy"}
				m.mu.Unlock()
			}
		}(resource)
	}
}

func (m *Manager) GetStatuses() []Status {
	m.mu.RLock()
	defer m.mu.RUnlock()
	statuses := make([]Status, 0, len(m.statuses))
	for _, s := range m.statuses {
		statuses = append(statuses, s)
	}
	return statuses
}
