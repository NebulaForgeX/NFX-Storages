package usertoken

import (
	"nfxstorages/pkgs/security/token"
	"strings"

	fiberWebSocket "github.com/gofiber/contrib/v3/websocket"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

func WebSocketJWTMiddleware(verifier token.Verifier) fiber.Handler {
	return func(c fiber.Ctx) error {
		if !fiberWebSocket.IsWebSocketUpgrade(c) {
			return fiber.ErrUpgradeRequired
		}
		// ① 先看 Authorization 头
		tokenStr := strings.TrimPrefix(c.Get("Authorization"), "Bearer ")
		// ② 再看子协议 jwt,<token>
		if tokenStr == "" {
			if p := c.Get("Sec-WebSocket-Protocol"); strings.HasPrefix(p, "jwt,") {
				tokenStr = strings.TrimSpace(strings.TrimPrefix(p, "jwt,"))
			}
		}
		if tokenStr == "" {
			return fiber.NewError(fiber.StatusUnauthorized, "Missing token")
		}
		claims, err := verifier.Verify(c.Context(), tokenStr)
		if err != nil {
			return fiber.NewError(fiber.StatusUnauthorized, "Invalid token")
		}

		userID, err := uuid.Parse(claims.Registered.Subject)
		if err != nil {
			return fiber.NewError(fiber.StatusUnauthorized, "Invalid token")
		}
		c.Locals("userID", userID)

		return c.Next()
	}
}
