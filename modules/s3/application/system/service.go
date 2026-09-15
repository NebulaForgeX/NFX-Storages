package systemapp

import (
	"context"
	"time"

	"nfxstorages/pkgs/errx"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type State struct {
	ID                    uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Initialized           bool       `json:"initialized"`
	InitializedAt        *time.Time `json:"initialized_at"`
	InitializationVersion *string     `json:"initialization_version"`
	ResetCount            int        `json:"reset_count"`
	CreatedAt             time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt             time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

func (State) TableName() string { return "system.system_state" }

type Service struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) *Service { return &Service{db: db} }

func (s *Service) Latest(ctx context.Context) (*State, error) {
	var row State
	err := s.db.WithContext(ctx).Order("created_at desc").First(&row).Error
	if err == gorm.ErrRecordNotFound {
		return &State{Initialized: false}, nil
	}
	if err != nil {
		return nil, errx.ErrInternal.WithCause(err)
	}
	return &row, nil
}

func (s *Service) Initialize(ctx context.Context, version string) (*State, error) {
	now := time.Now()
	row := State{ID: uuid.Must(uuid.NewV7()), Initialized: true, InitializedAt: &now}
	if version != "" {
		row.InitializationVersion = &version
	}
	if err := s.db.WithContext(ctx).Create(&row).Error; err != nil {
		return nil, errx.ErrInternal.WithCause(err)
	}
	return &row, nil
}
