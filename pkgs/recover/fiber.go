package recover

import (
	"fmt"
	"os"
	"runtime/debug"

	"nfxstorages/pkgs/errx"
	"nfxstorages/pkgs/fiberx"
	"nfxstorages/pkgs/logx"

	"github.com/gofiber/fiber/v3"
	"go.uber.org/zap"
)

func RecoverMiddleware() fiber.Handler {
	return func(c fiber.Ctx) error {
		defer func() {
			if r := recover(); r != nil {
				// Get logger from context or use global logger
				logger := logx.From(c.Context())
				if logger == nil {
					logger = logx.L()
				}

				// Log the panic with detailed information
				logger.Error("panic recovered",
					zap.Any("panic", r),
					zap.String("method", c.Method()),
					zap.String("path", c.Path()),
					zap.String("ip", c.IP()),
					zap.String("user_agent", c.Get("User-Agent")),
					zap.String("stack", string(debug.Stack())),
				)
				fmt.Fprintf(os.Stderr, "panic: %v\n%s\n", r, debug.Stack())

				_ = fiberx.ErrorFromErrx(c, errx.ErrInternal)
			}
		}()

		return c.Next()
	}
}

// fiber:context-methods migrated
