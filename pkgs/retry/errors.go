package retry

import "strings"

/**
 ** NetworkErrorPatterns contains common network error message patterns.
 ** Used to identify transient network errors that should be retried.
 ** NetworkErrorPatterns 包含常见的网络错误消息模式。
 ** 用于识别应该重试的瞬态网络错误。
 */
var NetworkErrorPatterns = []string{
	"network timeout",
	"connection refused",
	"i/o timeout",
	"connection reset",
	"broken pipe",
}

/**
 ** CacheErrorPatterns contains common cache error message patterns.
 ** Used to identify cache-related errors that might benefit from retries.
 ** CacheErrorPatterns 包含常见的缓存错误消息模式。
 ** 用于识别可能受益于重试的缓存相关错误。
 */
var CacheErrorPatterns = []string{
	"cache miss",
	"cache expired",
	"cache not found",
}

/**
 ** IsErrorInPatterns checks if an error message contains any of the specified patterns.
 ** Pattern matching is case-insensitive.
 ** IsErrorInPatterns 检查错误消息是否包含任何指定的模式。
 ** 模式匹配不区分大小写。
 *
 * Parameters:
 *   !- err: The error to check (要检查的错误)
 *   !- patterns: Variable number of pattern lists (可变数量的模式列表)
 *
 * Returns:
 *   !- bool: true if error matches any pattern (错误匹配任何模式返回 true)
 *
 * Examples:
 *
 * 	// Example 1: Check single pattern list (示例 1：检查单个模式列表)
 * 	err := errors.New("connection timeout occurred")
 * 	isNetwork := IsErrorInPatterns(err, NetworkErrorPatterns)
 * 	// Returns: true (matches "network timeout")
 *
 * 	// Example 2: Check multiple pattern lists (示例 2：检查多个模式列表)
 * 	err := errors.New("cache miss")
 * 	isRetryable := IsErrorInPatterns(err, NetworkErrorPatterns, CacheErrorPatterns)
 * 	// Returns: true (matches CacheErrorPatterns)
 *
 * 	// Example 3: Custom patterns (示例 3：自定义模式)
 * 	customPatterns := []string{"service unavailable", "rate limit"}
 * 	err := errors.New("Service Unavailable")
 * 	shouldRetry := IsErrorInPatterns(err, customPatterns)
 * 	// Returns: true (case-insensitive match)
 *
 * 	// Example 4: No match (示例 4：无匹配)
 * 	err := errors.New("invalid input")
 * 	isRetryable := IsErrorInPatterns(err, NetworkErrorPatterns)
 * 	// Returns: false
 */
func IsErrorInPatterns(err error, patterns ...[]string) bool {
	if err == nil {
		return false
	}

	errMsg := strings.ToLower(err.Error())

	// Check if any pattern is contained in the error message
	for _, patternList := range patterns {
		for _, pattern := range patternList {
			if strings.Contains(errMsg, pattern) {
				return true
			}
		}
	}

	return false
}

/**
 ** IsNetworkError checks if an error is a network-related error.
 ** Useful for determining if a failed operation should be retried.
 ** IsNetworkError 检查错误是否是网络相关错误。
 ** 用于确定失败的操作是否应该重试。
 *
 * Parameters:
 *   !- err: The error to check (要检查的错误)
 *
 * Returns:
 *   !- bool: true if error is network-related (错误与网络相关返回 true)
 *
 * Examples:
 *
 * 	// Example 1: Timeout error (示例 1：超时错误)
 * 	err := errors.New("network timeout")
 * 	if IsNetworkError(err) {
 * 		// Retry the operation
 * 	}
 * 	// Returns: true
 *
 * 	// Example 2: Connection refused (示例 2：连接被拒绝)
 * 	err := errors.New("connection refused")
 * 	IsNetworkError(err) // Returns: true
 *
 * 	// Example 3: Use in retry config (示例 3：在重试配置中使用)
 * 	cfg := Config{
 * 		MaxTries: 3,
 * 		ShouldRetry: func(err error, attempt uint, next time.Duration) bool {
 * 			return IsNetworkError(err)
 * 		},
 * 	}
 */
func IsNetworkError(err error) bool {
	return IsErrorInPatterns(err, NetworkErrorPatterns)
}

/**
 ** IsCacheError checks if an error is a cache-related error.
 ** Useful for retry logic when dealing with caching layers.
 ** IsCacheError 检查错误是否是缓存相关错误。
 ** 在处理缓存层时用于重试逻辑。
 *
 * Parameters:
 *   !- err: The error to check (要检查的错误)
 *
 * Returns:
 *   !- bool: true if error is cache-related (错误与缓存相关返回 true)
 *
 * Examples:
 *
 * 	// Example 1: Cache miss (示例 1：缓存未命中)
 * 	err := errors.New("cache miss")
 * 	if IsCacheError(err) {
 * 		// Fetch from database and update cache
 * 	}
 * 	// Returns: true
 *
 * 	// Example 2: Cache expired (示例 2：缓存过期)
 * 	err := errors.New("cache expired")
 * 	IsCacheError(err) // Returns: true
 *
 * 	// Example 3: Use with retry (示例 3：与重试一起使用)
 * 	data, err := Retry(ctx, func(ctx context.Context) ([]byte, error) {
 * 		return cache.Get(key)
 * 	}, Config{
 * 		MaxTries: 2,
 * 		ShouldRetry: func(err error, attempt uint, next time.Duration) bool {
 * 			return IsCacheError(err)
 * 		},
 * 	})
 */
func IsCacheError(err error) bool {
	return IsErrorInPatterns(err, CacheErrorPatterns)
}
