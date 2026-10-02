package ptr

import (
	"reflect"

	"github.com/google/uuid"
)

/**
 ** Ptr creates a pointer to the given value.
 ** Ptr 创建指向给定值的指针。
 *
 * Type Parameters:
 *   !- T: The type of the value (值的类型)
 *
 * Parameters:
 *   !- v: The value to create a pointer to (要创建指针的值)
 *
 * Returns:
 *   !- *T: Pointer to the value (指向值的指针)
 *
 * Examples:
 *
 * 	num := Ptr(42)
 * 	// num = &42
 *
 * 	str := Ptr("hello")
 * 	// str = &"hello"
 *
 * 	// Useful for inline pointer creation (适用于内联指针创建)
 * 	user := User{
 * 		Name: Ptr("Alice"),
 * 		Age:  Ptr(30),
 * 	}
 */
func Ptr[T any](v T) *T {
	return &v
}

/**
 ** Deref safely dereferences a pointer, returning zero value if pointer is nil.
 ** Deref 安全地解引用指针，如果指针为 nil 则返回零值。
 *
 * Type Parameters:
 *   !- T: The type of the pointed value (指向值的类型)
 *
 * Parameters:
 *   !- p: The pointer to dereference (要解引用的指针)
 *
 * Returns:
 *   !- T: The dereferenced value or zero value (解引用的值或零值)
 *
 * Examples:
 *
 * 	num := 42
 * 	val := Deref(&num)
 * 	// val = 42
 *
 * 	var ptr *int
 * 	val := Deref(ptr)
 * 	// val = 0 (zero value for int)
 *
 * 	str := "hello"
 * 	val := Deref(&str)
 * 	// val = "hello"
 *
 * 	var strPtr *string
 * 	val := Deref(strPtr)
 * 	// val = "" (zero value for string)
 */
func Deref[T any](p *T) T {
	if p == nil {
		var zero T
		return zero
	}
	return *p
}

/**
 ** DerefWithDefault safely dereferences a pointer with a custom default value.
 ** Returns the default value if pointer is nil.
 ** DerefWithDefault 安全地解引用指针，带自定义默认值。
 ** 如果指针为 nil，则返回默认值。
 *
 * Type Parameters:
 *   !- T: The type of the pointed value (指向值的类型)
 *
 * Parameters:
 *   !- p: The pointer to dereference (要解引用的指针)
 *   !- def: The default value to return if p is nil (p 为 nil 时返回的默认值)
 *
 * Returns:
 *   !- T: The dereferenced value or default value (解引用的值或默认值)
 *
 * Examples:
 *
 * 	num := 42
 * 	val := DerefWithDefault(&num, 100)
 * 	// val = 42
 *
 * 	var ptr *int
 * 	val := DerefWithDefault(ptr, 100)
 * 	// val = 100 (default value)
 *
 * 	str := "hello"
 * 	val := DerefWithDefault(&str, "default")
 * 	// val = "hello"
 *
 * 	var strPtr *string
 * 	val := DerefWithDefault(strPtr, "default")
 * 	// val = "default"
 */
func DerefWithDefault[T any](p *T, def T) T {
	if p == nil {
		return def
	}
	return *p
}

/**
 ** PtrIfNotZero creates a pointer to value only if value is not zero.
 ** Returns nil if value is zero.
 ** PtrIfNotZero 只在值不为零时创建指向值的指针。
 ** 如果值为零则返回 nil。
 *
 * Type Parameters:
 *   !- T: The type of the value (must be comparable) (值的类型，必须可比较)
 *
 * Parameters:
 *   !- v: The value to create a pointer to (要创建指针的值)
 *
 * Returns:
 *   !- *T: Pointer to value if non-zero, nil otherwise (非零时返回指向值的指针，否则返回 nil)
 *
 * Examples:
 *
 * 	ptr := PtrIfNotZero(42)
 * 	// ptr = &42
 *
 * 	ptr := PtrIfNotZero(0)
 * 	// ptr = nil
 *
 * 	ptr := PtrIfNotZero("hello")
 * 	// ptr = &"hello"
 *
 * 	ptr := PtrIfNotZero("")
 * 	// ptr = nil
 *
 * 	// Useful for optional fields (适用于可选字段)
 * 	user := User{
 * 		Name: PtrIfNotZero(name), // nil if name is empty
 * 	}
 */
func PtrIfNotZero[T comparable](v T) *T {
	var zero T
	if v == zero {
		return nil
	}
	return &v
}

/**
 ** Map transforms a pointer value using a function, returning zero if nil.
 ** Map 使用函数转换指针值，如果为 nil 则返回零值。
 *
 * Type Parameters:
 *   !- T: Input type (输入类型)
 *   !- R: Output type (输出类型)
 *
 * Parameters:
 *   !- xs: Input pointer (输入指针)
 *   !- fn: Transformation function (转换函数)
 *
 * Returns:
 *   !- R: Transformed value or zero value (转换后的值或零值)
 *
 * Examples:
 *
 * 	num := 42
 * 	result := Map(&num, func(n int) string { return fmt.Sprint(n) })
 * 	// result = "42"
 *
 * 	var ptr *int
 * 	result := Map(ptr, func(n int) string { return fmt.Sprint(n) })
 * 	// result = "" (zero value for string)
 */
