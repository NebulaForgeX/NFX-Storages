package main

import (
	"os"
	"path/filepath"
	"regexp"
)

var (
	blockCommentRe  = regexp.MustCompile(`/\*\*?([\s\S]*?)\*/`)
	codeLineRe      = regexp.MustCompile(`(?m)^!\s*([A-Z0-9_]+)\s*$`)
	fieldLangLineRe = regexp.MustCompile(`(?m)^\*(title|body)\*([a-z]{2,})\s*<\s*([^>]*)\s*>?\s*$`)
)

type messageCopy struct {
	Title string
	Body  string
}

// Collect walks srcPath and parses all .go files, returning lang -> type -> {title, body}.
func Collect(srcPath string) (map[string]map[string]messageCopy, error) {
	byLang := make(map[string]map[string]messageCopy)
	err := filepath.Walk(srcPath, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() || filepath.Ext(path) != ".go" {
			return err
		}
		collectFromFile(path, byLang)
		return nil
	})
	return byLang, err
}

func collectFromFile(path string, byLang map[string]map[string]messageCopy) {
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
		var currentType string
		fieldsByLang := make(map[string]messageCopy)
		flush := func() {
			if currentType == "" {
				return
			}
			for lang, copy := range fieldsByLang {
				if copy.Title == "" && copy.Body == "" {
					continue
				}
				if byLang[lang] == nil {
					byLang[lang] = make(map[string]messageCopy)
				}
				byLang[lang][currentType] = copy
			}
			currentType = ""
			fieldsByLang = make(map[string]messageCopy)
		}
		for _, line := range splitLines(block) {
			if codeLineRe.MatchString(line) {
				flush()
				sm := codeLineRe.FindStringSubmatch(line)
				if len(sm) >= 2 {
					currentType = sm[1]
				}
				continue
			}
			if currentType == "" {
				continue
			}
			if fieldLangLineRe.MatchString(line) {
				sm := fieldLangLineRe.FindStringSubmatch(line)
				if len(sm) >= 4 {
					field, lang, text := sm[1], sm[2], sm[3]
					copy := fieldsByLang[lang]
					switch field {
					case "title":
						copy.Title = text
					case "body":
						copy.Body = text
					}
					fieldsByLang[lang] = copy
				}
			}
		}
		flush()
	}
}

func splitLines(s string) []string {
	var out []string
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == '\n' {
			out = append(out, s[start:i])
			start = i + 1
		}
	}
	if start < len(s) {
		out = append(out, s[start:])
	}
	return out
}
