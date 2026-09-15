package main

import (
	"context"
	"errors"
	"flag"
	"log"
	"os/signal"
	"syscall"

	"nfxstorages/modules/iam/config"
	"nfxstorages/modules/iam/server"
	"nfxstorages/pkgs/env"
	"nfxstorages/pkgs/logx"

	"go.uber.org/zap"
)

func main() {
	envStr := flag.String("env", "prod", "Environment (dev/prod)")
	flag.Parse()

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	cfg, err := config.Load(ctx, env.Env(*envStr))
	if err != nil {
		log.Fatalf("load config failed: %v", err)
	}

	if err := logx.Init(cfg.Logger, "iam-api-service", env.Env(*envStr)); err != nil {
		log.Fatalf("logger init failed: %v", err)
	}
	defer logx.Sync()

	if err := server.RunHTTP(ctx, cfg); err != nil && !errors.Is(err, context.Canceled) {
		logx.L().Fatal("api server stopped with error", zap.Error(err))
	}

	logx.L().Info("api server shutdown gracefully")
}
