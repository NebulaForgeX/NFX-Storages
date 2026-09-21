package middleware

import (
	"time"

	"nfxstorages/pkgs/fiberx"
	"nfxstorages/pkgs/httpx"
	"nfxstorages/pkgs/logx"

	fiberzap "github.com/gofiber/contrib/v3/zap"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/logger"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// AccessLog returns a handler that logs each HTTP request.
// Mode: "original" = Fiber default logger, "logger" = zap, "logger_pretty" = zap + JSON 格式化, "off" = no log.
// Format: 仅 Mode=logger 时有效， "pretty" 时 JSON 换行缩进输出。
func AccessLog(cfg httpx.AccessLogConfig) fiber.Handler {
	usePretty := cfg.Mode == "logger_pretty" || (cfg.Mode == "logger" && cfg.Format == "pretty")
	if usePretty {
		return accessLogPretty()
	}
	switch cfg.Mode {
	case "original":
		return logger.New()
	case "logger":
		return fiberzap.New(fiberzap.Config{
			Logger: logx.L(),
			Levels: []zapcore.Level{zapcore.ErrorLevel, zapcore.ErrorLevel, zapcore.InfoLevel},
		})
	case "off":
		return func(c fiber.Ctx) error {
			return c.Next()
		}
	default:
		if cfg.Mode == "" {
			return fiberzap.New(fiberzap.Config{
				Logger: logx.L(),
				Levels: []zapcore.Level{zapcore.ErrorLevel, zapcore.ErrorLevel, zapcore.InfoLevel},
			})
		}
		return nil
	}
}

func accessLogPretty() fiber.Handler {
	return func(c fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		latency := time.Since(start)
		url := c.Path()
		if c.Path() != c.OriginalURL() {
			url = c.OriginalURL()
		}
		logx.L().Info("Success",
			zap.String("trace_id", fiberx.TraceIDFromContext(c.Context())),
			zap.String("ip", c.IP()),
			zap.String("latency", latency.String()),
			zap.Int("status", c.Response().StatusCode()),
			zap.String("method", c.Method()),
			zap.String("url", url),
		)
		return err
	}
}
