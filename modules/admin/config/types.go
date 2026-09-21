package config

import (
	"os"
	"strings"

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
	Storage     StorageConfig      `koanf:"storage"`
}

type StorageConfig struct {
	Volumes      []string `koanf:"volumes"`
	DataShards   int      `koanf:"data_shards"`
	ParityShards int      `koanf:"parity_shards"`
}

func (s StorageConfig) Disks() []string {
	if len(s.Volumes) > 0 {
		return s.Volumes
	}
	raw := os.Getenv("STORAGES_VOLUMES")
	if raw != "" {
		parts := strings.Split(raw, ",")
		out := make([]string, 0, len(parts))
		for _, p := range parts {
			p = strings.TrimSpace(p)
			if p != "" {
				out = append(out, p)
			}
		}
		if len(out) > 0 {
			return out
		}
	}
	return []string{"./data/disk0", "./data/disk1", "./data/disk2", "./data/disk3"}
}

type I18nConfig struct {
	ErrorsLangsPath string `koanf:"errors_langs_path"`
}

type GRPCClientConfig struct {
	AuthAddr   string `koanf:"auth_addr"`
	S3Addr     string `koanf:"s3_addr"`
	ObjectAddr string `koanf:"object_addr"`
	IAMAddr    string `koanf:"iam_addr"`
	AdminAddr  string `koanf:"admin_addr"`
	NotifyAddr string `koanf:"notify_addr"`
}

type ServerConfig struct {
	Name      string                `koanf:"name"`
	Host      string                `koanf:"host"`
	HTTPPort  int                   `koanf:"http_port"`
	GRPCPort  int                   `koanf:"grpc_port"`
	AccessLog httpx.AccessLogConfig `koanf:"access_log"`
}
