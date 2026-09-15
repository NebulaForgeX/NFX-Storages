package typeutil

/**
 ** IsNativeType checks if a value is a native Go type.
 ** Native types include: nil, string, int variants, uint variants, float variants, bool, and []byte.
 ** IsNativeType 检查值是否为 Go 原生类型。
 ** 原生类型包括：nil、string、int 变体、uint 变体、float 变体、bool 和 []byte。
 *
 * Parameters:
 *   !- value: The value to check (要检查的值)
 *
 * Returns:
 *   !- bool: true if the value is a native type, false otherwise (值是原生类型返回 true，否则返回 false)
 *
 * Supported Types (支持的类型):
 *   - nil
 *   - string
 *   - int, int8, int16, int32, int64
 *   - uint, uint8, uint16, uint32, uint64
 *   - float32, float64
 *   - bool
 *   - []byte
 *
 * Examples:
 *
 * 	// Native types (原生类型)
 * 	IsNativeType(nil)           // Returns: true
 * 	IsNativeType("hello")       // Returns: true
 * 	IsNativeType(42)            // Returns: true
 * 	IsNativeType(int32(42))     // Returns: true
 * 	IsNativeType(uint64(100))   // Returns: true
 * 	IsNativeType(3.14)          // Returns: true
 * 	IsNativeType(float32(2.5))  // Returns: true
 * 	IsNativeType(true)          // Returns: true
 * 	IsNativeType([]byte{1,2,3}) // Returns: true
 *
 * 	// Non-native types (非原生类型)
 * 	IsNativeType(time.Now())             // Returns: false
 * 	IsNativeType(uuid.New())             // Returns: false
 * 	IsNativeType([]string{"a", "b"})     // Returns: false
 * 	IsNativeType(map[string]int{})       // Returns: false
 * 	IsNativeType(struct{ Name string }{}) // Returns: false
 */
func IsNativeType(value any) bool {
	if value == nil {
		return true
	}
	// Use type assertions for better performance than reflect
	switch value.(type) {
	case string, int, int8, int16, int32, int64,
		uint, uint8, uint16, uint32, uint64,
		float32, float64, bool, []byte:
		return true
	default:
		return false
	}
}
