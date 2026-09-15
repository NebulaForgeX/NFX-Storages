package systemstate

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type StateVO struct {
	ID                    uuid.UUID  `json:"id"`
	Initialized           bool       `json:"initialized"`
	InitializedAt         *time.Time `json:"initialized_at"`
	InitializationVersion *string    `json:"initialization_version"`
	ResetCount            int        `json:"reset_count"`
	CreatedAt             time.Time  `json:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at"`
}
type Query struct{ Latest Latest }
type Latest interface {
	Get(ctx context.Context) (*StateVO, error)
}
