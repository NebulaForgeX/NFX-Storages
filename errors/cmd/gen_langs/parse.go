package main

import (
	"os"
	"path/filepath"
	"regexp"
)

var (
	blockCommentRe = regexp.MustCompile(`/\*\*?([\s\S]*?)\*/`)
	codeLineRe     = regexp.MustCompile(`(?m)^!\s*([A-Z0-9_]+)\s*$`)
	langLineRe     = regexp.MustCompile(`(?m)^\*\s*([a-z]{2,})\s*<\s*([^>]*)\s*>?\s*$`)
)

// Collect walks srcPath and parses all .go files, returning lang -> code -> text.
func Collect(srcPath string) (map[string]map[string]string, error) {
	byLang := make(map[string]map[string]string)
	err := filepath.Walk(srcPath, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() || filepath.Ext(path) != ".go" {
			return err
		}
		collectFromFile(path, byLang)
		return nil
	})
	return byLang, err
}

func collectFromFile(path string, byLang map[string]map[string]string) {
	data, err := os.ReadFile(path)
	if err != nil {
		return
	}
	blocks := blockCommentRe.FindAllStringSubmatch(string(data), -1)
	for _, m := range blocks {
		if len(m) < 2 {
			continue
		}
		block := m[1]
		var currentCode string
		for _, line := range splitLines(block) {
			if codeLineRe.MatchString(line) {
				sm := codeLineRe.FindStringSubmatch(line)
				if len(sm) >= 2 {
					currentCode = sm[1]
				}
				continue
			}
			if currentCode == "" {
				continue
			}
			if langLineRe.MatchString(line) {
				sm := langLineRe.FindStringSubmatch(line)
				if len(sm) >= 3 {
					lang, text := sm[1], sm[2]
					if byLang[lang] == nil {
						byLang[lang] = make(map[string]string)
					}
					byLang[lang][currentCode] = text
				}
			}
		}
	}
}

func splitLines(s string) []string {
	var out []string
	start := 0
	for i := 0; i <= len(s); i++ {
		if i == len(s) || s[i] == '\n' {
			out = append(out, trimSpace(s[start:i]))
			start = i + 1
		}
	}
	return out
}

func trimSpace(s string) string {
	i := 0
	for i < len(s) && (s[i] == ' ' || s[i] == '\t' || s[i] == '\r') {
		i++
	}
	j := len(s)
	for j > i && (s[j-1] == ' ' || s[j-1] == '\t' || s[j-1] == '\r') {
		j--
	}
	return s[i:j]
}
