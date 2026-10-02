package resource

import (
	"context"

	"nfxstorages/pkgs/cachex"
	"nfxstorages/pkgs/kafkax"
	"nfxstorages/pkgs/postgresqlx"
)

type Service struct {
	postgres *postgresqlx.Connection
	cache    *cachex.Connection
	kafkaCfg *kafkax.Config
}

func NewService(
	postgres *postgresqlx.Connection,
	cache *cachex.Connection,
	kafkaCfg *kafkax.Config,
) *Service {
	return &Service{postgres: postgres, cache: cache, kafkaCfg: kafkaCfg}
}

func (s *Service) CheckPostgres(ctx context.Context) error {
	if s.postgres == nil {
		return nil
	}
	return s.postgres.Check(ctx)
}

func (s *Service) CheckRedis(ctx context.Context) error {
	if s.cache == nil {
		return nil
	}
	return s.cache.Check(ctx)
}

func (s *Service) CheckKafka(ctx context.Context) error {
	return nil
}
