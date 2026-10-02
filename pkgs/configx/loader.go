package configx

import (
	"context"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/knadh/koanf/parsers/toml"
	"github.com/knadh/koanf/providers/confmap"
	envProvider "github.com/knadh/koanf/providers/env"
	fileProvider "github.com/knadh/koanf/providers/file"
	"github.com/knadh/koanf/v2"
)

type Loader[T any] struct {
	cfg *T
	k   *koanf.Koanf
}

func NewLoader[T any](ctx context.Context, opts ...LoaderOption) (*Loader[T], error) {
	op := options{envPrefix: "APP"}
	for _, f := range opts {
		f(&op)
	}

	k := koanf.New(".")

	if len(op.defaults) > 0 {
		k.Load(confmap.Provider(op.defaults, "."), nil)
	}

	// === Load .env file first ===
	if err := loadEnvFile(); err != nil {
		return nil, fmt.Errorf("load .env file failed: %w", err)
	}

	// === TOML provider with variable substitution ===
	path, err := resolvePath(op.explicitPath)
	if err != nil {
		return nil, err
	}

	// Read and substitute variables in TOML content
	tomlContent, err := readAndSubstituteToml(path)
	if err != nil {
		return nil, fmt.Errorf("read and substitute toml config failed: %w", err)
	}

	// Create a temporary file with substituted content
	tmpFile, err := os.CreateTemp("", "config-*.toml")
	if err != nil {
		return nil, fmt.Errorf("failed to create temp file: %w", err)
	}
	defer os.Remove(tmpFile.Name()) // Clean up temp file
	defer tmpFile.Close()

	if _, err := io.WriteString(tmpFile, tomlContent); err != nil {
		return nil, fmt.Errorf("failed to write temp file: %w", err)
	}
	if err := tmpFile.Close(); err != nil {
		return nil, fmt.Errorf("failed to close temp file: %w", err)
	}

	// Load from temporary file
	fProvider := fileProvider.Provider(tmpFile.Name())
	if err := k.Load(fProvider, toml.Parser()); err != nil {
		return nil, fmt.Errorf("load toml config failed: %w", err)
	}

	// === ENV provider ===
	replacer := func(s string) string {
		return strings.NewReplacer("__", "-", "_", ".").Replace(s)
	}
	if err := k.Load(envProvider.Provider(op.envPrefix+"_", ".", replacer), nil); err != nil {
		return nil, fmt.Errorf("load env config failed: %w", err)
	}

	// === Unmarshal config ===
	var newCfg T
	if err := k.Unmarshal("", &newCfg); err != nil {
		return nil, fmt.Errorf("unmarshal config failed: %w", err)
	}

	return &Loader[T]{cfg: &newCfg, k: k}, nil
}

func (l *Loader[T]) Config() *T {
	return l.cfg
}

func (l *Loader[T]) PrintAll() {
	l.k.Print()
}

func (l *Loader[T]) PrintWithPrefix(prefix string) {
	keys := l.k.Keys()
	for _, key := range keys {
		if strings.HasPrefix(key, prefix) {
			fmt.Printf("%s -> %v\n", key, l.k.Get(key))
		}
	}
}
