package middleware

import (
	"nfxstorages/pkgs/fiberx"
	"nfxstorages/pkgs/logx"

	"github.com/gofiber/fiber/v3"
	"go.uber.org/zap"
)

func Logger() fiber.Handler {
	if logx.L() == nil {
		panic("logx is not initialized")
	}
	return func(c fiber.Ctx) error {
		traceID := fiberx.TraceIDFromContext(c.Context())
		l := logx.L().With(
			zap.String("trace_id", traceID),
			zap.String("method", c.Method()),
			zap.String("path", c.Path()),
		)
		c.SetContext(logx.With(c.Context(), l))
		return c.Next()
	}
}
