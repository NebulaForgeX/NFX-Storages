package mapx

import (
	"fmt"

	"github.com/google/uuid"
)

/**
 ** GetMapValue safely extracts a value from a map[string]any and casts it to the desired type T.
 ** Returns the zero value of T if the key doesn't exist or type assertion fails.
 ** 从 map[string]any 中安全地提取值并转换为所需类型 T。
 ** 如果键不存在或类型断言失败，则返回 T 的零值。
 *
 * Type Parameters:
 *   !- T: The expected type of the value (期望的值类型)
 *
 * Parameters:
 *   !- m: The map to extract from (要从中提取的 map)
 *   !- key: The key to look up (要查找的键)
 *
 * Returns:
 *   !- T: The value if found and type matches, otherwise zero value (找到且类型匹配时返回值，否则返回零值)
 *
 * Examples:
 *
 * 	data := map[string]any{
 * 		"name": "John",
 * 		"age":  30,
 * 		"active": true,
 * 	}
 *
 * 	name := GetMapValue[string](data, "name")     // Returns: "John"
 * 	age := GetMapValue[int](data, "age")          // Returns: 30
 * 	missing := GetMapValue[string](data, "email") // Returns: "" (zero value)
 * 	wrong := GetMapValue[string](data, "age")     // Returns: "" (type mismatch)
 */
func GetMapValue[T any](m map[string]any, key string) T {
	if val, ok := m[key]; ok {
		if casted, ok := val.(T); ok {
			return casted
		}
	}
	var zero T
	return zero
}

/**
 ** GetMapValueWithError safely extracts a value from a map[string]any with error handling.
 ** Returns an error if the key doesn't exist or type assertion fails.
 ** 从 map[string]any 中安全地提取值，带错误处理。
 ** 如果键不存在或类型断言失败，则返回错误。
 *
 * Type Parameters:
 *   !- T: The expected type of the value (期望的值类型)
 *
 * Parameters:
 *   !- m: The map to extract from (要从中提取的 map)
 *   !- key: The key to look up (要查找的键)
 *
 * Returns:
 *   !- T: The value if found and type matches (找到且类型匹配时返回值)
 *   !- error: Error if key not found or type mismatch (键不存在或类型不匹配时的错误)
 *
 * Examples:
 *
 * 	data := map[string]any{
 * 		"name": "John",
 * 		"age":  30,
 * 	}
 *
 * 	// Successful extraction (成功提取)
 * 	name, err := GetMapValueWithError[string](data, "name")
 * 	// name = "John", err = nil
 *
 * 	// Key not found (键不存在)
 * 	email, err := GetMapValueWithError[string](data, "email")
 * 	// email = "", err = "key \"email\" not found"
 *
 * 	// Type mismatch (类型不匹配)
 * 	age, err := GetMapValueWithError[string](data, "age")
 * 	// age = "", err = "key \"age\" is not of expected type"
 */
func GetMapValueWithError[T any](m map[string]any, key string) (T, error) {
	val, ok := m[key]
	if !ok {
		var zero T
		return zero, fmt.Errorf("key %q not found", key)
	}
	casted, ok := val.(T)
	if !ok {
		var zero T
		return zero, fmt.Errorf("key %q is not of expected type", key)
	}
	return casted, nil
}

/**
 ** UuidMapToStrMap converts a map with UUID keys to a map with string keys.
 ** Returns nil if the input map is nil.
 ** 将 UUID 键的 map 转换为字符串键的 map。
 ** 如果输入 map 为 nil，则返回 nil。
 *
 * Parameters:
 *   !- m: The map with UUID keys (UUID 键的 map)
 *
 * Returns:
 *   !- map[string]string: Map with string keys (字符串键的 map)
 *
 * Examples:
 *
 * 	id1 := uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")
 * 	id2 := uuid.MustParse("6ba7b810-9dad-11d1-80b4-00c04fd430c8")
 *
 * 	uuidMap := map[uuid.UUID]string{
 * 		id1: "User 1",
 * 		id2: "User 2",
 * 	}
 *
 * 	strMap := UuidMapToStrMap(uuidMap)
 * 	// Returns: map[string]string{
 * 	//   "550e8400-e29b-41d4-a716-446655440000": "User 1",
 * 	//   "6ba7b810-9dad-11d1-80b4-00c04fd430c8": "User 2",
 * 	// }
 *
 * 	nilMap := UuidMapToStrMap(nil) // Returns: nil
 */
func UuidMapToStrMap(m map[uuid.UUID]string) map[string]string {
	if m == nil {
		return nil
	}
	out := make(map[string]string, len(m))
	for k, v := range m {
		out[k.String()] = v
	}
	return out
}