func Map[T any, R any](xs *T, fn func(T) R) R {
	if xs == nil {
		var zero R
		return zero
	}
	return fn(*xs)
}

/**
 ** MapP transforms a pointer value using a pointer function.
 ** MapP 使用指针函数转换指针值。
 *
 * Examples:
 *
 * 	type User struct { Name string }
 * 	user := &User{Name: "Alice"}
 * 	name := MapP(user, func(u *User) string { return u.Name })
 * 	// name = "Alice"
 */
func MapP[T any, R any](xs *T, fn func(*T) R) R {
	if xs == nil {
		var zero R
		return zero
	}
	return fn(xs)
}

/**
 ** MapPP transforms using pointer in/out function, dereferencing result.
 ** MapPP 使用指针输入输出函数转换，解引用结果。
 *
 * Examples:
 *
 * 	num := 42
 * 	result := MapPP(&num, func(n *int) *string {
 * 		s := fmt.Sprint(*n)
 * 		return &s
 * 	})
 * 	// result = "42" (dereferenced)
 */
func MapPP[T any, R any](xs *T, fn func(*T) *R) R {
	if xs == nil {
		var zero R
		return zero
	}
	return *fn(xs)
}

/**
 ** MapPtr transforms a pointer value and returns a pointer to result.
 ** Returns nil if input is nil.
 ** MapPtr 转换指针值并返回指向结果的指针。
 ** 如果输入为 nil 则返回 nil。
 *
 * Examples:
 *
 * 	num := 42
 * 	result := MapPtr(&num, func(n int) string { return fmt.Sprint(n) })
 * 	// result = &"42"
 *
 * 	var ptr *int
 * 	result := MapPtr(ptr, func(n int) string { return fmt.Sprint(n) })
 * 	// result = nil
 */
func MapPtr[T any, R any](xs *T, fn func(T) R) *R {
	if xs == nil {
		return nil
	}
	r := fn(*xs)
	return &r
}

/**
 ** MapPtrP transforms using pointer function and returns pointer to result.
 ** MapPtrP 使用指针函数转换并返回指向结果的指针。
 *
 * Examples:
 *
 * 	type User struct { Name string }
 * 	user := &User{Name: "Alice"}
 * 	name := MapPtrP(user, func(u *User) string { return u.Name })
 * 	// name = &"Alice"
 */
func MapPtrP[T any, R any](xs *T, fn func(*T) R) *R {
	if xs == nil {
		return nil
	}
	r := fn(xs)
	return &r
}

/**
 ** MapPtrPP transforms using pointer in/out function, returning pointer.
 ** MapPtrPP 使用指针输入输出函数转换，返回指针。
 *
 * Examples:
 *
 * 	num := 42
 * 	result := MapPtrPP(&num, func(n *int) *string {
 * 		s := fmt.Sprint(*n)
 * 		return &s
 * 	})
 * 	// result = &"42"
 */
func MapPtrPP[T any, R any](xs *T, fn func(*T) *R) *R {
	if xs == nil {
		return nil
	}
	return fn(xs)
}

/**
 ** IsNil checks if a value is nil, handling various types correctly.
 ** Works with pointers, channels, functions, interfaces, maps, and slices.
 ** IsNil 检查值是否为 nil，正确处理各种类型。
 ** 适用于指针、通道、函数、接口、map 和切片。
 *
 * Parameters:
 *   !- x: The value to check (要检查的值)
 *
 * Returns:
 *   !- bool: true if value is nil (值为 nil 时返回 true)
 *
 * Examples:
 *
 * 	var ptr *int
 * 	IsNil(ptr)  // Returns: true
 *
 * 	num := 42
 * 	IsNil(&num)  // Returns: false
 *
 * 	var m map[string]int
 * 	IsNil(m)  // Returns: true
 *
 * 	var slice []int
 * 	IsNil(slice)  // Returns: true
 *
 * 	IsNil(42)  // Returns: false (not a nillable type)
 */
func IsNil(x any) bool {
	if x == nil {
		return true
	}
	v := reflect.ValueOf(x)
	switch v.Kind() {
	case reflect.Chan, reflect.Func, reflect.Interface, reflect.Map, reflect.Pointer, reflect.Slice:
		return v.IsNil()
	default:
		return false
	}
}

/**
 ** UuidToStrPtr converts a UUID pointer to a string pointer.
 ** Returns nil if input is nil or if the UUID string representation is empty.
 ** UuidToStrPtr 将 UUID 指针转换为字符串指针。
 ** 如果输入为 nil 或 UUID 字符串表示为空，则返回 nil。
 *
 * Parameters:
 *   !- s: UUID pointer (UUID 指针)
 *
 * Returns:
 *   !- *string: String pointer or nil (字符串指针或 nil)
 *
 * Examples:
 *
 * 	id := uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")
 * 	strPtr := UuidToStrPtr(&id)
 * 	// strPtr = &"550e8400-e29b-41d4-a716-446655440000"
 *
 * 	var nilUuid *uuid.UUID
 * 	strPtr := UuidToStrPtr(nilUuid)
 * 	// strPtr = nil
 */
func UuidToStrPtr(s *uuid.UUID) *string {
	if s == nil {
		return nil
	}
	return PtrIfNotZero(s.String())
}
