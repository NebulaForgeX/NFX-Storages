package config

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"nfxstorages/pkgs/configx"
	"nfxstorages/pkgs/env"
)

const ServiceName = "system"

func Load(ctx context.Context, env env.Env) (*Config, error) {
	wd, err := os.Getwd()
	if err != nil {
		return nil, fmt.Errorf("failed to get working directory: %w", err)
	}
	configPath := filepath.Join(wd, "inputs", ServiceName, "configuration", fmt.Sprintf("%s.toml", env))

	loader, err := configx.NewLoader[Config](ctx, configx.WithPath(configPath))
	if err != nil {
		return nil, err
	}
	cfg := loader.Config()
	cfg.Env = env

	if err := cfg.KafkaConfig.Validate(); err != nil {
		return nil, fmt.Errorf("invalid kafka configuration: %w", err)
	}

	return cfg, nil
}
