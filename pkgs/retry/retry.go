package retry

import (
	"context"
	"nfxstorages/pkgs/utils/contextx"
	"time"

	"github.com/cenkalti/backoff/v5"
)

/**
 ** Config defines the configuration for retry operations.
 ** Supports exponential backoff, jitter, max retries, and custom retry logic.
 ** Config 定义重试操作的配置。
 ** 支持指数退避、抖动、最大重试次数和自定义重试逻辑。
 *
 * Fields:
 *   !- InitialInterval: Initial retry interval (初始重试间隔)
 *   !- MaxInterval: Maximum retry interval (最大重试间隔)
 *   !- Multiplier: Backoff multiplier for exponential backoff (指数退避的乘数)
 *   !- Jitter: Randomization factor (0-1) to avoid thundering herd (抖动因子 0-1，避免惊群效应)
 *   !- MaxTries: Maximum number of retry attempts (最大重试次数)
 *   !- MaxElapsedTime: Maximum total time for all retries (所有重试的最大总时间)
 *   !- PerAttemptTimeout: Timeout for each individual attempt (每次尝试的超时时间)
 *   !- ShouldRetry: Custom function to determine if retry should happen (自定义函数判断是否应该重试)
 *   !- Notify: Callback function invoked on each retry error (每次重试错误时调用的回调函数)
 *
 * Examples:
 *
 * 	// Example 1: Simple retry with max tries (示例 1：简单重试，最大次数)
 * 	cfg := Config{
 * 		MaxTries: 3,
 * 	}
 *
 * 	// Example 2: Exponential backoff (示例 2：指数退避)
 * 	cfg := Config{
 * 		InitialInterval: 100 * time.Millisecond,
 * 		MaxInterval:     5 * time.Second,
 * 		Multiplier:      2.0,
 * 		MaxTries:        5,
 * 	}
 * 	// Intervals: 100ms, 200ms, 400ms, 800ms, 1600ms
 *
 * 	// Example 3: With jitter to avoid thundering herd (示例 3：带抖动避免惊群)
 * 	cfg := Config{
 * 		InitialInterval: 1 * time.Second,
 * 		Multiplier:      2.0,
 * 		Jitter:          0.1, // ±10% randomization
 * 		MaxTries:        3,
 * 	}
 *
 * 	// Example 4: Time-based limit (示例 4：基于时间的限制)
 * 	cfg := Config{
 * 		InitialInterval: 500 * time.Millisecond,
 * 		MaxElapsedTime:  30 * time.Second, // Stop after 30s total
 * 	}
 *
 * 	// Example 5: Custom retry logic (示例 5：自定义重试逻辑)
 * 	cfg := Config{
 * 		MaxTries: 5,
 * 		ShouldRetry: func(err error, attempt uint, next time.Duration) bool {
 * 			// Only retry on network errors
 * 			return IsNetworkError(err)
 * 		},
 * 		Notify: func(err error, attempt uint, next time.Duration) {
 * 			log.Printf("Retry attempt %d after %v: %v", attempt, next, err)
 * 		},
 * 	}
 *
 * 	// Example 6: Per-attempt timeout (示例 6：每次尝试的超时)
 * 	cfg := Config{
 * 		MaxTries:          3,
 * 		PerAttemptTimeout: 5 * time.Second, // Each attempt times out after 5s
 * 	}
 */
type Config struct {
	InitialInterval   time.Duration                         // Initial interval (初始间隔)
	MaxInterval       time.Duration                         // Maximum interval (最大间隔)
	Multiplier        float64                               // Multiplier for exponential backoff (指数退避乘数)
	Jitter            float64                               // Jitter/randomization factor (抖动/随机化因子)
	MaxTries          uint                                  // Maximum number of retry attempts (最大重试次数)
	MaxElapsedTime    time.Duration                         // Maximum total time for all retries (所有重试的最大总时间)
	PerAttemptTimeout time.Duration                         // Per-attempt timeout (每次尝试的超时)
	ShouldRetry       func(error, uint, time.Duration) bool // Optional: determine if retry should happen (可选：判断是否重试)
	Notify            func(error, uint, time.Duration)      // Optional: callback on each retry error (可选：每次重试错误的回调)
}

