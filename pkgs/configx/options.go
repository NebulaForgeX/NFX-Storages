package configx

type options struct {
	explicitPath string
	envPrefix    string
	watch        bool
	defaults     map[string]any
}

type LoaderOption func(*options)

func WithPath(p string) LoaderOption {
	return func(o *options) {
		o.explicitPath = p
	}
}

func WithEnvPrefix(p string) LoaderOption {
	return func(o *options) {
		o.envPrefix = p
	}
}

func WithDefaults(m map[string]any) LoaderOption {
	return func(o *options) {
		o.defaults = m
	}
}
