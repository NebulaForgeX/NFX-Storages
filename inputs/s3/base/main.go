package main

import (
	"context"
	"errors"
	"flag"
	"log"
	"os/signal"
	"syscall"

	"nfxstorages/modules/s3/config"
	"nfxstorages/modules/s3/server"
	"nfxstorages/pkgs/env"
	"nfxstorages/pkgs/logx"

	"go.uber.org/zap"
)

func main() {
	envStr := flag.String("env", "dev", "Environment (dev/prod)")
	flag.Parse()

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	cfg, err := config.Load(ctx, env.Env(*envStr))
	if err != nil {
		log.Fatalf("load config failed: %v", err)
	}

	if err := logx.Init(cfg.Logger, "s3-base-service", env.Env(*envStr)); err != nil {
		log.Fatalf("logger init failed: %v", err)
	}
	defer logx.Sync()

	if err := server.RunServer(ctx, cfg); err != nil && !errors.Is(err, context.Canceled) {
		logx.L().Fatal("base server stopped with error", zap.Error(err))
	}

	logx.L().Info("base server shutdown gracefully")
}
