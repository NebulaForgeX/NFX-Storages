package servertoken

import (
	"context"
	"nfxstorages/pkgs/security/token"
	"strings"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

type ServiceContextKey string

const (
	ServiceIDKey ServiceContextKey = "service_id"
)

func UnaryAuthInterceptor(verifier token.Verifier) grpc.UnaryServerInterceptor {
	return func(
		ctx context.Context,
		req any,
		info *grpc.UnaryServerInfo,
		handler grpc.UnaryHandler,
	) (any, error) {
		// 跳过 health check 方法的认证（允许在系统初始化时进行健康检查）
		if strings.HasSuffix(info.FullMethod, "/GetHealth") {
			return handler(ctx, req)
		}
		// // 跳过 schema clear 方法的认证（允许在系统初始化时清空 schema）
		// if strings.HasSuffix(info.FullMethod, "/ClearSchema") {
		// 	return handler(ctx, req)
		// }
		md, ok := metadata.FromIncomingContext(ctx)
		if !ok {
			return nil, status.Error(codes.Unauthenticated, "missing metadata")
		}
		auth := strings.Join(md.Get("authorization"), "")
		if !strings.HasPrefix(auth, "Bearer ") {
			return nil, status.Error(codes.Unauthenticated, "missing or invalid Authorization header")
		}

		tokenStr := strings.TrimPrefix(auth, "Bearer ")
		claims, err := verifier.Verify(ctx, tokenStr)
		if err != nil {
			// 返回详细错误信息以便调试
			return nil, status.Errorf(codes.Unauthenticated, "invalid or expired token: %v", err)
		}

		// Inject service ID into context
		ctx = context.WithValue(ctx, ServiceIDKey, claims.Registered.Subject)

		return handler(ctx, req)
	}
}

// GetServiceID retrieves the service ID from the context
func GetServiceID(ctx context.Context) (string, bool) {
	serviceID, ok := ctx.Value(ServiceIDKey).(string)
	return serviceID, ok
}
