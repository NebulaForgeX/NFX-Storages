package servertoken

import (
	"context"
	"fmt"
	"nfxstorages/pkgs/security/token"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type verifier struct {
	signer      Signer
	issuer      string
	allowedSkew time.Duration // clock drift
}

type VerifierOption func(*verifier)

func WithAllowedSkew(d time.Duration) VerifierOption {
	return func(v *verifier) { v.allowedSkew = d }
}

func NewVerifier(signer Signer, issuer string, opts ...VerifierOption) token.Verifier {
	v := &verifier{
		signer:      signer,
		issuer:      issuer,
		allowedSkew: 5 * time.Second, // default value
	}

	for _, opt := range opts {
		opt(v)
	}

	return v
}

func (v *verifier) Verify(ctx context.Context, tok string) (*token.Claims, error) {
	mc := jwt.MapClaims{}
	serverToken, err := jwt.ParseWithClaims(
		tok, mc,
		func(t *jwt.Token) (any, error) {
			// 从 Signer 获取验证密钥
			// 对于 HMAC，返回 Key；对于 RSA，需要公钥
			switch s := v.signer.(type) {
			case *HMACSigner:
				return s.Key, nil
			case *RSASigner:
				// 对于 RSA 验证，我们需要公钥，但 Signer 只有私钥
				// 这里需要根据实际需求调整
				return s.Key.Public(), nil
			default:
				return nil, jwt.ErrInvalidKey
			}
		},
		jwt.WithIssuer(v.issuer),
		jwt.WithValidMethods([]string{v.signer.Method().Alg()}),
		jwt.WithLeeway(v.allowedSkew),
	)
	if err != nil {
		// 返回详细错误信息以便调试
		return nil, fmt.Errorf("token verification failed: %w (issuer expected: %s)", err, v.issuer)
	}
	if !serverToken.Valid {
		return nil, fmt.Errorf("token is not valid (issuer expected: %s)", v.issuer)
	}

	return &token.Claims{
		Registered: token.MapClaimsToRegisteredClaims(mc),
		Raw:        map[string]any(mc),
	}, nil
}
