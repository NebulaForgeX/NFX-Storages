package systemapp

import (
	"context"
	"time"

	systemstateDomain "nfxstorages/modules/notify/domain/systemstate"
	systemstateQuery "nfxstorages/modules/notify/query/systemstate"
	"nfxstorages/pkgs/errx"

	"github.com/google/uuid"
)

type State = systemstateQuery.StateVO

type Service struct {
	repo  *systemstateDomain.Repo
	query *systemstateQuery.Query
}

func NewService(repo *systemstateDomain.Repo, query *systemstateQuery.Query) *Service {
	return &Service{repo: repo, query: query}
}

func (s *Service) Latest(ctx context.Context) (*State, error) {
	row, err := s.query.Latest.Get(ctx)
	if err != nil {
		return nil, errx.Internal("SYSTEM_STATE", "lookup failed").WithCause(err)
	}
	if row == nil {
		return &State{Initialized: false}, nil
	}
	return row, nil
}

func (s *Service) Initialize(ctx context.Context, version string) (*State, error) {
	now := time.Now()
	id := uuid.Must(uuid.NewV7())
	st := systemstateDomain.Inner{ID: id, Initialized: true, InitializedAt: &now, CreatedAt: now, UpdatedAt: now}
	if version != "" {
		st.InitializationVersion = &version
	}
	if err := s.repo.Create.New(ctx, systemstateDomain.NewFromState(st)); err != nil {
		return nil, errx.Internal("SYSTEM_STATE", "initialize failed").WithCause(err)
	}
	return &State{ID: id, Initialized: true, InitializedAt: &now, InitializationVersion: st.InitializationVersion, CreatedAt: now, UpdatedAt: now}, nil
}
