package configx

import (
	"fmt"
	"os"
	"regexp"
	"strings"
)

// readAndSubstituteToml 读取 TOML 文件并替换 ${VAR_NAME} 占位符
// 如果变量缺失，直接返回错误，不使用默认值
func readAndSubstituteToml(path string) (string, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("failed to read toml file: %w", err)
	}

	// 匹配 ${VAR_NAME} 模式（支持 ${VAR} 格式）
	re := regexp.MustCompile(`\$\{([^}]+)\}`)
	missingVars := make(map[string]bool) // 使用 map 去重

	substituted := re.ReplaceAllStringFunc(string(content), func(match string) string {
		// 提取变量名
		varName := match[2 : len(match)-1] // 去掉 ${ 和 }
		varName = strings.TrimSpace(varName)

		// 从环境变量获取值
		value := os.Getenv(varName)
		if value == "" {
			missingVars[varName] = true // 记录缺失的变量
			return match                // 保持原样，稍后报错
		}

		return value
	})

	// 如果有关键变量缺失，直接退出（不使用默认值）
	if len(missingVars) > 0 {
		varNames := make([]string, 0, len(missingVars))
		for name := range missingVars {
			varNames = append(varNames, name)
		}
		return "", fmt.Errorf("missing required environment variables: %s", strings.Join(varNames, ", "))
	}

	return substituted, nil
}
