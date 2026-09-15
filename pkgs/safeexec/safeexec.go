package safeexec

import (
	"errors"
	"fmt"
	"nfxstorages/pkgs/logx"
	"runtime/debug"

	"go.uber.org/zap"
)

/**
 ** SafeGo executes a function asynchronously in a goroutine with panic recovery and error logging.
 ** Panics are recovered and logged with stack trace. Errors are logged but don't crash the program.
 ** SafeGo 在 goroutine 中异步执行函数，带有 panic 恢复和错误日志。
 ** panic 会被恢复并记录堆栈跟踪。错误会被记录但不会导致程序崩溃。
 *
 * Parameters:
 *   !- fn: Function to execute asynchronously (要异步执行的函数)
 *
 * Examples:
 *
 * 	// Example 1: Background task (示例 1：后台任务)
 * 	SafeGo(func() error {
 * 		// Perform some background work
 * 		return processData()
 * 	})
 *
 * 	// Example 2: Send notification without blocking (示例 2：非阻塞发送通知)
 * 	SafeGo(func() error {
 * 		return notificationService.SendEmail(userEmail, subject, body)
 * 	})
 *
 * 	// Example 3: Handle panics gracefully (示例 3：优雅处理 panic)
 * 	SafeGo(func() error {
 * 		// This panic will be caught and logged
 * 		panic("something went wrong")
 * 		return nil
 * 	})
 * 	// Program continues running, panic is logged
 *
 * 	// Example 4: Clean up resources (示例 4：清理资源)
 * 	SafeGo(func() error {
 * 		defer cleanup()
 * 		return doWork()
 * 	})
 *
 * Note:
 *   - Handles nil-wrapped errors properly (处理 nil 包装的错误)
 *   - Logs panics with stack traces (记录带堆栈跟踪的 panic)
 *   - Does not block the caller (不会阻塞调用者)
 */
func SafeGo(fn func() error) {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				logPanic(logx.L(), "async execution", r)
			}
		}()

		// Some libraries or error combinations (like fmt.Errorf("wrapped: %w", nil))
		// return non-nil error interfaces with nil values, which print as %!w(<nil>).
		// 有些库或错误组合（如 fmt.Errorf("wrapped: %w", nil)) 实际上返回的 error 是非 nil 的 interface，
		// 但内部值是 nil，这种错误打印就会出现 %!w(<nil>)。
		if err := fn(); err != nil && fmt.Sprintf("%v", err) != "<nil>" {
			logError(logx.L(), "async execution", err)
		}
	}()
}

/**
 ** SafeGoWithName is like SafeGo but includes a descriptive name in logs.
 ** Useful for identifying which goroutine failed in logs.
 ** SafeGoWithName 类似于 SafeGo，但在日志中包含描述性名称。
 ** 用于在日志中识别哪个 goroutine 失败。
 *
 * Parameters:
 *   !- fn: Function to execute asynchronously (要异步执行的函数)
 *   !- name: Descriptive name for this goroutine (此 goroutine 的描述性名称)
 *
 * Examples:
 *
 * 	// Example 1: Named background jobs (示例 1：命名后台任务)
 * 	SafeGoWithName(func() error {
 * 		return syncService.SyncUsers()
 * 	}, "user-sync")
 * 	// Logs will show: "goroutine [user-sync] error" or "goroutine [user-sync] panic"
 *
 * 	// Example 2: Multiple concurrent tasks (示例 2：多个并发任务)
 * 	SafeGoWithName(func() error {
 * 		return cacheService.WarmupCache()
 * 	}, "cache-warmup")
 *
 * 	SafeGoWithName(func() error {
 * 		return analyticsService.ProcessEvents()
 * 	}, "analytics-processor")
 *
 * 	// Example 3: Per-user background task (示例 3：每个用户的后台任务)
 * 	for _, userID := range userIDs {
 * 		SafeGoWithName(func() error {
 * 			return notifyUser(userID)
 * 		}, fmt.Sprintf("notify-user-%s", userID))
 * 	}
 */
func SafeGoWithName(fn func() error, name string) {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				logPanic(logx.L(), fmt.Sprintf("goroutine [%s] panic", name), r)
			}
		}()

		if err := fn(); err != nil && fmt.Sprintf("%v", err) != "<nil>" {
			logError(logx.L(), fmt.Sprintf("goroutine [%s] error", name), err)
		}
	}()
}

