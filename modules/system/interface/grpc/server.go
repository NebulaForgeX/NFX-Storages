package grpc

import (
	"nfxstorages/modules/system/application/resource"
	systemapp "nfxstorages/modules/system/application/system"
	grpcHandler "nfxstorages/modules/system/interface/grpc/handler"
	"nfxstorages/pkgs/grpcx/interceptor"
	"nfxstorages/pkgs/security/token"
	"nfxstorages/pkgs/security/token/servertoken"
	healthpb "nfxstorages/protos/gen/common/health"
	systemstatepb "nfxstorages/protos/gen/system/system_state"

	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"google.golang.org/grpc"
)

type Deps interface {
	AppSvc() *systemapp.Service
	ResourceSvc() *resource.Service
	ServerTokenVerifier() token.Verifier
}

func NewServer(d Deps) *grpc.Server {
	s := grpc.NewServer(
		grpc.StatsHandler(otelgrpc.NewServerHandler()),
		grpc.ChainUnaryInterceptor(interceptor.UnaryErrorHandler(), servertoken.UnaryAuthInterceptor(d.ServerTokenVerifier())),
	)
	systemstatepb.RegisterSystemStateServiceServer(s, grpcHandler.NewSystemHandler(d.AppSvc()))
	healthpb.RegisterHealthServiceServer(s, grpcHandler.NewHealthHandler(d.ResourceSvc(), "system"))
	return s
}
