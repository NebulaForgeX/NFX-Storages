package contextx

import (
	"context"
	"time"
)

/**
 ** PerAttemptCtx creates a context with per-attempt timeout for retry logic.
 ** It intelligently decides whether to create a new context or reuse the parent context.
 ** 为重试逻辑创建带有单次尝试超时的上下文。
 ** 它会智能地决定是创建新上下文还是重用父上下文。
 *
 * Parameters:
 *   !- ctx: Parent context (父上下文)
 *   !- perAttempt: Timeout duration for this attempt (本次尝试的超时时间)
 *
 * Returns:
 *   !- context.Context: Context to use for this attempt (用于本次尝试的上下文)
 *   !- context.CancelFunc: Cancel function (must be called by caller) (取消函数，调用者必须调用)
 *
 * Behavior:
 *   - If perAttempt <= 0 and ctx has no deadline, returns (ctx, noop-cancel)
 *   - If parent deadline is closer, uses parent timeout
 *   - If difference is < 1ms, returns parent ctx to avoid overhead
 *   - Otherwise creates new context with perAttempt timeout
 *
 * Examples:
 *
 * 	// Basic usage with retry logic (基本用法：重试逻辑)
 * 	parentCtx := context.Background()
 * 	perAttempt := 5 * time.Second
 *
 * 	for attempt := 0; attempt < 3; attempt++ {
 * 		attemptCtx, cancel := PerAttemptCtx(parentCtx, perAttempt)
 * 		defer cancel()
 *
 * 		err := doSomething(attemptCtx)
 * 		if err == nil {
 * 			break // Success
 * 		}
 * 		// Retry on next iteration
 * 	}
 *
 * 	// With parent timeout (带父上下文超时)
 * 	parentCtx, parentCancel := context.WithTimeout(context.Background(), 10*time.Second)
 * 	defer parentCancel()
 *
 * 	// First attempt: uses 5s timeout
 * 	attemptCtx1, cancel1 := PerAttemptCtx(parentCtx, 5*time.Second)
 * 	defer cancel1()
 *
 * 	time.Sleep(6 * time.Second) // Simulate work
 *
 * 	// Second attempt: parent has 4s left, so uses parent deadline
 * 	attemptCtx2, cancel2 := PerAttemptCtx(parentCtx, 5*time.Second)
 * 	defer cancel2()
 *
 * 	// No per-attempt timeout (无单次尝试超时)
 * 	attemptCtx, cancel := PerAttemptCtx(parentCtx, 0)
 * 	defer cancel() // This is a no-op if parent ctx was returned
 */
func PerAttemptCtx(ctx context.Context, perAttempt time.Duration) (context.Context, context.CancelFunc) {
	if perAttempt <= 0 {
		if _, ok := ctx.Deadline(); !ok {
			return ctx, func() {} // no-op cancel
		}
	}

	if dl, ok := ctx.Deadline(); ok {
		remain := time.Until(dl)
		if perAttempt <= 0 || perAttempt > remain {
			perAttempt = remain
		}
		// If the perAttempt is almost the same as the remaining time of the parent (e.g. less than 1ms),
		// we can directly use the parent ctx to avoid creating a nearly equivalent WithTimeout.
		if perAttempt <= 0 || perAttempt >= remain-1*time.Millisecond {
			return ctx, func() {}
		}
	}

	// If a shorter per-attempt deadline is needed, create a new context with a timeout.
	return context.WithTimeout(ctx, perAttempt)
}
