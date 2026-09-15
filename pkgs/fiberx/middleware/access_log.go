package middleware

import (
	"nfxstorages/pkgs/httpx"
	"nfxstorages/pkgs/logx"

	fiberzap "github.com/gofiber/contrib/v3/zap"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/logger"
)

// AccessLog returns a handler that logs each HTTP request (like Rex-Backend).
// Mode: "original" = Fiber default logger, "logger" = zap via gofiber/contrib, "off" = no log.
func AccessLog(cfg httpx.AccessLogConfig) fiber.Handler {
	switch cfg.Mode {
	case "original":
		return logger.New()
	case "logger":
		return fiberzap.New(fiberzap.Config{
			Logger: logx.L(),
		})
	case "off":
		return func(c fiber.Ctx) error {
			return c.Next()
		}
	default:
		if cfg.Mode == "" {
			return fiberzap.New(fiberzap.Config{Logger: logx.L()})
		}
		return nil
	}
}
