package middleware

import (
	"nfxstorages/pkgs/errx"
	"nfxstorages/pkgs/fiberx"
	"nfxstorages/pkgs/security/token"
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

var (
	ErrInvalidAuthHeader = errx.Unauthorized("INVALID_AUTH_HEADER", "missing or invalid Authorization header")
	ErrInvalidToken      = errx.Unauthorized("INVALID_TOKEN", "invalid or expired token")
)

func TokenAuth(verifier token.Verifier) fiber.Handler {
	return func(c fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			return fiberx.ErrorFromErrx(c, ErrInvalidAuthHeader)
		}
		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := verifier.Verify(c.Context(), tokenStr)
		if err != nil {
			return fiberx.ErrorFromErrx(c, ErrInvalidToken.WithCause(err))
		}
		userID, err := uuid.Parse(claims.Registered.Subject)
		if err != nil {
			return fiberx.ErrorFromErrx(c, ErrInvalidToken.WithCause(err))
		}
		ctx := fiberx.WithAccountID(c.Context(), userID)
		if raw, ok := claims.Raw["account_id"].(string); ok {
			if aid, err := uuid.Parse(raw); err == nil {
				ctx = fiberx.WithAccountID(ctx, aid)
			}
		}
		if raw, ok := claims.Raw["profile_id"].(string); ok {
			if pid, err := uuid.Parse(raw); err == nil {
				ctx = fiberx.WithProfileID(ctx, pid)
			}
		}
		if raw, ok := claims.Raw["profile_scope"].(string); ok {
			ctx = fiberx.WithProfileScope(ctx, raw)
		}
		c.SetContext(ctx)
		return c.Next()
	}
}
