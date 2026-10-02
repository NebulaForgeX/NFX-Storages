package fiberx

import (
	"context"

	"go.opentelemetry.io/otel/trace"
)

func TraceIDFromContext(ctx context.Context) string {
	if sc := trace.SpanContextFromContext(ctx); sc.IsValid() {
		return sc.TraceID().String()
	}
	return ""
}
