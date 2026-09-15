// Run from repo root: go run ./errors/cmd/gen_langs/ ./errors
package main

import (
	"fmt"
	"os"
	"path/filepath"
)

const (
	srcDir   = "src"
	langsDir = "langs"
)

func main() {
	baseDir := "."
	if len(os.Args) > 1 {
		baseDir = os.Args[1]
	} else {
		if _, err := os.Stat(filepath.Join(baseDir, srcDir)); os.IsNotExist(err) {
			baseDir = "errors"
		}
	}
	srcPath := filepath.Join(baseDir, srcDir)
	outPath := filepath.Join(baseDir, langsDir)

	if err := os.RemoveAll(outPath); err != nil {
		fmt.Fprintf(os.Stderr, "clean %s: %v\n", outPath, err)
		os.Exit(1)
	}
	if err := os.MkdirAll(outPath, 0755); err != nil {
		fmt.Fprintf(os.Stderr, "mkdir %s: %v\n", outPath, err)
		os.Exit(1)
	}

	byLang, err := Collect(srcPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "walk: %v\n", err)
		os.Exit(1)
	}

	if err := WriteLangFiles(outPath, byLang); err != nil {
		fmt.Fprintf(os.Stderr, "%v\n", err)
		os.Exit(1)
	}
}
