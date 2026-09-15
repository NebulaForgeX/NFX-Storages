package systemstate

import (
	"context"
	"errors"

	"nfxstorages/modules/notify/infrastructure/rdb/views"
	systemQuery "nfxstorages/modules/notify/query/systemstate"

	"gorm.io/gorm"
)

type h struct{ db *gorm.DB }

func NewQuery(db *gorm.DB) *systemQuery.Query { return &systemQuery.Query{Latest: &h{db: db}} }
func (x *h) Get(ctx context.Context) (*systemQuery.StateVO, error) {
	var row views.SystemStateActiveView
	err := x.db.WithContext(ctx).Table(views.SystemStateActiveView{}.TableName()).Order("created_at desc").First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &systemQuery.StateVO{ID: row.ID, Initialized: row.Initialized, InitializedAt: row.InitializedAt, InitializationVersion: row.InitializationVersion, ResetCount: row.ResetCount, CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt}, nil
}
