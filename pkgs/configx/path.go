package configx

import (
	"errors"
	"flag"
	"os"

	"nfxstorages/pkgs/utils/file"
)

func resolvePath(explicit string) (string, error) {
	if explicit != "" && file.Exists(explicit) {
		return explicit, nil
	}

	// --flag
	if f := flag.Lookup("config"); f != nil && file.Exists(f.Value.String()) {
		return f.Value.String(), nil
	}

	// ENV
	if p := os.Getenv("CONFIG_FILE"); p != "" && file.Exists(p) {
		return p, nil
	}

	return "", errors.New("config file not found")
}
