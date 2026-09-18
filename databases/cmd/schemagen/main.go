// Command schemagen is a license-free replacement for the Atlas-based code
// generators (gen-enums / gen-models / gen-views). It introspects a shadow
// database that already has the bundled schema loaded and writes the same
// *_dbgen.go files that Atlas produced, then runs goimports + gofmt.
//
// It never touches the Atlas configuration or templates; it is a parallel path.
package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"nfxstorages/databases/cmd/schemagen/bundle"
	"nfxstorages/databases/cmd/schemagen/introspect"
	"nfxstorages/databases/cmd/schemagen/render"
)

func main() {
	var (
		dsn         = flag.String("dsn", "", "PostgreSQL DSN of the shadow database (schema already loaded)")
		kind        = flag.String("kind", "all", "what to generate: enums | models | views | all")
		repoRoot    = flag.String("repo-root", "", "repository root (defaults to the module root containing go.mod)")
		schemaCSV   = flag.String("schemas", "", "comma-separated schema names (default: auto-discover)")
		printBundle = flag.Bool("print-bundle", false, "print the flattened schema SQL to stdout and exit")
		mainSQL     = flag.String("main", "databases/src/main.sql", "entry SQL file for --print-bundle")
	)
	flag.Parse()

	if *printBundle {
		sql, err := bundle.Bundle(*mainSQL)
		if err != nil {
			fatalf("%v", err)
		}
		fmt.Print(sql)
		return
	}

	if *dsn == "" {
		fatalf("--dsn is required")
	}
	root, err := resolveRepoRoot(*repoRoot)
	if err != nil {
		fatalf("%v", err)
	}

	ctx := context.Background()

	schemas, err := resolveSchemas(ctx, *dsn, *schemaCSV)
	if err != nil {
		fatalf("%v", err)
	}
	realm, err := introspect.Introspect(ctx, *dsn, schemas)
	if err != nil {
		fatalf("%v", err)
	}

	genEnums := *kind == "all" || *kind == "enums"
	genModels := *kind == "all" || *kind == "models"
	genViews := *kind == "all" || *kind == "views"

	var dirs []string
	if genEnums {
		d, err := writeEnums(root, realm)
		if err != nil {
			fatalf("%v", err)
		}
		dirs = append(dirs, d...)
	}
	if genModels {
		d, err := writeModels(root, realm)
		if err != nil {
			fatalf("%v", err)
		}
		dirs = append(dirs, d...)
	}
	if genViews {
		d, err := writeViews(root, realm)
		if err != nil {
			fatalf("%v", err)
		}
		dirs = append(dirs, d...)
	}

	if err := format(root, dirs); err != nil {
		fatalf("%v", err)
	}
	fmt.Println("schemagen: done")
}

func resolveSchemas(ctx context.Context, dsn, csv string) ([]string, error) {
	if strings.TrimSpace(csv) != "" {
		var out []string
		for _, s := range strings.Split(csv, ",") {
			if s = strings.TrimSpace(s); s != "" {
				out = append(out, s)
			}
		}
		return out, nil
	}
	return introspect.ListSchemas(ctx, dsn)
}

func resolveRepoRoot(explicit string) (string, error) {
	if explicit != "" {
		return filepath.Abs(explicit)
	}
	wd, err := os.Getwd()
	if err != nil {
		return "", err
	}
	// Walk up until we find go.mod.
	dir := wd
	for {
		if _, err := os.Stat(filepath.Join(dir, "go.mod")); err == nil {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("could not locate go.mod above %s", wd)
		}
		dir = parent
	}
}

// writeEnums writes one enums file per schema to <root>/enums/.
func writeEnums(root string, realm *introspect.Realm) ([]string, error) {
	dir := filepath.Join(root, "enums")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, err
	}
	if err := removeGenerated(dir, "_enum_dbgen.go"); err != nil {
		return nil, err
	}
	for _, s := range realm.Schemas {
		content, ok := render.Enums(s)
		if !ok {
			continue
		}
		name := fmt.Sprintf("%s_enums_enum_dbgen.go", strings.ToLower(s.Name))
		if err := os.WriteFile(filepath.Join(dir, name), []byte(content), 0o644); err != nil {
			return nil, err
		}
	}
	return []string{dir}, nil
}

