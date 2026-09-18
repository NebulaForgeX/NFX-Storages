// Package bundle flattens the databases/src SQL tree (which uses Atlas-style
// "-- atlas:import <path>" directives) into a single ordered SQL string.
//
// The bundled output is the shared input for both the psqldef diff step and the
// schemagen code generator, so neither depends on the Atlas CLI.
package bundle

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

const importPrefix = "-- atlas:import "

// Bundle reads mainFile and recursively inlines every "-- atlas:import" target,
// relative to the file that declares the import. Non-import lines are emitted
// verbatim. Each file is inlined at most once (later duplicate imports are
// skipped) to mirror Atlas' behaviour and avoid re-declaring objects.
func Bundle(mainFile string) (string, error) {
	var sb strings.Builder
	seen := map[string]bool{}
	if err := inline(mainFile, &sb, seen); err != nil {
		return "", err
	}
	return sb.String(), nil
}

func inline(path string, sb *strings.Builder, seen map[string]bool) error {
	abs, err := filepath.Abs(path)
	if err != nil {
		return err
	}
	if seen[abs] {
		return nil
	}
	seen[abs] = true

	f, err := os.Open(abs)
	if err != nil {
		return fmt.Errorf("bundle: open %s: %w", path, err)
	}
	defer f.Close()

	dir := filepath.Dir(abs)
	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 0, 1024*1024), 16*1024*1024)
	for scanner.Scan() {
		line := scanner.Text()
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, importPrefix) {
			target := strings.TrimSpace(strings.TrimPrefix(trimmed, importPrefix))
			if target == "" {
				continue
			}
			child := filepath.Join(dir, target)
			if err := inline(child, sb, seen); err != nil {
				return err
			}
			continue
		}
		sb.WriteString(line)
		sb.WriteByte('\n')
	}
	if err := scanner.Err(); err != nil {
		return fmt.Errorf("bundle: read %s: %w", path, err)
	}
	return nil
}
