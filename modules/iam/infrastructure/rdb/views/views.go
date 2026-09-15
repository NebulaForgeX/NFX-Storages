package views

import (
	"time"

	"github.com/google/uuid"
)

type SystemStateActiveView struct {
	ID                    uuid.UUID  `gorm:"column:id"`
	Initialized           bool       `gorm:"column:initialized"`
	InitializedAt         *time.Time `gorm:"column:initialized_at"`
	InitializationVersion *string    `gorm:"column:initialization_version"`
	ResetCount            int        `gorm:"column:reset_count"`
	CreatedAt             time.Time  `gorm:"column:created_at"`
	UpdatedAt             time.Time  `gorm:"column:updated_at"`
}

func (SystemStateActiveView) TableName() string { return `system."SystemStateActiveView"` }
