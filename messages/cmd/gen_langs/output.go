package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
)

type nestedCopy struct {
	Title string `json:"title"`
	Body  string `json:"body"`
}

// WriteLangFiles writes byLang to outPath as lang.json (nested SystemMessageType → title/body).
func WriteLangFiles(outPath string, byLang map[string]map[string]messageCopy) error {
	for lang, types := range byLang {
		keys := make([]string, 0, len(types))
		for k := range types {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		ordered := make(map[string]nestedCopy, len(keys))
		for _, k := range keys {
			copy := types[k]
			ordered[k] = nestedCopy(copy)
		}
		outFile := filepath.Join(outPath, lang+".json")
		data, err := json.MarshalIndent(ordered, "", "  ")
		if err != nil {
			return fmt.Errorf("json %s: %w", outFile, err)
		}
		if err := os.WriteFile(outFile, data, 0644); err != nil {
			return fmt.Errorf("write %s: %w", outFile, err)
		}
		fmt.Printf("wrote %s (%d types)\n", outFile, len(ordered))
	}
	return nil
}
