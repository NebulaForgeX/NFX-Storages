package token

import (
	"nfxstorages/pkgs/utils/mapx"
	"nfxstorages/pkgs/utils/timex"

	"github.com/golang-jwt/jwt/v5"
)

func MapClaimsToRegisteredClaims(mc jwt.MapClaims) jwt.RegisteredClaims {
	return jwt.RegisteredClaims{
		Issuer:    mapx.GetMapValue[string](mc, "iss"),
		Subject:   mapx.GetMapValue[string](mc, "sub"),
		Audience:  mapx.GetMapValue[[]string](mc, "aud"),
		ExpiresAt: jwt.NewNumericDate(timex.Float64ToTime(mapx.GetMapValue[float64](mc, "exp"))),
		NotBefore: jwt.NewNumericDate(timex.Float64ToTime(mapx.GetMapValue[float64](mc, "nbf"))),
		IssuedAt:  jwt.NewNumericDate(timex.Float64ToTime(mapx.GetMapValue[float64](mc, "iat"))),
		ID:        mapx.GetMapValue[string](mc, "jti"),
	}
}
