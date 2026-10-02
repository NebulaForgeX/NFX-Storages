package otelx

import "time"

type Config struct {
	Enabled       bool          `koanf:"enabled"`
	Endpoint      string        `koanf:"endpoint"`
	Insecure      bool          `koanf:"insecure"`
	SamplerArg    float64       `koanf:"sampler_arg"`
	Traces        bool          `koanf:"traces"`
	Metrics       bool          `koanf:"metrics"`
	Logs          bool          `koanf:"logs"`
	ExportTimeout time.Duration `koanf:"export_timeout"`
}

func (c Config) WithDefaults() Config {
	if c.ExportTimeout <= 0 {
		c.ExportTimeout = 10 * time.Second
	}
	if c.SamplerArg <= 0 {
		c.SamplerArg = 1.0
	}
	if c.SamplerArg > 1 {
		c.SamplerArg = 1.0
	}
	return c
}
