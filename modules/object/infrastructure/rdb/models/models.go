package models

import (
	"time"

	"github.com/google/uuid"
)

type State struct {
	ID                    uuid.UUID `gorm:"type:uuid;primaryKey"`
	Initialized           bool
	InitializedAt         *time.Time
	InitializationVersion *string
	ResetCount            int
	CreatedAt, UpdatedAt  time.Time
}

func (State) TableName() string { return "system.system_state" }