/**
 ** SafeGoSimple executes a simple function (no error return) asynchronously with a name label.
 ** Wraps the function to fit the SafeGoWithName signature.
 ** SafeGoSimple 异步执行简单函数（无错误返回），带名称标签。
 ** 包装函数以适应 SafeGoWithName 签名。
 *
 * Parameters:
 *   !- fn: Simple function with no return value (无返回值的简单函数)
 *   !- flag: Descriptive name/flag for logging (用于日志的描述性名称/标志)
 *
 * Examples:
 *
 * 	// Example 1: Simple cleanup task (示例 1：简单清理任务)
 * 	SafeGoSimple(func() {
 * 		tempFiles.Cleanup()
 * 	}, "cleanup-temp-files")
 *
 * 	// Example 2: Fire-and-forget logging (示例 2：发送即忘的日志记录)
 * 	SafeGoSimple(func() {
 * 		metrics.Increment("orders.created")
 * 	}, "metrics-increment")
 *
 * 	// Example 3: Background cache update (示例 3：后台缓存更新)
 * 	SafeGoSimple(func() {
 * 		cache.Set("key", value)
 * 	}, "cache-update")
 */
func SafeGoSimple(fn func(), flag string) {
	SafeGoWithName(func() error {
		fn()
		return nil
	}, flag)
}

/**
 ** SafeDo executes a function synchronously with panic recovery.
 ** Unlike SafeGo, this blocks until the function completes and returns the result.
 ** Panics are recovered, logged, and the function returns zero value with no error.
 ** SafeDo 同步执行函数并带有 panic 恢复。
 ** 与 SafeGo 不同，这会阻塞直到函数完成并返回结果。
 ** panic 会被恢复并记录，函数返回零值但不返回错误。
 *
 * Type Parameters:
 *   !- T: Return type of the function (函数的返回类型)
 *
 * Parameters:
 *   !- fn: Function to execute synchronously (要同步执行的函数)
 *
 * Returns:
 *   !- T: Result from the function or zero value if panic (函数的结果，panic 时返回零值)
 *   !- error: Error from the function (函数的错误)
 *
 * Examples:
 *
 * 	// Example 1: Safe parsing (示例 1：安全解析)
 * 	result, err := SafeDo(func() (int, error) {
 * 		return strconv.Atoi(input)
 * 	})
 * 	if err != nil {
 * 		log.Printf("Parse error: %v", err)
 * 	}
 *
 * 	// Example 2: Protect against third-party panics (示例 2：防止第三方库 panic)
 * 	data, err := SafeDo(func() ([]byte, error) {
 * 		// This might panic in third-party code
 * 		return thirdPartyLib.ProcessData(input)
 * 	})
 * 	// Panic is caught, logged, and returns (nil, nil)
 *
 * 	// Example 3: Database query with panic protection (示例 3：带 panic 保护的数据库查询)
 * 	user, err := SafeDo(func() (*User, error) {
 * 		var user User
 * 		err := db.Where("id = ?", userID).First(&user).Error
 * 		return &user, err
 * 	})
 *
 * 	// Example 4: JSON unmarshaling (示例 4：JSON 反序列化)
 * 	var config Config
 * 	_, err := SafeDo(func() (struct{}, error) {
 * 		return struct{}{}, json.Unmarshal(data, &config)
 * 	})
 */
func SafeDo[T any](fn func() (T, error)) (T, error) {
	defer func() {
		if r := recover(); r != nil {
			logPanic(logx.L(), "sync execution", r)
		}
	}()

	return fn()
}

/**
 ** SafeDoVoid executes a void function (no return value) synchronously with panic recovery.
 ** Convenience wrapper around SafeDo for functions that only return errors.
 ** SafeDoVoid 同步执行无返回值函数并带有 panic 恢复。
 ** SafeDo 的便捷包装，用于只返回错误的函数。
 *
 * Parameters:
 *   !- fn: Function to execute synchronously (要同步执行的函数)
 *
 * Examples:
 *
 * 	// Example 1: Safe file write (示例 1：安全文件写入)
 * 	SafeDoVoid(func() error {
 * 		return os.WriteFile("config.json", data, 0644)
 * 	})
 *
 * 	// Example 2: Database migration (示例 2：数据库迁移)
 * 	SafeDoVoid(func() error {
 * 		return db.AutoMigrate(&User{}, &Order{})
 * 	})
 *
 * 	// Example 3: API call (示例 3：API 调用)
 * 	SafeDoVoid(func() error {
 * 		return apiClient.SendRequest(endpoint, payload)
 * 	})
 */
func SafeDoVoid(fn func() error) {
	SafeDo(func() (struct{}, error) {
		return struct{}{}, fn()
	})
}

// ======================== Logging ========================

func logPanic(logger *zap.Logger, operation string, r interface{}) {
	logger.Error("panic recovered",
		zap.String("operation", operation),
		zap.Any("panic", r),
		zap.String("stack", string(debug.Stack())),
	)
}

func logError(logger *zap.Logger, operation string, err error) {
	unwrapped := errors.Unwrap(err)
	logger.Error("execution error",
		zap.String("operation", operation),
		zap.Error(err),
		zap.Bool("isNilWrapped", unwrapped == nil),
	)
}
