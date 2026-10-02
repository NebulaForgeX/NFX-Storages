package tokenx

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type TokenType string

const (
	TokenTypeAccess  TokenType = "access"
	TokenTypeRefresh TokenType = "refresh"
)

type TokenClaims struct {
	AccountID    string    `json:"account_id"`
	ProfileID    string    `json:"profile_id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	Phone        string    `json:"phone"`
	ProfileScope string    `json:"profile_scope"`
	Type         TokenType `json:"type"`
	jwt.RegisteredClaims
}

func NewAccessTokenClaims(accountID, profileID, username, email, phone, profileScope, issuer string, ttl time.Duration) *TokenClaims {
	now := time.Now()
	return &TokenClaims{
		AccountID:    accountID,
		ProfileID:    profileID,
		Username:     username,
		Email:        email,
		Phone:        phone,
		ProfileScope: profileScope,
		Type:         TokenTypeAccess,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    issuer,
			Subject:   accountID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
			NotBefore: jwt.NewNumericDate(now),
		},
	}
}

func NewRefreshTokenClaims(accountID, profileID, username, email, phone, profileScope, issuer string, ttl time.Duration) *TokenClaims {
	return NewRefreshTokenClaimsWithID(accountID, profileID, username, email, phone, profileScope, issuer, ttl, "")
}

func NewRefreshTokenClaimsWithID(accountID, profileID, username, email, phone, profileScope, issuer string, ttl time.Duration, tokenID string) *TokenClaims {
	now := time.Now()
	claims := &TokenClaims{
		AccountID:    accountID,
		ProfileID:    profileID,
		Username:     username,
		Email:        email,
		Phone:        phone,
		ProfileScope: profileScope,
		Type:         TokenTypeRefresh,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    issuer,
			Subject:   accountID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
			NotBefore: jwt.NewNumericDate(now),
		},
	}
	if tokenID != "" {
		claims.ID = tokenID
	}
	return claims
}
