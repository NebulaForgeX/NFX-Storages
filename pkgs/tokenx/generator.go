package tokenx

import (
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

type Generator struct {
	cfg Config
}

func NewGenerator(cfg Config) *Generator {
	return &Generator{cfg: cfg}
}

func (g *Generator) GenerateAccessToken(accountID, profileID, username, email, phone, profileScope string) (string, error) {
	claims := NewAccessTokenClaims(accountID, profileID, username, email, phone, profileScope, g.cfg.Issuer, g.cfg.AccessTokenTTL)
	return g.signToken(claims)
}

func (g *Generator) GenerateRefreshToken(accountID, profileID, username, email, phone, profileScope string) (string, error) {
	claims := NewRefreshTokenClaims(accountID, profileID, username, email, phone, profileScope, g.cfg.Issuer, g.cfg.RefreshTokenTTL)
	return g.signToken(claims)
}

func (g *Generator) GenerateRefreshTokenWithID(accountID, profileID, username, email, phone, profileScope, tokenID string) (string, error) {
	claims := NewRefreshTokenClaimsWithID(accountID, profileID, username, email, phone, profileScope, g.cfg.Issuer, g.cfg.RefreshTokenTTL, tokenID)
	return g.signToken(claims)
}

func (g *Generator) GenerateTokenPair(accountID, profileID, username, email, phone, profileScope string) (accessToken, refreshToken string, err error) {
	accessToken, err = g.GenerateAccessToken(accountID, profileID, username, email, phone, profileScope)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate access token: %w", err)
	}
	refreshToken, err = g.GenerateRefreshToken(accountID, profileID, username, email, phone, profileScope)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate refresh token: %w", err)
	}
	return accessToken, refreshToken, nil
}

func (g *Generator) GenerateTokenPairWithRefreshID(
	accountID, profileID, username, email, phone, profileScope, refreshTokenID string,
) (accessToken, refreshToken string, err error) {
	accessToken, err = g.GenerateAccessToken(accountID, profileID, username, email, phone, profileScope)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate access token: %w", err)
	}
	refreshToken, err = g.GenerateRefreshTokenWithID(accountID, profileID, username, email, phone, profileScope, refreshTokenID)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate refresh token: %w", err)
	}
	return accessToken, refreshToken, nil
}

func (g *Generator) signToken(claims *TokenClaims) (string, error) {
	method := jwt.GetSigningMethod(g.cfg.Algorithm)
	if method == nil {
		return "", fmt.Errorf("unsupported signing method: %s", g.cfg.Algorithm)
	}
	token := jwt.NewWithClaims(method, claims)
	return token.SignedString([]byte(g.cfg.SecretKey))
}
