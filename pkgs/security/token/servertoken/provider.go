package servertoken

import (
	"context"
	"sync/atomic"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type TokenProvider interface {
	GetToken(ctx context.Context) (string, error)
}

type Provider struct {
	signer    Signer
	issuer    string
	serviceID string
	ttl       time.Duration
	margin    time.Duration
	value     atomic.Value // tokenEntry
}

type tokenEntry struct {
	token string
	exp   time.Time
}

type ProviderOption func(*Provider)

func WithTTL(d time.Duration) ProviderOption    { return func(p *Provider) { p.ttl = d } }
func WithMargin(d time.Duration) ProviderOption { return func(p *Provider) { p.margin = d } }

func NewProvider(signer Signer, issuer, serviceID string, opts ...ProviderOption) TokenProvider {
	p := &Provider{
		signer:    signer,
		issuer:    issuer,
		serviceID: serviceID,
		ttl:       1 * time.Hour,    // default value
		margin:    10 * time.Second, // default value
	}

	for _, opt := range opts {
		opt(p)
	}

	p.value.Store(tokenEntry{}) // zero
	return p
}

func (p *Provider) GetToken(_ context.Context) (string, error) {
	e := p.value.Load().(tokenEntry)
	if now := time.Now(); now.Add(p.margin).Before(e.exp) {
		return e.token, nil
	}

	// Create new token
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Issuer:    p.issuer,
		Subject:   p.serviceID,
		IssuedAt:  jwt.NewNumericDate(now),
		NotBefore: jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(p.ttl)),
		ID:        uuid.NewString(),
	}
	tokenStr, err := p.signer.Sign(claims)
	if err != nil {
		return "", err
	}

	p.value.Store(tokenEntry{token: tokenStr, exp: now.Add(p.ttl)})
	return tokenStr, nil
}
