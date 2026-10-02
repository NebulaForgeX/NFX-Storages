package configx

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"nfxstorages/pkgs/utils/file"
)

// loadEnvFile 从项目根目录加载 .env 文件到环境变量
func loadEnvFile() error {
	// 查找项目根目录的 .env 文件
	wd, err := os.Getwd()
	if err != nil {
		return fmt.Errorf("failed to get working directory: %w", err)
	}

	envPath := filepath.Join(wd, ".env")
	if !file.Exists(envPath) {
		// 如果当前目录没有，尝试向上查找
		dir := wd
		for i := 0; i < 5; i++ {
			envPath = filepath.Join(dir, ".env")
			if file.Exists(envPath) {
				break
			}
			parent := filepath.Dir(dir)
			if parent == dir {
				break
			}
			dir = parent
		}
	}

	if !file.Exists(envPath) {
		// .env 文件不存在，不报错（允许不使用 .env）
		return nil
	}

	// 读取并解析 .env 文件
	file, err := os.Open(envPath)
	if err != nil {
		return fmt.Errorf("failed to open .env file: %w", err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	lineNum := 0
	for scanner.Scan() {
		lineNum++
		line := scanner.Text()

		// 移除行尾注释（但保留 # 开头的整行注释）
		if idx := strings.Index(line, " #"); idx != -1 {
			line = line[:idx]
		}

		line = strings.TrimSpace(line)

		// 跳过空行和注释行
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		// 解析 KEY=VALUE 格式
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])

		// 移除引号（如果存在）
		if len(value) >= 2 {
			if (value[0] == '"' && value[len(value)-1] == '"') ||
				(value[0] == '\'' && value[len(value)-1] == '\'') {
				value = value[1 : len(value)-1]
			}
		}

		// 如果环境变量已存在，不覆盖（环境变量优先级更高）
		if os.Getenv(key) == "" {
			if err := os.Setenv(key, value); err != nil {
				return fmt.Errorf("failed to set environment variable %s: %w", key, err)
			}
		}
	}

	if err := scanner.Err(); err != nil {
		return fmt.Errorf("failed to read .env file: %w", err)
	}

	return nil
}
