package servertoken

import (
	"crypto/rsa"

	"github.com/golang-jwt/jwt/v5"
)

type Signer interface {
	Method() jwt.SigningMethod
	Sign(claims jwt.Claims) (string, error)
}

type HMACSigner struct{ Key []byte }

func (s *HMACSigner) Method() jwt.SigningMethod { return jwt.SigningMethodHS256 }
func (s *HMACSigner) Sign(c jwt.Claims) (string, error) {
	return jwt.NewWithClaims(s.Method(), c).SignedString(s.Key)
}

type RSASigner struct{ Key *rsa.PrivateKey }

func (s *RSASigner) Method() jwt.SigningMethod { return jwt.SigningMethodRS256 }
func (s *RSASigner) Sign(c jwt.Claims) (string, error) {
	return jwt.NewWithClaims(s.Method(), c).SignedString(s.Key)
}
