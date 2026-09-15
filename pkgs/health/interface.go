package health

import "context"

// Resource represents a resource that needs health checking
type Resource interface {
	// Name returns the name of the resource
	Name() string
	// Check returns true if the resource is healthy
	Check(ctx context.Context) error
	// Recover attempts to recover the resource
	Recover() error
}
