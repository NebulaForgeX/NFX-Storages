package tokenx

import "time"

// Config JWT Token 配置
type Config struct {
	SecretKey       string        `koanf:"secret_key"`        // JWT 签名密钥
	AccessTokenTTL  time.Duration `koanf:"access_token_ttl"`  // Access Token 过期时间
	RefreshTokenTTL time.Duration `koanf:"refresh_token_ttl"` // Refresh Token 过期时间
	Issuer          string        `koanf:"issuer"`            // Token 发行者
	Algorithm       string        `koanf:"algorithm"`         // 签名算法，默认 HS256
}

// DefaultConfig 返回默认配置
func DefaultConfig() Config {
	return Config{
		SecretKey:       "change-me-in-production",
		AccessTokenTTL:  15 * time.Minute,   // 15 分钟
		RefreshTokenTTL: 7 * 24 * time.Hour, // 7 天
		Issuer:          "nfxstorages",
		Algorithm:       "HS256",
	}
}
