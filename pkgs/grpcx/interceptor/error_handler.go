package interceptor

import (
	"context"
	"encoding/json"

	"nfxstorages/pkgs/errx"
	"nfxstorages/pkgs/logx"

	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/status"
)

// UnaryErrorHandler converts handler errors to gRPC status (errx -> codes + message). Handlers return err only.
func UnaryErrorHandler() grpc.UnaryServerInterceptor {
	return func(
		ctx context.Context,
		req any,
		info *grpc.UnaryServerInfo,
		handler grpc.UnaryHandler,
	) (any, error) {
		resp, err := handler(ctx, req)
		if err == nil {
			return resp, nil
		}
		if _, ok := status.FromError(err); ok {
			return resp, err
		}
		e := normalizeErr(err)
		logError(ctx, e)
		return resp, toGRPCStatus(e)
	}
}

func normalizeErr(err error) *errx.Error {
	if err == nil {
		return nil
	}
	if e := errx.AsError(err); e != nil {
		return e
	}
	return errx.ErrInternal.WithCause(err)
}

func toGRPCStatus(e *errx.Error) error {
	if e == nil {
		return nil
	}
	code := errx.GRPCCodeFromKind(e.Kind)
	msg := buildDetailMessage(e)
	return status.New(code, msg).Err()
}

type errorPayload struct {
	Code    string         `json:"code"`
	Message string         `json:"message"`
	Details map[string]any `json:"details,omitempty"`
}

func buildDetailMessage(e *errx.Error) string {
	payload := errorPayload{
		Code:    e.Code,
		Message: e.Message,
		Details: e.Details,
	}
	data, err := json.Marshal(payload)
	if err != nil {
		if e.Code != "" {
			return e.Code + ": " + e.Message
		}
		return e.Message
	}
	return string(data)
}

func logError(ctx context.Context, e *errx.Error) {
	if e == nil {
		return
	}
	l := logx.From(ctx)
	fields := []zap.Field{zap.String("error_code", e.Code)}
	if e.Cause != nil {
		fields = append(fields, zap.Error(e.Cause))
	}
	if len(e.Details) > 0 {
		fields = append(fields, zap.Any("details", e.Details))
	}
	switch {
	case e.Kind == errx.KindInternal:
		l.Error("grpc request failed", fields...)
	case e.Kind == errx.KindFailedPrecondition || e.Kind == errx.KindConflict:
		l.Warn("grpc request rejected", fields...)
	default:
		l.Debug("grpc request rejected", fields...)
	}
}
