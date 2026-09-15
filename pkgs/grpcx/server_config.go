package grpcx

import (
	"fmt"
	"os"
	"runtime/debug"
	"time"

	"nfxstorages/pkgs/logx"
	logmw "nfxstorages/pkgs/logx/middleware"
	"nfxstorages/pkgs/security/token"
	"nfxstorages/pkgs/security/token/servertoken"

	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/logging"
	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/recovery"
	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/keepalive"
	"google.golang.org/grpc/status"
)

func DefaultServerOptions(verifier token.Verifier) []grpc.ServerOption {
	return []grpc.ServerOption{
		grpc.StatsHandler(otelgrpc.NewServerHandler()), // TODO: Add OpenTelemetry on client side to inherit parent traceID
		// 配置 keepalive enforcement policy，允许客户端每 5 分钟发送一次 ping
		// MinTime 设置为 30 秒，确保不会因为 ping 太频繁而拒绝连接
		// 客户端配置是 5 分钟发送一次，但如果有多个客户端连接，总的 ping 频率可能会更高
		// 设置为 30 秒可以更好地容忍多个客户端连接的情况
		grpc.KeepaliveEnforcementPolicy(keepalive.EnforcementPolicy{
			MinTime:             30 * time.Second, // 允许客户端每 30 秒发送一次 ping（更宽松，避免 too_many_pings 错误）
			PermitWithoutStream: true,             // 允许无流时发送 ping
		}),
		grpc.ChainUnaryInterceptor(
			logmw.UnaryLoggerInjectInterceptor(),
			logging.UnaryServerInterceptor(
				logmw.ZapLoggerAdapter(),
				logging.WithLogOnEvents(logging.FinishCall),
				logging.WithFieldsFromContext(logmw.FieldsFromCtx),
				logging.WithDurationField(func(d time.Duration) logging.Fields {
					return logging.Fields{"duration_ms", float64(d.Microseconds()) / 1000.0}
				}),
				logging.WithLevels(func(code codes.Code) logging.Level {
					switch code {
					case codes.OK:
						return logging.LevelInfo
					case codes.DeadlineExceeded, codes.Unavailable, codes.ResourceExhausted:
						return logging.LevelWarn
					default:
						return logging.LevelError
					}
				}),
			),
			servertoken.UnaryAuthInterceptor(verifier),
			recovery.UnaryServerInterceptor(
				recovery.WithRecoveryHandler(PanicRecoveryHandler),
			),
		),
	}
}

func PanicRecoveryHandler(p any) (err error) {
	logx.L().Error("grpc panic recovered",
		zap.Any("panic", p),
		zap.Stack("stack"),
	)
	fmt.Fprintf(os.Stderr, "panic: %v\n%s\n", p, debug.Stack())

	return status.Errorf(codes.Internal, "internal server error")
}
