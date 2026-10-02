package tokenx

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Verifier Token 验证器
type Verifier struct {
	cfg Config
}

// NewVerifier 创建新的 Token 验证器
func NewVerifier(cfg Config) *Verifier {
	return &Verifier{
		cfg: cfg,
	}
}

// VerifyAccessToken 验证 Access Token
func (v *Verifier) VerifyAccessToken(tokenString string) (*TokenClaims, error) {
	claims, err := v.verifyToken(tokenString)
	if err != nil {
		return nil, err
	}

	if claims.Type != TokenTypeAccess {
		return nil, fmt.Errorf("invalid token type: expected access, got %s", claims.Type)
	}

	return claims, nil
}

// VerifyRefreshToken 验证 Refresh Token
func (v *Verifier) VerifyRefreshToken(tokenString string) (*TokenClaims, error) {
	claims, err := v.verifyToken(tokenString)
	if err != nil {
		return nil, err
	}

	if claims.Type != TokenTypeRefresh {
		return nil, fmt.Errorf("invalid token type: expected refresh, got %s", claims.Type)
	}

	return claims, nil
}

// VerifyToken 验证 Token（不检查类型）
func (v *Verifier) VerifyToken(tokenString string) (*TokenClaims, error) {
	return v.verifyToken(tokenString)
}

// verifyToken 验证 Token 的通用方法
func (v *Verifier) verifyToken(tokenString string) (*TokenClaims, error) {
	keyFunc := func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(v.cfg.SecretKey), nil
	}

	token, err := jwt.ParseWithClaims(tokenString, &TokenClaims{}, keyFunc)
	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	claims, ok := token.Claims.(*TokenClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	// 检查过期时间
	if claims.ExpiresAt != nil && claims.ExpiresAt.Time.Before(time.Now()) {
		return nil, fmt.Errorf("token expired")
	}

	// 检查发行者
	if claims.Issuer != v.cfg.Issuer {
		return nil, fmt.Errorf("invalid issuer: expected %s, got %s", v.cfg.Issuer, claims.Issuer)
	}

	return claims, nil
}

// RefreshTokenPair 使用 Refresh Token 刷新 Token 对
func (v *Verifier) RefreshTokenPair(refreshToken string, generator *Generator) (accessToken, newRefreshToken string, err error) {
	claims, err := v.VerifyRefreshToken(refreshToken)
	if err != nil {
		return "", "", fmt.Errorf("invalid refresh token: %w", err)
	}

	// 生成新的 Token 对
	accessToken, newRefreshToken, err = generator.GenerateTokenPair(
		claims.AccountID,
		claims.ProfileID,
		claims.Username,
		claims.Email,
		claims.Phone,
		claims.ProfileScope,
	)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate new token pair: %w", err)
	}

	return accessToken, newRefreshToken, nil
}
