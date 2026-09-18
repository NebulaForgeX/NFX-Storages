// Truncate all table data in storages, system — dev only.
//
//	go run ./scripts/cleardata
//	go run ./scripts/cleardata --yes
//	task scripts:clear-data
package main

import (
	"bufio"
	"context"
	"flag"
	"fmt"
	"os"
	"strings"

	s3config "nfxstorages/modules/s3/config"
	"nfxstorages/pkgs/env"
	"nfxstorages/pkgs/logx"
	"nfxstorages/pkgs/postgresqlx"
)

const clearEnv = env.Dev

var schemas = []string{"storages", "system"}

func main() {
	skipConfirm := flag.Bool("yes", false, "Skip the interactive confirmation prompt")
	flag.Parse()

	if flag.NArg() > 0 {
		fmt.Fprintf(os.Stderr, "error: unexpected positional arguments; only the --yes flag is supported\n")
		os.Exit(1)
	}
	if clearEnv.IsProd() {
		fmt.Fprintf(os.Stderr, "refusing to run: this script is dev only\n")
		os.Exit(1)
	}

	ctx := context.Background()
	if _, err := os.Stat(".env"); os.IsNotExist(err) {
		fmt.Fprintf(os.Stderr, "run from NFX-Storages repo root (missing .env in cwd)\n")
		os.Exit(1)
	}

	cfg, err := s3config.Load(ctx, clearEnv)
	if err != nil {
		fmt.Fprintf(os.Stderr, "load config: %v\n", err)
		os.Exit(1)
	}
	if err := logx.Init(cfg.Logger, "cleardata-script", clearEnv); err != nil {
		fmt.Fprintf(os.Stderr, "init logger: %v\n", err)
		os.Exit(1)
	}

	pg := cfg.PostgreSQL
	fmt.Printf(
		"About to TRUNCATE all tables (data only, structure kept) in dev database %q at %s:%d\n",
		pg.DBName, pg.Host, pg.Port,
	)
	fmt.Printf("Schemas: %s\n", strings.Join(schemas, ", "))

	if !*skipConfirm {
		if !confirm(os.Stdin, pg.DBName) {
			fmt.Println("aborted")
			os.Exit(1)
		}
	}

	conn, err := postgresqlx.Init(ctx, pg)
	if err != nil {
		fmt.Fprintf(os.Stderr, "connect postgres: %v\n", err)
		os.Exit(1)
	}
	defer func() { _ = conn.Close() }()

	db := conn.DB()
	total := 0
	for _, schema := range schemas {
		n, err := postgresqlx.ClearSchema(ctx, db, schema, nil)
		if err != nil {
			fmt.Fprintf(os.Stderr, "clear schema %q: %v\n", schema, err)
			os.Exit(1)
		}
		total += n
		fmt.Printf("  - %-14s truncated %d table(s)\n", schema, n)
	}

	fmt.Printf("done: truncated %d table(s) across %d schema(s)\n", total, len(schemas))
}

func confirm(in *os.File, dbName string) bool {
	reader := bufio.NewReader(in)
	fmt.Printf("Type the database name %q to confirm: ", dbName)
	line, err := reader.ReadString('\n')
	if err != nil {
		return false
	}
	return strings.TrimSpace(line) == dbName
}
