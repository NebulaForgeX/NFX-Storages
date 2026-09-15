package httpx

// AccessLogConfig configures HTTP request (access) logging. Mode: "original" | "logger" | "off"
type AccessLogConfig struct {
	Mode string `koanf:"mode"`
}
