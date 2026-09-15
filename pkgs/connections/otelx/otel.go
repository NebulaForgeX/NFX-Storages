package otelx

import (
	"context"
	"errors"

	"nfxstorages/pkgs/env"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploggrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	otellogglobal "go.opentelemetry.io/otel/log/global"
	"go.opentelemetry.io/otel/propagation"
	sdklog "go.opentelemetry.io/otel/sdk/log"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.34.0"
)

type ShutdownFunc func(context.Context) error

func noop(context.Context) error { return nil }

func Init(ctx context.Context, cfg Config, serviceName string, e env.Env) (ShutdownFunc, error) {
	cfg = cfg.WithDefaults()
	setEnabled(false)
	setTracesEnabled(false)
	if !cfg.Enabled {
		return noop, nil
	}
	if cfg.Endpoint == "" {
		return noop, errors.New("otelx: endpoint is required when enabled")
	}

	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceName(serviceName),
			attribute.String("deployment.environment", e.String()),
		),
	)
	if err != nil {
		return noop, err
	}

	var shutdowns []ShutdownFunc
	rollback := func() {
		c, cancel := context.WithTimeout(context.Background(), cfg.ExportTimeout)
		defer cancel()
		for i := len(shutdowns) - 1; i >= 0; i-- {
			_ = shutdowns[i](c)
		}
	}

	if cfg.Traces {
		traceExp, err := otlptracegrpc.New(ctx, traceOpts(cfg)...)
		if err != nil {
			rollback()
			return noop, err
		}
		tp := sdktrace.NewTracerProvider(
			sdktrace.WithSampler(buildSampler(cfg)),
			sdktrace.WithBatcher(traceExp),
			sdktrace.WithResource(res),
		)
		otel.SetTracerProvider(tp)
		shutdowns = append(shutdowns, tp.Shutdown)
	}

	if cfg.Metrics {
		metricExp, err := otlpmetricgrpc.New(ctx, metricOpts(cfg)...)
		if err != nil {
			rollback()
			return noop, err
		}
		mp := sdkmetric.NewMeterProvider(
			sdkmetric.WithResource(res),
			sdkmetric.WithReader(sdkmetric.NewPeriodicReader(metricExp)),
		)
		otel.SetMeterProvider(mp)
		shutdowns = append(shutdowns, mp.Shutdown)
	}

	if cfg.Logs {
		logExp, err := otlploggrpc.New(ctx, logOpts(cfg)...)
		if err != nil {
			rollback()
			return noop, err
		}
		lp := sdklog.NewLoggerProvider(
			sdklog.WithResource(res),
			sdklog.WithProcessor(sdklog.NewBatchProcessor(logExp)),
		)
		otellogglobal.SetLoggerProvider(lp)
		shutdowns = append(shutdowns, lp.Shutdown)
	}

	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	setEnabled(true)
	setTracesEnabled(cfg.Traces)

	return func(ctx context.Context) error {
		if _, ok := ctx.Deadline(); !ok {
			var cancel context.CancelFunc
			ctx, cancel = context.WithTimeout(ctx, cfg.ExportTimeout)
			defer cancel()
		}
		setEnabled(false)
		setTracesEnabled(false)
		var errs []error
		for i := len(shutdowns) - 1; i >= 0; i-- {
			if err := shutdowns[i](ctx); err != nil {
				errs = append(errs, err)
			}
		}
		return errors.Join(errs...)
	}, nil
}

func traceOpts(cfg Config) []otlptracegrpc.Option {
	opts := []otlptracegrpc.Option{
		otlptracegrpc.WithEndpoint(cfg.Endpoint),
		otlptracegrpc.WithTimeout(cfg.ExportTimeout),
	}
	if cfg.Insecure {
		opts = append(opts, otlptracegrpc.WithInsecure())
	}
	return opts
}

func metricOpts(cfg Config) []otlpmetricgrpc.Option {
	opts := []otlpmetricgrpc.Option{
		otlpmetricgrpc.WithEndpoint(cfg.Endpoint),
		otlpmetricgrpc.WithTimeout(cfg.ExportTimeout),
	}
	if cfg.Insecure {
		opts = append(opts, otlpmetricgrpc.WithInsecure())
	}
	return opts
}

func logOpts(cfg Config) []otlploggrpc.Option {
	opts := []otlploggrpc.Option{
		otlploggrpc.WithEndpoint(cfg.Endpoint),
		otlploggrpc.WithTimeout(cfg.ExportTimeout),
	}
	if cfg.Insecure {
		opts = append(opts, otlploggrpc.WithInsecure())
	}
	return opts
}
