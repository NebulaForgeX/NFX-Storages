package token

import (
	"context"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	Registered jwt.RegisteredClaims
	Raw        map[string]any
}

type Verifier interface {
	Verify(ctx context.Context, token string) (*Claims, error)
}
