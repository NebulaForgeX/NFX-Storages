// Probe PostgreSQL (and optionally Redis) using s3 TOML + .env.
//
//	task scripts:test-db
//	task scripts:test-db ENV=prod
//	task scripts:test-db -- --skip-redis
package main

import (
	"context"
	"flag"
	"fmt"
	"net"
	"os"
	"strings"
	"time"

	s3config "nfxstorages/modules/s3/config"
	"nfxstorages/pkgs/cachex"
	"nfxstorages/pkgs/env"
	"nfxstorages/pkgs/logx"
	"nfxstorages/pkgs/postgresqlx"
)

func main() {
	skipRedis := flag.Bool("skip-redis", false, "Skip Redis probe")
	timeout := flag.Duration("timeout", 8*time.Second, "TCP / dial timeout per attempt")
	flag.Parse()

	runEnv := parseEnv(os.Getenv("ENV"))
	ctx := context.Background()

	cfg, err := s3config.Load(ctx, runEnv)
	if err != nil {
		fmt.Fprintf(os.Stderr, "load config: %v\n", err)
		os.Exit(1)
	}
	if err := logx.Init(cfg.Logger, "testdb-script", runEnv); err != nil {
		fmt.Fprintf(os.Stderr, "init logger: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("env=%s\n", runEnv)
	fmt.Printf("timeout=%s\n\n", timeout.Round(time.Millisecond))

	rc := testPostgres(ctx, cfg.PostgreSQL, *timeout)
	if !*skipRedis {
		fmt.Println()
		rc = max(rc, testRedis(ctx, cfg.Cache, *timeout))
	}
	fmt.Println()
	if rc == 0 {
		fmt.Println("PASS")
	} else {
		fmt.Println("FAIL")
	}
	os.Exit(rc)
}

func parseEnv(raw string) env.Env {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "", "dev":
		return env.Dev
	case "secure", "prod":
		return env.Prod
	default:
		fmt.Fprintf(os.Stderr, "error: ENV must be dev|prod, got %q\n", raw)
		os.Exit(1)
		return ""
	}
}

func testPostgres(ctx context.Context, cfg postgresqlx.Config, timeout time.Duration) int {
	fmt.Println("=== PostgreSQL ===")
	fmt.Printf("host=%s\n", cfg.Host)
	fmt.Printf("port=%d\n", cfg.Port)
	fmt.Printf("user=%s\n", cfg.User)
	fmt.Printf("dbname=%s\n", cfg.DBName)
	fmt.Printf("sslmode=%s\n", cfg.SSLMode)
	fmt.Printf("password_set=%s\n", yn(cfg.Password != ""))

	if ok, detail := tcpProbe(cfg.Host, cfg.Port, timeout); !ok {
		fmt.Printf("tcp: %s\n", detail)
		return 1
	} else {
		fmt.Printf("tcp: %s\n", detail)
	}

	cfg.ConnectionConfig.Timeout = timeout
	cfg.ConnectionConfig.MaxRetries = 1
	cfg.ConnectionConfig.RetryInterval = time.Second
	cfg.LoggerLevel = "silent"

	started := time.Now()
	conn, err := postgresqlx.Init(ctx, cfg)
	if err != nil {
		fmt.Printf("auth+query: fail after %s: %v\n", time.Since(started).Round(time.Millisecond), err)
		return 1
	}
	defer conn.Close()

	var db, user, serverAddr, version string
	row := conn.DB().WithContext(ctx).Raw(
		`SELECT current_database(), current_user, inet_server_addr()::text, version()`,
	).Row()
	if err := row.Scan(&db, &user, &serverAddr, &version); err != nil {
		fmt.Printf("auth+query: fail after %s: %v\n", time.Since(started).Round(time.Millisecond), err)
		return 1
	}
	fmt.Printf("auth+query: ok (%s)\n", time.Since(started).Round(time.Millisecond))
	fmt.Printf("current_database=%s\n", db)
	fmt.Printf("current_user=%s\n", user)
	fmt.Printf("inet_server_addr=%s\n", serverAddr)
	if i := strings.IndexByte(version, ','); i >= 0 {
		version = version[:i]
	}
	fmt.Printf("version=%s\n", version)
	return 0
}

func testRedis(ctx context.Context, cfg cachex.ConnConfig, timeout time.Duration) int {
	fmt.Println("=== Redis ===")
	if strings.TrimSpace(cfg.Host) == "" || cfg.Port == 0 {
		fmt.Println("skip: cache host/port not set")
		return 0
	}

	fmt.Printf("host=%s\n", cfg.Host)
	fmt.Printf("port=%d\n", cfg.Port)
	fmt.Printf("tls=%s\n", yn(cfg.TLS.Enabled))
	fmt.Printf("password_set=%s\n", yn(cfg.Password != ""))

	if ok, detail := tcpProbe(cfg.Host, cfg.Port, timeout); !ok {
		fmt.Printf("tcp: %s\n", detail)
		return 1
	} else {
		fmt.Printf("tcp: %s\n", detail)
	}

	cfg.Connection.DialTimeout = timeout
	cfg.Connection.WriteTimeout = timeout
	cfg.Connection.ReadTimeout = timeout
	cfg.Connection.MaxRetries = 1
	cfg.Connection.RetryInterval = time.Second

	started := time.Now()
	conn, err := cachex.InitConn(ctx, cfg)
	if err != nil {
		fmt.Printf("auth+ping: fail after %s: %v\n", time.Since(started).Round(time.Millisecond), err)
		return 1
	}
	defer conn.Close()
	if err := conn.Client().Ping(ctx).Err(); err != nil {
		fmt.Printf("auth+ping: fail after %s: %v\n", time.Since(started).Round(time.Millisecond), err)
		return 1
	}
	fmt.Printf("auth+ping: ok (%s)\n", time.Since(started).Round(time.Millisecond))
	return 0
}

func tcpProbe(host string, port int, timeout time.Duration) (bool, string) {
	addr := net.JoinHostPort(host, fmt.Sprintf("%d", port))
	started := time.Now()
	c, err := net.DialTimeout("tcp", addr, timeout)
	elapsed := time.Since(started).Round(time.Millisecond)
	if err != nil {
		return false, fmt.Sprintf("fail after %s: %v", elapsed, err)
	}
	_ = c.Close()
	return true, fmt.Sprintf("ok (%s)", elapsed)
}

func yn(v bool) string {
	if v {
		return "yes"
	}
	return "no"
}
