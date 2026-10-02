package grpc

import (
	"nfxstorages/modules/notify/application/resource"
	grpcHandler "nfxstorages/modules/notify/interface/grpc/handler"
	"nfxstorages/pkgs/grpcx/interceptor"
	"nfxstorages/pkgs/security/token"
	"nfxstorages/pkgs/security/token/servertoken"
	healthpb "nfxstorages/protos/gen/common/health"

	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"google.golang.org/grpc"
)

type Deps interface {
	ResourceSvc() *resource.Service
	ServerTokenVerifier() token.Verifier
}

func NewServer(d Deps) *grpc.Server {
	s := grpc.NewServer(
		grpc.StatsHandler(otelgrpc.NewServerHandler()),
		grpc.ChainUnaryInterceptor(interceptor.UnaryErrorHandler(), servertoken.UnaryAuthInterceptor(d.ServerTokenVerifier())),
	)
	healthpb.RegisterHealthServiceServer(s, grpcHandler.NewHealthHandler(d.ResourceSvc(), "notify"))
	return s
}
