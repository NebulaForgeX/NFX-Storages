package circuitbreaker

import (
	"context"
	"nfxstorages/pkgs/retry"

	"github.com/sony/gobreaker"
	"google.golang.org/grpc"
)

func (m *Manager) UnaryClientInterceptorWithRetry(retryCfg retry.Config) grpc.UnaryClientInterceptor {
	return func(
		ctx context.Context,
		method string,
		req, reply any,
		cc *grpc.ClientConn,
		invoker grpc.UnaryInvoker,
		opts ...grpc.CallOption,
	) error {
		key := m.keyFn(method, cc.Target())
		cb := m.get(key)

		if cb == nil {
			_, err := retry.Retry(ctx, func(ctx context.Context) (any, error) {
				return nil, invoker(ctx, method, req, reply, cc, opts...)
			}, retryCfg)
			return err
		}

		// Half-Open should retry only 1 time
		if cb.State() == gobreaker.StateHalfOpen {
			retryCfg.MaxTries = 1
		}

		_, err := retry.Retry(ctx, func(ctx context.Context) (any, error) {
			return cb.Execute(func() (any, error) {
				return nil, invoker(ctx, method, req, reply, cc, opts...)
			})
		}, retryCfg)
		return err
	}
}
