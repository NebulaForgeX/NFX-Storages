package postgresqlx

import (
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"
)

// IsUniqueViolation 检查是否违反唯一约束
func IsUniqueViolation(err error, constraint string) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return constraint == "" || pgErr.ConstraintName == constraint
	}

	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return constraint == ""
	}
	return false
}

// IsUniqueViolationAny 检查是否为任何唯一约束违反
func IsUniqueViolationAny(err error) bool {
	return IsUniqueViolation(err, "")
}

// IsForeignKeyViolation 检查是否违反外键约束
func IsForeignKeyViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23503" {
		return true
	}
	return false
}

// IsNotNullViolation 检查是否违反非空约束
func IsNotNullViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23502" {
		return true
	}
	return false
}

// GetPostgresErrorCode 获取 PostgreSQL 错误代码
func GetPostgresErrorCode(err error) string {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code
	}
	return ""
}
