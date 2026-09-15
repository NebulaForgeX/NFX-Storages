package server

import (
	"context"
	"errors"
	"net"
	"net/http"
	"strconv"

	"nfxstorages/modules/notify/config"
	grpcInterfaces "nfxstorages/modules/notify/interfaces/grpc"
	httpInterfaces "nfxstorages/modules/notify/interfaces/http"
	messagingInterfaces "nfxstorages/modules/notify/interfaces/messaging"
	eventbusInterfaces "nfxstorages/modules/notify/interfaces/pipeline"
	"nfxstorages/pkgs/logx"

	"golang.org/x/sync/errgroup"
	"google.golang.org/grpc"
)

func RunHTTP(ctx context.Context, cfg *config.Config) error {
	deps, err := NewDeps(ctx, cfg)
	if err != nil {
		return err
	}
	defer deps.Cleanup()

	httpSrv := httpInterfaces.NewHTTPServer(deps, cfg.Server.AccessLog)
	httpAddr := net.JoinHostPort(cfg.Server.Host, strconv.Itoa(cfg.Server.HTTPPort))
	g, gctx := errgroup.WithContext(ctx)

	g.Go(func() error {
		logx.S().Infof("HTTP server listening on %s", httpAddr)
		if err := httpSrv.Listen(httpAddr); err != nil && !errors.Is(err, http.ErrServerClosed) {
			return err
		}
		return nil
	})

	g.Go(func() error {
		<-gctx.Done()
		_ = httpSrv.Shutdown()
		return gctx.Err()
	})

	return g.Wait()
}

func RunGRPC(ctx context.Context, cfg *config.Config) error {
	deps, err := NewDeps(ctx, cfg)
	if err != nil {
		return err
	}
	defer deps.Cleanup()

	grpcSrv := grpcInterfaces.NewServer(deps)
	grpcAddr := net.JoinHostPort(cfg.Server.Host, strconv.Itoa(cfg.Server.GRPCPort))

	lis, err := net.Listen("tcp", grpcAddr)
	if err != nil {
		return err
	}
	defer lis.Close()

	g, gctx := errgroup.WithContext(ctx)

	g.Go(func() error {
		logx.S().Infof("gRPC server listening on %s", grpcAddr)
		if err := grpcSrv.Serve(lis); err != nil && !errors.Is(err, grpc.ErrServerStopped) {
			return err
		}
		return nil
	})

	g.Go(func() error {
		<-gctx.Done()
		grpcSrv.GracefulStop()
		return gctx.Err()
	})

	return g.Wait()
}

func RunPipeline(ctx context.Context, cfg *config.Config) error {
	deps, err := NewDeps(ctx, cfg)
	if err != nil {
		return err
	}
	defer deps.Cleanup()

	eventbusSrv, err := eventbusInterfaces.NewServer(deps)
	if err != nil {
		return err
	}
	eventbusSrv.RegisterRoutes()

	g, gctx := errgroup.WithContext(ctx)
	g.Go(func() error {
		return eventbusSrv.Run(ctx)
	})
	g.Go(func() error {
		<-gctx.Done()
		_ = eventbusSrv.Close()
		return gctx.Err()
	})
	return g.Wait()
}

func RunMessaging(ctx context.Context, cfg *config.Config) error {
	deps, err := NewDeps(ctx, cfg)
	if err != nil {
		return err
	}
	defer deps.Cleanup()

	messagingSrv, err := messagingInterfaces.NewServer(deps)
	if err != nil {
		return err
	}
	messagingSrv.RegisterRoutes()

	g, gctx := errgroup.WithContext(ctx)
	g.Go(func() error {
		return messagingSrv.Run(ctx)
	})
	g.Go(func() error {
		<-gctx.Done()
		_ = messagingSrv.Close()
		return gctx.Err()
	})
	return g.Wait()
}

func RunServer(ctx context.Context, cfg *config.Config) error {
	deps, err := NewDeps(ctx, cfg)
	if err != nil {
		return err
	}
	defer deps.Cleanup()

	httpSrv := httpInterfaces.NewHTTPServer(deps, cfg.Server.AccessLog)
	grpcSrv := grpcInterfaces.NewServer(deps)
	eventbusSrv, err := eventbusInterfaces.NewServer(deps)
	if err != nil {
		return err
	}
	messagingSrv, err := messagingInterfaces.NewServer(deps)
	if err != nil {
		return err
	}

	httpAddr := net.JoinHostPort(cfg.Server.Host, strconv.Itoa(cfg.Server.HTTPPort))
	grpcAddr := net.JoinHostPort(cfg.Server.Host, strconv.Itoa(cfg.Server.GRPCPort))
	grpcLis, err := net.Listen("tcp", grpcAddr)
	if err != nil {
		return err
	}
	defer grpcLis.Close()

	g, gctx := errgroup.WithContext(ctx)
	g.Go(func() error {
		logx.S().Infof("HTTP server listening on %s", httpAddr)
		if err := httpSrv.Listen(httpAddr); err != nil && !errors.Is(err, http.ErrServerClosed) {
			return err
		}
		return nil
	})
	g.Go(func() error {
		logx.S().Infof("gRPC server listening on %s", grpcAddr)
		if err := grpcSrv.Serve(grpcLis); err != nil && !errors.Is(err, grpc.ErrServerStopped) {
			return err
		}
		return nil
	})
	g.Go(func() error {
		return eventbusSrv.Run(ctx)
	})
	g.Go(func() error {
		return messagingSrv.Run(ctx)
	})
	g.Go(func() error {
		<-gctx.Done()
		_ = httpSrv.Shutdown()
		grpcSrv.GracefulStop()
		_ = eventbusSrv.Close()
		_ = messagingSrv.Close()
		return gctx.Err()
	})
	return g.Wait()
}
