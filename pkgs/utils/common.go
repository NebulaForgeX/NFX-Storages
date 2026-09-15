package utils

/**
 ** DefaultIfZero returns the default value if the given value is zero, otherwise returns the value itself.
 ** 如果给定值为零值，则返回默认值，否则返回值本身。
 *
 * Type Parameters:
 *   !- T: Any comparable type (可比较的类型)
 *
 * Parameters:
 *   !- v: The value to check (要检查的值)
 *   !- def: The default value to return if v is zero (v为零值时返回的默认值)
 *
 * Returns:
 *   !- T: Either v or def (v 或 def)
 *
 * Examples:
 *
 * 	// With strings (字符串示例)
 * 	result := DefaultIfZero("", "default")  // Returns: "default"
 * 	result := DefaultIfZero("hello", "default")  // Returns: "hello"
 *
 * 	// With integers (整数示例)
 * 	result := DefaultIfZero(0, 100)  // Returns: 100
 * 	result := DefaultIfZero(42, 100)  // Returns: 42
 *
 * 	// With pointers (指针示例)
 * 	var ptr *string
 * 	defaultPtr := &someString
 * 	result := DefaultIfZero(ptr, defaultPtr)  // Returns: defaultPtr
 */
func DefaultIfZero[T comparable](v T, def T) T {
	var zero T
	if v == zero {
		return def
	}
	return v
}

/**
 ** Clamp restricts a value to be within the specified range [lo, hi].
 ** 将值限制在指定范围 [lo, hi] 内。
 *
 * Parameters:
 *   !- v: The value to clamp (要限制的值)
 *   !- lo: The minimum allowed value (最小允许值)
 *   !- hi: The maximum allowed value (最大允许值)
 *
 * Returns:
 *   !- int: The clamped value (限制后的值)
 *
 * Examples:
 *
 * 	result := Clamp(5, 1, 10)   // Returns: 5 (within range / 在范围内)
 * 	result := Clamp(-5, 1, 10)  // Returns: 1 (below minimum / 低于最小值)
 * 	result := Clamp(15, 1, 10)  // Returns: 10 (above maximum / 高于最大值)
 * 	result := Clamp(0, 0, 100)  // Returns: 0 (at minimum / 在最小值)
 * 	result := Clamp(100, 0, 100) // Returns: 100 (at maximum / 在最大值)
 */
func Clamp(v, lo, hi int) int {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}
