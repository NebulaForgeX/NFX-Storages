package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
)

// WriteLangFiles writes byLang to outPath as lang.json (one file per language).
func WriteLangFiles(outPath string, byLang map[string]map[string]string) error {
	for lang, codes := range byLang {
		keys := make([]string, 0, len(codes))
		for k := range codes {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		ordered := make(map[string]string, len(keys))
		for _, k := range keys {
			ordered[k] = codes[k]
		}
		outFile := filepath.Join(outPath, lang+".json")
		data, err := json.MarshalIndent(ordered, "", "  ")
		if err != nil {
			return fmt.Errorf("json %s: %w", outFile, err)
		}
		if err := os.WriteFile(outFile, data, 0644); err != nil {
			return fmt.Errorf("write %s: %w", outFile, err)
		}
		fmt.Printf("wrote %s (%d keys)\n", outFile, len(ordered))
	}
	return nil
}
