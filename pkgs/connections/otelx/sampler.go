package otelx

import sdktrace "go.opentelemetry.io/otel/sdk/trace"

func buildSampler(cfg Config) sdktrace.Sampler {
	return sdktrace.ParentBased(sdktrace.TraceIDRatioBased(cfg.SamplerArg))
}