/**
 ** DefaultBackoff creates a default exponential backoff configuration with constant interval.
 ** This results in no backoff (immediate retries) unless configured otherwise.
 ** DefaultBackoff 创建默认的指数退避配置，使用恒定间隔。
 ** 除非另有配置，否则将导致无退避（立即重试）。
 *
 * Returns:
 *   !- *backoff.ExponentialBackOff: Default backoff configuration (默认退避配置)
 *
 * Examples:
 *
 * 	// Get default backoff (获取默认退避)
 * 	eb := DefaultBackoff()
 * 	// Retries happen immediately with no delay
 *
 * 	// Customize it (自定义)
 * 	eb := DefaultBackoff()
 * 	eb.InitialInterval = 100 * time.Millisecond
 * 	eb.Multiplier = 2.0
 */
func DefaultBackoff() *backoff.ExponentialBackOff {
	eb := backoff.NewExponentialBackOff()
	eb.InitialInterval = 0
	eb.MaxInterval = 0
	eb.Multiplier = 1.0
	eb.RandomizationFactor = 0
	return eb
}

/**
 ** Retry executes a function with automatic retries based on the provided configuration.
 ** Supports exponential backoff, jitter, context cancellation, per-attempt timeout, and custom retry logic.
 ** Retry 根据提供的配置自动重试执行函数。
 ** 支持指数退避、抖动、上下文取消、每次尝试超时和自定义重试逻辑。
 *
 * Type Parameters:
 *   !- T: Return type of the function (函数的返回类型)
 *
 * Parameters:
 *   !- ctx: Context for cancellation and deadline (用于取消和截止时间的上下文)
 *   !- fn: Function to retry (要重试的函数)
 *   !- cfg: Retry configuration (重试配置)
 *
 * Returns:
 *   !- T: Result from the function (函数的结果)
 *   !- error: Error if all retries failed or context cancelled (所有重试失败或上下文取消时的错误)
 *
 * Examples:
 *
 * 	// Example 1: Simple API call with retries (示例 1：带重试的简单 API 调用)
 * 	result, err := Retry(ctx, func(ctx context.Context) (*Response, error) {
 * 		return apiClient.FetchData(ctx, endpoint)
 * 	}, Config{
 * 		MaxTries:        3,
 * 		InitialInterval: 1 * time.Second,
 * 		Multiplier:      2.0,
 * 	})
 *
 * 	// Example 2: Database query with exponential backoff (示例 2：带指数退避的数据库查询)
 * 	user, err := Retry(ctx, func(ctx context.Context) (*User, error) {
 * 		var user User
 * 		err := db.WithContext(ctx).Where("id = ?", userID).First(&user).Error
 * 		return &user, err
 * 	}, Config{
 * 		InitialInterval: 100 * time.Millisecond,
 * 		MaxInterval:     5 * time.Second,
 * 		Multiplier:      2.0,
 * 		MaxTries:        5,
 * 	})
 *
 * 	// Example 3: Only retry on network errors (示例 3：仅对网络错误重试)
 * 	data, err := Retry(ctx, func(ctx context.Context) ([]byte, error) {
 * 		return httpClient.Get(ctx, url)
 * 	}, Config{
 * 		MaxTries: 5,
 * 		InitialInterval: 500 * time.Millisecond,
 * 		ShouldRetry: func(err error, attempt uint, next time.Duration) bool {
 * 			return IsNetworkError(err)
 * 		},
 * 	})
 *
 * 	// Example 4: With notifications (示例 4：带通知)
 * 	result, err := Retry(ctx, func(ctx context.Context) (string, error) {
 * 		return externalService.Process(ctx, data)
 * 	}, Config{
 * 		MaxTries: 3,
 * 		InitialInterval: 1 * time.Second,
 * 		Notify: func(err error, attempt uint, next time.Duration) {
 * 			log.Printf("Attempt %d failed: %v, retrying in %v", attempt, err, next)
 * 		},
 * 	})
 *
 * 	// Example 5: Per-attempt timeout (示例 5：每次尝试超时)
 * 	result, err := Retry(ctx, func(ctx context.Context) (int, error) {
 * 		// Each attempt will timeout after 5 seconds
 * 		return slowOperation(ctx)
 * 	}, Config{
 * 		MaxTries:          3,
 * 		PerAttemptTimeout: 5 * time.Second,
 * 		InitialInterval:   1 * time.Second,
 * 	})
 *
 * 	// Example 6: Time-bound retries (示例 6：限时重试)
 * 	result, err := Retry(ctx, func(ctx context.Context) (bool, error) {
 * 		return checkCondition()
 * 	}, Config{
 * 		InitialInterval: 100 * time.Millisecond,
 * 		MaxElapsedTime:  10 * time.Second, // Give up after 10 seconds total
 * 	})
 */