func writeModels(root string, realm *introspect.Realm) ([]string, error) {
	var dirs []string
	for _, s := range realm.Schemas {
		dir := filepath.Join(root, "modules", strings.ToLower(s.Name), "infrastructure", "rdb", "models")
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return nil, err
		}
		if err := removeGenerated(dir, "_dbgen.go"); err != nil {
			return nil, err
		}
		for _, t := range s.Tables {
			content := render.Model(s, t)
			name := fmt.Sprintf("%s_dbgen.go", strings.ToLower(t.Name))
			if err := os.WriteFile(filepath.Join(dir, name), []byte(content), 0o644); err != nil {
				return nil, err
			}
		}
		dirs = append(dirs, dir)
	}
	return dirs, nil
}

func writeViews(root string, realm *introspect.Realm) ([]string, error) {
	var dirs []string
	for _, s := range realm.Schemas {
		if len(s.Views) == 0 {
			continue
		}
		dir := filepath.Join(root, "modules", strings.ToLower(s.Name), "infrastructure", "rdb", "views")
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return nil, err
		}
		if err := removeGenerated(dir, "_dbgen.go"); err != nil {
			return nil, err
		}
		for _, v := range s.Views {
			content := render.View(s, v)
			name := fmt.Sprintf("%s_dbgen.go", strings.ToLower(v.Name))
			if err := os.WriteFile(filepath.Join(dir, name), []byte(content), 0o644); err != nil {
				return nil, err
			}
		}
		dirs = append(dirs, dir)
	}
	return dirs, nil
}

// removeGenerated deletes files in dir whose name ends with suffix.
func removeGenerated(dir, suffix string) error {
	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), suffix) {
			continue
		}
		if err := os.Remove(filepath.Join(dir, e.Name())); err != nil {
			return err
		}
	}
	return nil
}

// format runs goimports then gofmt on the written directories, mirroring the
// original gen scripts. Failures are non-fatal (best-effort), matching them.
func format(root string, dirs []string) error {
	modPath := goModulePath(root)
	for _, dir := range dirs {
		if _, err := os.Stat(dir); err != nil {
			continue
		}
		if bin := lookGoBin("goimports"); bin != "" {
			cmd := exec.Command(bin, "-w", dir)
			cmd.Dir = root
			if modPath != "" {
				cmd.Env = append(os.Environ(), "GOIMPORTSLOCAL="+modPath)
			}
			_ = runQuiet(cmd)
		}
		if bin := lookGoBin("gofmt"); bin != "" {
			cmd := exec.Command(bin, "-s", "-w", dir)
			cmd.Dir = root
			_ = runQuiet(cmd)
		}
	}
	return nil
}

func runQuiet(cmd *exec.Cmd) error {
	out, err := cmd.CombinedOutput()
	if err != nil && len(out) > 0 {
		fmt.Fprintf(os.Stderr, "%s: %s\n", cmd.Path, strings.TrimSpace(string(out)))
	}
	return err
}

func lookGoBin(name string) string {
	if p, err := exec.LookPath(name); err == nil {
		return p
	}
	for _, home := range []string{os.Getenv("HOME"), "/root"} {
		if home == "" {
			continue
		}
		p := filepath.Join(home, "go", "bin", name)
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return ""
}

func goModulePath(root string) string {
	cmd := exec.Command("go", "list", "-m")
	cmd.Dir = root
	out, err := cmd.Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(out))
}

func fatalf(format string, args ...any) {
	fmt.Fprintf(os.Stderr, "schemagen: "+format+"\n", args...)
	os.Exit(1)
}
