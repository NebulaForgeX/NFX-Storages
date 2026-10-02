// Run from repo root:
//
//	go run ./messages/cmd/gen_langs/ ./messages
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
	baseDir := parseBaseDir(os.Args[1:])

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

	// Always emit en/zh/fr (may be empty {}). Storages has no Identity/Link system-message copy.
	for _, lang := range []string{"en", "zh", "fr"} {
		if _, ok := byLang[lang]; !ok {
			byLang[lang] = map[string]messageCopy{}
		}
	}
	if err := WriteLangFiles(outPath, byLang); err != nil {
		fmt.Fprintf(os.Stderr, "%v\n", err)
		os.Exit(1)
	}

	fmt.Println("generated messages langs")
}

func parseBaseDir(args []string) string {
	baseDir := "."
	for _, arg := range args {
		baseDir = arg
	}
	if _, err := os.Stat(filepath.Join(baseDir, srcDir)); os.IsNotExist(err) {
		if baseDir == "." {
			baseDir = "messages"
		}
	}
	return baseDir
}