func Retry[T any](ctx context.Context, fn func(context.Context) (T, error), cfg Config) (T, error) {
	var zero T

	// Exponential backoff
	eb := DefaultBackoff()
	if cfg.InitialInterval > 0 {
		eb.InitialInterval = cfg.InitialInterval
	}
	if cfg.MaxInterval > 0 {
		eb.MaxInterval = cfg.MaxInterval
	}
	if cfg.Multiplier > 0 {
		eb.Multiplier = cfg.Multiplier
	}
	if cfg.Jitter > 0 {
		eb.RandomizationFactor = cfg.Jitter
	}
	eb.Reset()

	// Reusable timer
	timer := time.NewTimer(0)
	if !timer.Stop() {
		select {
		case <-timer.C:
		default:
		}
	}
	defer timer.Stop()

	startedAt := time.Now()
	for attempt := uint(1); ; attempt++ {
		attemptCtx, cancel := contextx.PerAttemptCtx(ctx, cfg.PerAttemptTimeout)
		res, err := fn(attemptCtx)
		cancel()
		if err == nil {
			return res, nil
		}

		// Stop retrying if maximum tries exceeded.
		if cfg.MaxTries > 0 && attempt >= cfg.MaxTries {
			return zero, err
		}

		// Stop retrying if context is cancelled.
		if cerr := context.Cause(ctx); cerr != nil {
			return zero, cerr
		}

		// Calculate next backoff duration.
		next := eb.NextBackOff()
		if next == backoff.Stop {
			return zero, err
		}

		// Stop retrying if the operation should not be retried.
		if cfg.ShouldRetry != nil && !cfg.ShouldRetry(err, attempt, next) {
			return zero, err
		}

		// Stop retrying if maximum elapsed time exceeded.
		if cfg.MaxElapsedTime > 0 && time.Since(startedAt)+next > cfg.MaxElapsedTime {
			return zero, err
		}

		// Notify on error if a notifier function is provided.
		if cfg.Notify != nil {
			cfg.Notify(err, attempt, next)
		}

		// Wait for the next backoff period or context cancellation.
		if !timer.Stop() {
			select {
			case <-timer.C:
			default:
			}
		}
		timer.Reset(next)

		select {
		case <-timer.C:
		case <-ctx.Done():
			return zero, context.Cause(ctx)
		}
	}
}

/**
 ** RetryVoid executes a void function (no return value) with automatic retries.
 ** Convenience wrapper around Retry for functions that only return errors.
 ** RetryVoid 自动重试执行无返回值函数。
 ** Retry 的便捷包装，用于只返回错误的函数。
 *
 * Parameters:
 *   !- ctx: Context for cancellation and deadline (用于取消和截止时间的上下文)
 *   !- fn: Function to retry (要重试的函数)
 *   !- cfg: Retry configuration (重试配置)
 *
 * Returns:
 *   !- error: Error if all retries failed or context cancelled (所有重试失败或上下文取消时的错误)
 *
 * Examples:
 *
 * 	// Example 1: File upload with retries (示例 1：带重试的文件上传)
 * 	err := RetryVoid(ctx, func(ctx context.Context) error {
 * 		return uploadFile(ctx, filePath)
 * 	}, Config{
 * 		MaxTries:        3,
 * 		InitialInterval: 2 * time.Second,
 * 	})
 *
 * 	// Example 2: Database migration (示例 2：数据库迁移)
 * 	err := RetryVoid(ctx, func(ctx context.Context) error {
 * 		return db.WithContext(ctx).AutoMigrate(&User{}, &Order{})
 * 	}, Config{
 * 		MaxTries:        5,
 * 		InitialInterval: 1 * time.Second,
 * 		Multiplier:      2.0,
 * 	})
 *
 * 	// Example 3: Send notification (示例 3：发送通知)
 * 	err := RetryVoid(ctx, func(ctx context.Context) error {
 * 		return notificationService.Send(ctx, userID, message)
 * 	}, Config{
 * 		MaxTries: 3,
 * 		ShouldRetry: func(err error, attempt uint, next time.Duration) bool {
 * 			// Only retry on transient errors
 * 			return IsNetworkError(err) || IsCacheError(err)
 * 		},
 * 	})
 */
func RetryVoid(ctx context.Context, fn func(context.Context) error, cfg Config) error {
	_, err := Retry(ctx, func(ctx context.Context) (struct{}, error) {
		return struct{}{}, fn(ctx)
	}, cfg)
	return err
}
