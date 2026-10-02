package usertoken

import (
	"context"
	"errors"
	"nfxstorages/pkgs/security/token"
	"nfxstorages/pkgs/utils/mapx"
	"time"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/golang-jwt/jwt/v5"
)

type verifier struct {
	openIDConfig *OpenIDConfig
	jwk          keyfunc.Keyfunc
	allowedSkew  time.Duration
}

type VerifierOption func(*verifier)

func WithAllowedSkew(d time.Duration) VerifierOption {
	return func(v *verifier) { v.allowedSkew = d }
}

func NewVerifier(issuerEndpoint string, opts ...VerifierOption) (token.Verifier, error) {
	openIDConfig, err := FetchOpenIDConfiguration(issuerEndpoint)
	if err != nil {
		return nil, err
	}
	jwk, err := keyfunc.NewDefault([]string{openIDConfig.JWKsURI})
	if err != nil {
		return nil, err
	}
	v := &verifier{
		openIDConfig: openIDConfig,
		jwk:          jwk,
		allowedSkew:  5 * time.Second, // default value
	}

	for _, opt := range opts {
		opt(v)
	}

	return v, nil
}

func (v *verifier) Verify(ctx context.Context, tokenStr string) (*token.Claims, error) {
	mc := jwt.MapClaims{}
	userToken, err := jwt.ParseWithClaims(
		tokenStr, mc,
		v.jwk.KeyfuncCtx(ctx),
		jwt.WithIssuer(v.openIDConfig.Issuer),
		jwt.WithValidMethods(v.openIDConfig.IDTokenSigningAlgs),
		jwt.WithLeeway(v.allowedSkew),
	)
	if err != nil || !userToken.Valid {
		return nil, err
	}

	if tokenUse := mapx.GetMapValue[string](mc, "token_use"); tokenUse != "access" {
		return nil, errors.New("invalid token use")
	}

	// return ParseAccessTokenClaims(claims)
	return &token.Claims{
		Registered: token.MapClaimsToRegisteredClaims(mc),
		Raw:        map[string]any(mc),
	}, nil
}
