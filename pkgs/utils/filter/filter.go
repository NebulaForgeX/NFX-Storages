package filter

import (
	"database/sql"
	"reflect"
	"strings"
	"time"

	"github.com/google/uuid"
)

/**
 ** FilterByAllowed filters a slice based on an allowed set of values.
 ** Only items whose key (extracted by keyFunc) exists in the allowed set are kept.
 ** FilterByAllowed 根据允许的值集合过滤切片。
 ** 只保留其键（通过 keyFunc 提取）存在于允许集合中的项。
 *
 * Type Parameters:
 *   !- T: Element type (元素类型)
 *   !- K: Key type (must be comparable) (键类型，必须可比较)
 *
 * Parameters:
 *   !- items: Input slice to filter (要过滤的输入切片)
 *   !- allowed: Set of allowed keys (允许的键集合)
 *   !- keyFunc: Function to extract key from each item (从每个项提取键的函数)
 *
 * Returns:
 *   !- []T: Filtered slice containing only allowed items (只包含允许项的过滤切片)
 *
 * Examples:
 *
 * 	type User struct {
 * 		ID   int
 * 		Name string
 * 	}
 *
 * 	users := []User{
 * 		{ID: 1, Name: "Alice"},
 * 		{ID: 2, Name: "Bob"},
 * 		{ID: 3, Name: "Charlie"},
 * 	}
 *
 * 	allowed := map[int]struct{}{
 * 		1: {},
 * 		3: {},
 * 	}
 *
 * 	filtered := FilterByAllowed(users, allowed, func(u User) int { return u.ID })
 * 	// Returns: [{ID: 1, Name: "Alice"}, {ID: 3, Name: "Charlie"}]
 *
 * 	// Empty slice (空切片)
 * 	result := FilterByAllowed([]User{}, allowed, func(u User) int { return u.ID })
 * 	// Returns: nil
 */
func FilterByAllowed[T any, K comparable](items []T, allowed map[K]struct{}, keyFunc func(T) K) []T {
	if len(items) == 0 {
		return nil
	}

	out := make([]T, 0, len(items))
	for _, item := range items {
		key := keyFunc(item)
		if _, ok := allowed[key]; ok {
			out = append(out, item)
		}
	}
	return out
}

/**
 ** NormalizeValues filters and normalizes a slice of any values.
 ** It removes nil values, empty strings (after trimming), uuid.Nil, and dereferences one level of pointers.
 ** NormalizeValues 过滤和规范化 any 类型值的切片。
 ** 它会移除 nil 值、空字符串（修剪后）、uuid.Nil，并解引用一层指针。
 *
 * Parameters:
 *   !- in: Input slice of any values (any 类型值的输入切片)
 *
 * Returns:
 *   !- []any: Normalized and filtered slice (规范化和过滤后的切片)
 *
 * Examples:
 *
 * 	values := []any{
 * 		"hello",
 * 		nil,
 * 		"  ",           // Empty after trim
 * 		42,
 * 		ptr.Ptr(100),   // Pointer to 100
 * 		uuid.Nil,       // Will be filtered out
 * 		true,
 * 	}
 *
 * 	normalized := NormalizeValues(values)
 * 	// Returns: []any{"hello", 42, 100, true}
 *
 * 	// Empty slice (空切片)
 * 	result := NormalizeValues([]any{})
 * 	// Returns: nil
 */
func NormalizeValues(in []any) []any {
	n := len(in)
	if n == 0 {
		return nil
	}

	// reuse underlying array, avoid extra allocation
	out := in[:0]

	for _, v := range in {
		v, ok := NormalizeValue(v)
		if !ok {
			continue
		}
		out = append(out, v)
	}

	return out
}

