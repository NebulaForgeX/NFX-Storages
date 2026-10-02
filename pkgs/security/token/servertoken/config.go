package servertoken

type Config struct {
	HMACKey string `koanf:"hmac_key"`
	Issuer  string `koanf:"issuer"`
}
