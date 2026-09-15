package logx

import (
	"fmt"
	"nfxstorages/pkgs/env"
	"os"
	"sync"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

var (
	global *zap.Logger
	once   sync.Once
)

type LoggerConfig struct {
	Level      string `koanf:"level"`     // debug | info | warn | error
	Format     string `koanf:"format"`    // json | console
	Output     string `koanf:"output"`    // stdout | file
	FilePath   string `koanf:"file_path"` // when output=file
	MaxSizeMB  int    `koanf:"max_size_mb"`
	MaxBackups int    `koanf:"max_backups"`
	MaxAgeDay  int    `koanf:"max_age_day"`
	Compress   bool   `koanf:"compress"`
}

func Init(cfg LoggerConfig, svcName string, env env.Env) error {
	var err error
	once.Do(func() {
		// === base config ===
		baseCfg := zap.NewProductionEncoderConfig()
		baseCfg.EncodeLevel = zapcore.CapitalColorLevelEncoder
		baseCfg.EncodeCaller = zapcore.ShortCallerEncoder
		baseCfg.FunctionKey = zapcore.OmitKey

		tag := fmt.Sprintf("[%s %s]", svcName, env.String())
		baseCfg.EncodeTime = func(t time.Time, enc zapcore.PrimitiveArrayEncoder) {
			enc.AppendString(
				tag + " " +
					t.Format("2006/01/02 15:04:05.000"),
			)
		}

		// === info config ===
		infoCfg := baseCfg
		infoCfg.CallerKey = ""
		infoEnc := newEncoder(infoCfg, cfg.Format)

		// === debug config ===
		debugCfg := baseCfg
		debugCfg.CallerKey = "caller"
		debugCfg.EncodeCaller = zapcore.ShortCallerEncoder
		debugEnc := newEncoder(debugCfg, cfg.Format)

		// === warn config ===
		warnCfg := debugCfg
		warnEnc := newEncoder(warnCfg, cfg.Format)

		// === writeSyncer ===
		var ws zapcore.WriteSyncer
		if cfg.Output == "file" {
			lj := &lumberjack.Logger{
				Filename:   cfg.FilePath,
				MaxSize:    cfg.MaxSizeMB,
				MaxBackups: cfg.MaxBackups,
				MaxAge:     cfg.MaxAgeDay,
				Compress:   cfg.Compress,
			}
			ws = zapcore.AddSync(lj)
		} else {
			ws = zapcore.AddSync(os.Stdout)
		}

		debugLevel := zap.LevelEnablerFunc(func(l zapcore.Level) bool { return l == zapcore.DebugLevel })
		infoLevel := zap.LevelEnablerFunc(func(l zapcore.Level) bool { return l == zapcore.InfoLevel })
		warnLevel := zap.LevelEnablerFunc(func(l zapcore.Level) bool { return l >= zapcore.WarnLevel })

		coreDebug := zapcore.NewCore(debugEnc, ws, debugLevel)
		coreInfo := zapcore.NewCore(infoEnc, ws, infoLevel)
		coreWarn := zapcore.NewCore(warnEnc, ws, warnLevel)

		tee := zapcore.NewTee(coreDebug, coreInfo, coreWarn)

		// TODO: sampling
		// TODO: Sentry / Loki hooks

		global = zap.New(tee, zap.AddCaller())
	})
	return err
}

func L() *zap.Logger { return global }

func S() *zap.SugaredLogger { return global.Sugar() }

func Sync() { global.Sync() }

func newEncoder(cfg zapcore.EncoderConfig, format string) zapcore.Encoder {
	if format == "console" {
		return zapcore.NewConsoleEncoder(cfg)
	}
	return zapcore.NewJSONEncoder(cfg)
}
