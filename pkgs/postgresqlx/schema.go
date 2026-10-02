package postgresqlx

import (
	"context"
	"fmt"
	"strings"

	"gorm.io/gorm"
)

// GetTableNames 获取指定 schema 中所有表名
// 返回格式为 "schema"."table" 的表名列表
func GetTableNames(ctx context.Context, db *gorm.DB, schemaName string) ([]string, error) {
	var tableNames []string

	// 查询 information_schema 获取所有表名
	query := `
		SELECT table_name 
		FROM information_schema.tables 
		WHERE table_schema = ? 
		AND table_type = 'BASE TABLE'
		ORDER BY table_name
	`

	rows, err := db.WithContext(ctx).Raw(query, schemaName).Rows()
	if err != nil {
		return nil, fmt.Errorf("failed to query table names: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var tableName string
		if err := rows.Scan(&tableName); err != nil {
			return nil, fmt.Errorf("failed to scan table name: %w", err)
		}
		// 添加 schema 前缀
		tableNames = append(tableNames, fmt.Sprintf(`"%s"."%s"`, schemaName, tableName))
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating table names: %w", err)
	}

	return tableNames, nil
}

// ClearSchema 清空指定 schema 中所有表的数据（不删除表）
// 使用 TRUNCATE TABLE 命令，保留表结构、索引、外键约束等
// 参数：
//   - ctx: 上下文
//   - db: GORM 数据库连接
//   - schemaName: schema 名称
//   - excludeTables: 要排除的表名列表（格式：schema.table），这些表不会被清空
//
// 返回：
//   - tablesCleared: 清空的表数量
//   - error: 错误信息
func ClearSchema(ctx context.Context, db *gorm.DB, schemaName string, excludeTables []string) (int, error) {
	// 获取 schema 中所有表名
	tableNames, err := GetTableNames(ctx, db, schemaName)
	if err != nil {
		return 0, fmt.Errorf("failed to get table names: %w", err)
	}

	if len(tableNames) == 0 {
		return 0, nil
	}

	// 过滤掉要排除的表
	tablesToTruncate := []string{}
	excludeMap := make(map[string]bool)
	for _, excludeTable := range excludeTables {
		excludeMap[excludeTable] = true
	}

	for _, tableName := range tableNames {
		if !excludeMap[tableName] {
			tablesToTruncate = append(tablesToTruncate, tableName)
		}
	}

	if len(tablesToTruncate) == 0 {
		return 0, nil
	}

	// 构建 TRUNCATE 语句（CASCADE 确保清空有外键依赖的表）
	// 使用 RESTART IDENTITY 重置序列
	truncateSQL := fmt.Sprintf(
		"TRUNCATE TABLE %s RESTART IDENTITY CASCADE",
		strings.Join(tablesToTruncate, ", "),
	)

	// 执行 TRUNCATE
	if err := db.WithContext(ctx).Exec(truncateSQL).Error; err != nil {
		return 0, fmt.Errorf("failed to truncate tables: %w", err)
	}

	return len(tablesToTruncate), nil
}

// DeleteAllFromTable 删除指定表中的所有记录（用于特殊处理，如 system_state）
// 注意：这不会重置序列，如果需要重置序列，应该使用 TRUNCATE
func DeleteAllFromTable(ctx context.Context, db *gorm.DB, schemaName, tableName string) error {
	fullTableName := fmt.Sprintf(`"%s"."%s"`, schemaName, tableName)
	sql := fmt.Sprintf("DELETE FROM %s", fullTableName)
	return db.WithContext(ctx).Exec(sql).Error
}
