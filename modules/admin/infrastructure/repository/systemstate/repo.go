package systemstate

import (
	"context"

	"nfxstorages/modules/admin/domain/systemstate"
	"nfxstorages/modules/admin/infrastructure/rdb/models"

	"gorm.io/gorm"
)

type h struct{ db *gorm.DB }

func NewRepo(db *gorm.DB) *systemstate.Repo { return &systemstate.Repo{Create: &h{db: db}} }
func (x *h) New(ctx context.Context, s *systemstate.State) error {
	st := s.Inner()
	return x.db.WithContext(ctx).Create(&models.State{ID: st.ID, Initialized: st.Initialized, InitializedAt: st.InitializedAt, InitializationVersion: st.InitializationVersion, ResetCount: st.ResetCount, CreatedAt: st.CreatedAt, UpdatedAt: st.UpdatedAt}).Error
}
