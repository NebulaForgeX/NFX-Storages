package middleware

import (
	"runtime/debug"

	"nfxstorages/pkgs/logx"

	"github.com/gofiber/fiber/v3"
	fiberrecover "github.com/gofiber/fiber/v3/middleware/recover"
	"go.uber.org/zap"
)

func Recover() fiber.Handler {
	return fiberrecover.New(fiberrecover.Config{
		EnableStackTrace: true,
		StackTraceHandler: func(c fiber.Ctx, e any) {
			l := logx.From(c.Context())
			l.Error("panic recovered",
				zap.String("ip", c.IP()),
				zap.String("user_agent", c.Get("User-Agent")),
				zap.Any("panic", e),
				zap.ByteString("stack", debug.Stack()),
			)
		},
	})
}
