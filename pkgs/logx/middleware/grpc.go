package middleware

import (
	"context"
	"net"
	"nfxstorages/pkgs/logx"
	"strconv"

	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/logging"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/peer"
)

func ZapLoggerAdapter() logging.Logger {
	if logx.L() == nil {
		panic("logx is not initialized")
	}
	return logging.LoggerFunc(func(ctx context.Context, lvl logging.Level, msg string, fields ...any) {
		// 拿"裸 logger"，把这次中间件给的 fields 转成 zap.Field 一次性写入
		l := logx.From(ctx)
		zf := LogFieldsToZap(fields)
		logger := l.WithOptions(zap.WithCaller(false)).With(zf...) // 仅加这次的 fields

		switch lvl {
		case logging.LevelDebug:
			logger.Debug(msg)
		case logging.LevelInfo:
			logger.Info(msg)
		case logging.LevelWarn:
			logger.Warn(msg)
		case logging.LevelError:
			logger.Error(msg)
		default:
			logger.Info(msg)
		}
	})
}

func UnaryLoggerInjectInterceptor() grpc.UnaryServerInterceptor {
	return func(
		ctx context.Context,
		req any,
		info *grpc.UnaryServerInfo,
		handler grpc.UnaryHandler,
	) (any, error) {
		// 仅注入"裸"logger，字段统一交给 WithFieldsFromContext
		ctx = logx.With(ctx, logx.L())
		return handler(ctx, req)
	}
}

// FieldsFromCtx 只负责"你自家的"上下文字段，避免和中间件默认键冲突
func FieldsFromCtx(ctx context.Context) logging.Fields {
	fs := make(logging.Fields, 0, 8)

	// 添加 trace 和 span 信息
	if span := trace.SpanFromContext(ctx); span != nil {
		sc := span.SpanContext()
		if sc.IsValid() {
			fs = append(fs,
				"trace_id", sc.TraceID().String(),
				"span_id", sc.SpanID().String(),
			)
		}
	}

	// 添加对端信息
	if p, ok := peer.FromContext(ctx); ok && p != nil && p.Addr != nil {
		host, portStr, _ := net.SplitHostPort(p.Addr.String())
		if host != "" {
			fs = append(fs, "net.peer.ip", host)
		}
		if port, _ := strconv.Atoi(portStr); port > 0 {
			fs = append(fs, "net.peer.port", port)
		}
	}

	// 标注协议体系，和 Trace 语义一致
	fs = append(fs, "rpc.system", "grpc")

	return fs
}

func LogFieldsToZap(fields logging.Fields) []zap.Field {
	zf := make([]zap.Field, 0, len(fields)/2)
	for i := 0; i+1 < len(fields); i += 2 {
		key, ok := fields[i].(string)
		if !ok {
			continue
		}
		zf = append(zf, zap.Any(key, fields[i+1]))
	}
	return zf
}