/**
 ** NormalizeValue filters and normalizes a single value.
 ** It returns (normalized_value, true) for valid values and (nil, false) for invalid ones.
 ** Invalid values include: nil, empty/whitespace strings, uuid.Nil, and nil pointers.
 ** For pointers to valid values, it dereferences them.
 ** NormalizeValue 过滤和规范化单个值。
 ** 对于有效值返回 (规范化值, true)，对于无效值返回 (nil, false)。
 ** 无效值包括：nil、空/空白字符串、uuid.Nil 和 nil 指针。
 ** 对于指向有效值的指针，会解引用它们。
 *
 * Parameters:
 *   !- in: Input value (输入值)
 *
 * Returns:
 *   !- any: Normalized value (规范化后的值)
 *   !- bool: true if value is valid, false otherwise (值有效返回 true，否则返回 false)
 *
 * Examples:
 *
 * 	// Valid values (有效值)
 * 	val, ok := NormalizeValue("hello")
 * 	// val = "hello", ok = true
 *
 * 	val, ok := NormalizeValue(42)
 * 	// val = 42, ok = true
 *
 * 	num := 100
 * 	val, ok := NormalizeValue(&num)
 * 	// val = 100, ok = true (dereferenced / 已解引用)
 *
 * 	// Invalid values (无效值)
 * 	val, ok := NormalizeValue(nil)
 * 	// val = nil, ok = false
 *
 * 	val, ok := NormalizeValue("  ")
 * 	// val = nil, ok = false (empty after trim)
 *
 * 	val, ok := NormalizeValue(uuid.Nil)
 * 	// val = nil, ok = false
 *
 * 	var ptr *int
 * 	val, ok := NormalizeValue(ptr)
 * 	// val = nil, ok = false
 */
func NormalizeValue(in any) (any, bool) {
	if in == nil {
		return nil, false
	}

	switch x := in.(type) {
	case string:
		if strings.TrimSpace(x) == "" {
			return nil, false
		}
		return x, true
	case bool, int, int8, int16, int32, int64,
		uint, uint8, uint16, uint32, uint64,
		float32, float64,
		time.Time, sql.NullBool, sql.NullInt64, sql.NullFloat64, sql.NullString, sql.NullTime:
		return x, true
	case uuid.UUID:
		if x == uuid.Nil {
			return nil, false
		}
		return x, true

	case *bool:
		if x != nil {
			return *x, true
		}
		return nil, false
	case *int:
		if x != nil {
			return *x, true
		}
		return nil, false
	case *int8:
		if x != nil {
			return *x, true
		}
		return nil, false
	case *int16:
		if x != nil {
			return *x, true
		}
		return nil, false
	case *int32:
		if x != nil {
			return *x, true
		}
		return nil, false
	case *int64:
		if x != nil {
			return *x, true
		}
		return nil, false
	case *uint:
		if x != nil {
			return *x, true
		}
		return nil, false
	case *uint8:
		if x != nil {
			return *x, true
		}
		return nil, false
	case *uint16:
		if x != nil {
			return *x, true
		}
		return nil, false
	case *uint32:
		if x != nil {
			return *x, true
		}
		return nil, false
	case *uint64:
		if x != nil {
			return *x, true
		}
		return nil, false
	case *float32:
		if x != nil {
			return *x, true
		}
		return nil, false
	case *float64:
		if x != nil {
			return *x, true
		}
		return nil, false
	case *string:
		if x != nil {
			if strings.TrimSpace(*x) == "" {
				return nil, false
			}
			return *x, true
		}
		return nil, false
	case *sql.NullString:
		if x != nil {
			if !x.Valid || strings.TrimSpace(x.String) == "" {
				return nil, false
			}
			return *x, true
		}
		return nil, false
	case *sql.NullTime:
		if x != nil {
			return *x, true
		}
		return nil, false
	case *uuid.UUID:
		if x != nil {
			if *x == uuid.Nil {
				return nil, false
			}
			return *x, true
		}
		return nil, false
	}

	rv := reflect.ValueOf(in)
	switch rv.Kind() {
	case reflect.Ptr, reflect.Interface, reflect.Slice, reflect.Map, reflect.Func, reflect.Chan:
		if rv.IsNil() {
			return nil, false
		}
	}
	if rv.Kind() == reflect.Ptr {
		ev := rv.Elem()
		if ev.Kind() == reflect.String {
			if strings.TrimSpace(ev.String()) == "" {
				return nil, false
			}
		}
		return ev.Interface(), true
	}
	if rv.Kind() == reflect.String {
		if strings.TrimSpace(rv.String()) == "" {
			return nil, false
		}
	}
	return in, true
}
