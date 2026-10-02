package httpx

// AccessLogConfig configures HTTP request (access) logging.
// Mode: "original" | "logger" | "logger_pretty" | "off"
// Format: only when Mode=logger — "compact" (default) | "pretty"
type AccessLogConfig struct {
	Mode   string `koanf:"mode"`
	Format string `koanf:"format"`
}
