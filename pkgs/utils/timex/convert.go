package timex

import (
	"time"

	"gorm.io/gorm"
)

/**
 ** Float64ToTime converts a Unix timestamp (as float64) to a time.Time object.
 ** The fractional part of the float is ignored.
 ** 将 Unix 时间戳（float64 格式）转换为 time.Time 对象。
 ** float 的小数部分将被忽略。
 *
 * Parameters:
 *   !- f: Unix timestamp in seconds (Unix 时间戳，单位为秒)
 *
 * Returns:
 *   !- time.Time: The corresponding time object (对应的时间对象)
 *
 * Examples:
 *
 * 	// Convert Unix timestamp to time (将 Unix 时间戳转换为时间)
 * 	timestamp := 1609459200.0  // 2021-01-01 00:00:00 UTC
 * 	t := Float64ToTime(timestamp)
 * 	// Returns: 2021-01-01 00:00:00 +0000 UTC
 *
 * 	// With fractional seconds (带小数秒，小数部分会被忽略)
 * 	timestamp := 1609459200.999
 * 	t := Float64ToTime(timestamp)
 * 	// Returns: 2021-01-01 00:00:00 +0000 UTC (fractional part ignored)
 *
 * 	// Zero timestamp (零时间戳)
 * 	t := Float64ToTime(0)
 * 	// Returns: 1970-01-01 00:00:00 +0000 UTC (Unix epoch)
 */
func Float64ToTime(f float64) time.Time {
	return time.Unix(int64(f), 0)
}

// GormDeletedAtToTime converts gorm.DeletedAt to *time.Time
func GormDeletedAtToTime(d gorm.DeletedAt) *time.Time {
	if !d.Valid {
		return nil
	}
	return &d.Time
}

// TimeToGormDeletedAt converts *time.Time to gorm.DeletedAt
func TimeToGormDeletedAt(t *time.Time) gorm.DeletedAt {
	if t == nil {
		return gorm.DeletedAt{}
	}
	return gorm.DeletedAt{Time: *t, Valid: true}
}
