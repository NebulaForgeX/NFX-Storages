package main

import (
	"fmt"
	"os"
	"regexp"
	"strings"
)

var (
	codeRe     = regexp.MustCompile(`Code[A-Za-z0-9_]+\s*=\s*"([^"]+)"`)
	hasBlockRe = regexp.MustCompile(`/\*\s*\n\s*!`)
)

// AddBlockIfMissing reads the file at path; if it has no template block, appends one for all CodeXxx constants.
func AddBlockIfMissing(path string) {
	data, err := os.ReadFile(path)
	if err != nil {
		return
	}
	content := string(data)
	if hasBlockRe.MatchString(content) {
		return // already has template block
	}
	codes := codeRe.FindAllStringSubmatch(content, -1)
	if len(codes) == 0 {
		return
	}
	var block strings.Builder
	block.WriteString("\n\n/*\n")
	for _, m := range codes {
		code := m[1]
		enHint := codeToEn(code)
		block.WriteString("!")
		block.WriteString(code)
		block.WriteString("\n*en<")
		block.WriteString(enHint)
		block.WriteString(">\n*zh<>\n*fr<>\n\n")
	}
	block.WriteString("*/")
	out := strings.TrimRight(content, "\n\t ") + block.String() + "\n"
	if err := os.WriteFile(path, []byte(out), 0644); err != nil {
		fmt.Fprintf(os.Stderr, "write %s: %v\n", path, err)
		return
	}
	fmt.Printf("added template block to %s (%d codes)\n", path, len(codes))
}

func codeToEn(code string) string {
	return strings.ReplaceAll(strings.ToLower(code), "_", " ")
}
