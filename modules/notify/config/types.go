package config

import (
	"nfxstorages/pkgs/cachex"
	"nfxstorages/pkgs/connections/otelx"
	"nfxstorages/pkgs/env"
	"nfxstorages/pkgs/httpx"
	"nfxstorages/pkgs/kafkax"
	"nfxstorages/pkgs/logx"
	"nfxstorages/pkgs/postgresqlx"
	"nfxstorages/pkgs/tokenx"
)

type Config struct {
	Env         env.Env
	Server      ServerConfig       `koanf:"server"`
	PostgreSQL  postgresqlx.Config `koanf:"postgresql"`
	Cache       cachex.ConnConfig  `koanf:"cache"`
	Logger      logx.LoggerConfig  `koanf:"logger"`
	KafkaConfig kafkax.Config      `koanf:"kafka"`
	GRPCClient  GRPCClientConfig   `koanf:"grpc_client"`
	Token       tokenx.Config      `koanf:"token"`
	I18n        I18nConfig         `koanf:"i18n"`
	OTEL        otelx.Config       `koanf:"otel"`
}

type I18nConfig struct {
	ErrorsLangsPath string `koanf:"errors_langs_path"`
}

type GRPCClientConfig struct {
	AuthAddr   string `koanf:"auth_addr"`
	SourceAddr string `koanf:"source_addr"`
	NewsAddr   string `koanf:"news_addr"`
	CrawlAddr  string `koanf:"crawl_addr"`
	ReportAddr string `koanf:"report_addr"`
	NotifyAddr string `koanf:"notify_addr"`
	MCPAddr    string `koanf:"mcp_addr"`
	SystemAddr string `koanf:"system_addr"`
}

type ServerConfig struct {
	Name      string                `koanf:"name"`
	Host      string                `koanf:"host"`
	HTTPPort  int                   `koanf:"http_port"`
	GRPCPort  int                   `koanf:"grpc_port"`
	AccessLog httpx.AccessLogConfig `koanf:"access_log"`
}
