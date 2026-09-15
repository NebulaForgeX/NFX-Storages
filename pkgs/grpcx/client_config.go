package grpcx

import (
	"time"

	"nfxstorages/pkgs/circuitbreaker"
	"nfxstorages/pkgs/logx"
	"nfxstorages/pkgs/retry"
	"nfxstorages/pkgs/security/token/servertoken"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/keepalive"
)

var DefaultRetryCfg = retry.Config{
	InitialInterval:   100 * time.Millisecond,
	MaxInterval:       1 * time.Second,
	Multiplier:        2.0,
	Jitter:            0.2,              // ±20% 抖动
	MaxTries:          3,                // 总尝试次数（含第一次）
	MaxElapsedTime:    15 * time.Second, // 可选：整个重试上限
	PerAttemptTimeout: 5 * time.Second,  // 每次尝试上限（会被父 ctx 剩余时间钳制）
	ShouldRetry:       shouldRetryAvailOnly,
	Notify: func(err error, attempt uint, duration time.Duration) { // 可埋点
		logx.S().Warnf("GRPC connection attempt failed in attempt %d: %v, retrying in %s", attempt, err, duration)
	},
}

// DefaultClientOptions 默认的 gRPC 客户端选项
func DefaultClientOptions(provider servertoken.TokenProvider) []grpc.DialOption {
	cbm := circuitbreaker.NewManager(
		circuitbreaker.WithIsSuccessful(func(err error) bool {
			return !IsAvailabilityError(err)
		}),
	)

	return []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithPerRPCCredentials(servertoken.PerRPCCreds{Provider: provider, InsecureOK: true}),
		grpc.WithKeepaliveParams(keepalive.ClientParameters{
			Time:                10 * time.Minute, // 10分钟发送一次 keepalive（减少 ping 频率，避免 too_many_pings 错误）
			Timeout:             20 * time.Second, // 20秒超时
			PermitWithoutStream: true,             // 允许无流时发送
		}),
		grpc.WithInitialWindowSize(64 * 1024),     // 64KB 初始窗口大小
		grpc.WithInitialConnWindowSize(64 * 1024), // 64KB 连接窗口大小
		grpc.WithUnaryInterceptor(
			cbm.UnaryClientInterceptorWithRetry(DefaultRetryCfg),
		),
	}
}

func shouldRetryAvailOnly(err error, attempt uint, duration time.Duration) bool {
	if err == nil {
		return false
	}
	//  circuit breaker reject: request failed, don't retry in current loop
	if circuitbreaker.IsCircuitBreakerError(err) {
		return false
	}
	return IsAvailabilityError(err)
}
