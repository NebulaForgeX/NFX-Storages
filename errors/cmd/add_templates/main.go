// Add /* */ translation template block to .go files in src/ that don't have it.
// Run from repo root: go run ./errors/cmd/add_templates/ ./errors
package main

import (
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	baseDir := "."
	if len(os.Args) > 1 {
		baseDir = os.Args[1]
	}
	srcPath := filepath.Join(baseDir, "src")
	err := filepath.Walk(srcPath, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() || filepath.Ext(path) != ".go" {
			return err
		}
		AddBlockIfMissing(path)
		return nil
	})
	if err != nil {
		fmt.Fprintf(os.Stderr, "walk: %v\n", err)
		os.Exit(1)
	}
}
