package slice

import "github.com/google/uuid"

/**
 ** Deduplicate removes duplicate elements from a slice while preserving the first-seen order.
 ** It uses a map to track seen elements and maintains the original order of first occurrences.
 *
 * Type Parameters:
 *   !- T: The type of elements in the slice (must be comparable)
 *
 * Parameters:
 *   !- items: The input slice that may contain duplicates
 *
 * Returns:
 *   !- []T: A new slice with duplicates removed, preserving first-seen order
 *
 * Example usage:
 *
 * 	ids := []string{"a", "b", "a", "c", "b"}
 * 	unique := Deduplicate(ids) // Returns: ["a", "b", "c"]
 *
 * 	numbers := []int{1, 2, 1, 3, 2}
 * 	unique := Deduplicate(numbers) // Returns: [1, 2, 3]
 */
func Deduplicate[T comparable](items []T) []T {
	if len(items) <= 1 {
		return items
	}

	seen := make(map[T]struct{}, len(items))
	out := make([]T, 0, len(items))

	for _, item := range items {
		if _, ok := seen[item]; ok {
			continue
		}
		seen[item] = struct{}{}
		out = append(out, item)
	}

	return out
}

/**
 ** DeduplicateBy removes duplicate elements from a slice based on a key function.
 ** It uses the key function to determine uniqueness while preserving the first-seen order.
 *
 * Type Parameters:
 *   !- T: The type of elements in the slice
 *   !- K: The type of the key used for comparison (must be comparable)
 *
 * Parameters:
 *   !- items: The input slice that may contain duplicates
 *   !- keyFn: Function to extract the key from each element
 *
 * Returns:
 *   !- []T: A new slice with duplicates removed based on key, preserving first-seen order
 *
 * Example usage:
 *
 * 	type User struct {
 * 		ID   string
 * 		Name string
 * 	}
 *
 * 	users := []User{
 * 		{ID: "1", Name: "Alice"},
 * 		{ID: "2", Name: "Bob"},
 * 		{ID: "1", Name: "Alice2"}, // Duplicate ID
 * 	}
 *
 * 	unique := DeduplicateBy(users, func(u User) string { return u.ID })
 * 	// Returns: [{ID: "1", Name: "Alice"}, {ID: "2", Name: "Bob"}]
 */
func DeduplicateBy[T any, K comparable](items []T, keyFn func(T) K) []T {
	if len(items) <= 1 {
		return items
	}

	seen := make(map[K]struct{}, len(items))
	out := make([]T, 0, len(items))

	for _, item := range items {
		key := keyFn(item)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		out = append(out, item)
	}

	return out
}

// ToStringSlice 安全从 interface{} 转为 []string
func ToStringSlice(v any) []string {
	if v == nil {
		return nil
	}
	switch vv := v.(type) {
	case []string:
		return vv
	case []any:
		out := make([]string, 0, len(vv))
		for _, x := range vv {
			if s, ok := x.(string); ok {
				out = append(out, s)
			}
		}
		return out
	default:
		return nil
	}
}

/**
 ** ToAnySlice converts a typed slice to a slice of any ([]any).
 ** Returns nil if input is nil.
 ** ToAnySlice 将类型化切片转换为 any 类型切片 ([]any)。
 ** 如果输入为 nil，则返回 nil。
 *
 * Type Parameters:
 *   !- T: The type of elements in the input slice (输入切片的元素类型)
 *
 * Parameters:
 *   !- xs: The input slice (输入切片)
 *
 * Returns:
 *   !- []any: Slice with each element as any (每个元素为 any 的切片)
 *
 * Examples:
 *
 * 	ints := []int{1, 2, 3}
 * 	anys := ToAnySlice(ints)
 * 	// Returns: []any{1, 2, 3}
 *
 * 	strs := []string{"a", "b"}
 * 	anys := ToAnySlice(strs)
 * 	// Returns: []any{"a", "b"}
 *
 * 	var nilSlice []int
 * 	result := ToAnySlice(nilSlice)
 * 	// Returns: nil
 */
func ToAnySlice[T any](xs []T) []any {
	if xs == nil {
		return nil
	}
	out := make([]any, len(xs))
	for i := range xs {
		out[i] = xs[i]
	}
	return out
}

/**
 ** ToUUIDSlice converts a slice of strings to a slice of UUIDs.
 ** Invalid UUID strings are converted to uuid.Nil without returning an error.
 ** ToUUIDSlice 将字符串切片转换为 UUID 切片。
 ** 无效的 UUID 字符串会被转换为 uuid.Nil，不会返回错误。
 *
 * Parameters:
 *   !- xs: The input string slice (输入字符串切片)
 *
 * Returns:
 *   !- []uuid.UUID: Slice of UUIDs (UUID 切片)
 *
 * Examples:
 *
 * 	strs := []string{
 * 		"550e8400-e29b-41d4-a716-446655440000",
 * 		"invalid-uuid",
 * 		"6ba7b810-9dad-11d1-80b4-00c04fd430c8",
 * 	}
 * 	uuids := ToUUIDSlice(strs)
 * 	// Returns: [uuid{...}, uuid.Nil, uuid{...}]
 *
 * 	var nilSlice []string
 * 	result := ToUUIDSlice(nilSlice)
 * 	// Returns: nil
 */
func ToUUIDSlice(xs []string) []uuid.UUID {
	if xs == nil {
		return nil
	}
	out := make([]uuid.UUID, len(xs))
	for i := range xs {
		uid, err := uuid.Parse(xs[i])
		if err != nil {
			out[i] = uuid.Nil
			continue
		}
		out[i] = uid
	}
	return out
}

/**
 ** ToUUIDSliceWithError converts a slice of strings to a slice of UUIDs with error handling.
 ** Returns an error immediately if any string in the input slice is not a valid UUID.
 ** ToUUIDSliceWithError 将字符串切片转换为 UUID 切片，带错误处理。
 ** 如果输入切片中有任何字符串不是有效的 UUID，则立即返回错误。
 *
 * Parameters:
 *   !- xs: The input string slice (输入字符串切片)
 *
 * Returns:
 *   !- []uuid.UUID: Slice of UUIDs (UUID 切片)
 *   !- error: Error if any UUID is invalid (如果有任何 UUID 无效则返回错误)
 *
 * Examples:
 *
 * 	// Valid UUIDs (有效的 UUID)
 * 	strs := []string{
 * 		"550e8400-e29b-41d4-a716-446655440000",
 * 		"6ba7b810-9dad-11d1-80b4-00c04fd430c8",
 * 	}
 * 	uuids, err := ToUUIDSliceWithError(strs)
 * 	// uuids = [uuid{...}, uuid{...}], err = nil
 *
 * 	// Invalid UUID (无效的 UUID)
 * 	strs := []string{
 * 		"550e8400-e29b-41d4-a716-446655440000",
 * 		"invalid-uuid",
 * 	}
 * 	uuids, err := ToUUIDSliceWithError(strs)
 * 	// uuids = nil, err = "invalid UUID format..."
 *
 * 	// Nil slice (nil 切片)
 * 	uuids, err := ToUUIDSliceWithError(nil)
 * 	// uuids = nil, err = nil
 */
func ToUUIDSliceWithError(xs []string) ([]uuid.UUID, error) {
	if xs == nil {
		return nil, nil
	}
	out := make([]uuid.UUID, len(xs))
	for i := range xs {
		uid, err := uuid.Parse(xs[i])
		if err != nil {
			return nil, err
		}
		out[i] = uid
	}
	return out, nil
}

/**
 ** UuidSliceToStrSlice converts a slice of UUIDs to a slice of strings.
 ** Returns nil if input is nil.
 ** UuidSliceToStrSlice 将 UUID 切片转换为字符串切片。
 ** 如果输入为 nil，则返回 nil。
 *
 * Parameters:
 *   !- xs: The input UUID slice (输入 UUID 切片)
 *
 * Returns:
 *   !- []string: Slice of UUID strings (UUID 字符串切片)
 *
 * Examples:
 *
 * 	uuids := []uuid.UUID{
 * 		uuid.MustParse("550e8400-e29b-41d4-a716-446655440000"),
 * 		uuid.MustParse("6ba7b810-9dad-11d1-80b4-00c04fd430c8"),
 * 	}
 * 	strs := UuidSliceToStrSlice(uuids)
 * 	// Returns: ["550e8400-e29b-41d4-a716-446655440000", "6ba7b810-9dad-11d1-80b4-00c04fd430c8"]
 *
 * 	var nilSlice []uuid.UUID
 * 	result := UuidSliceToStrSlice(nilSlice)
 * 	// Returns: nil
 */
func UuidSliceToStrSlice(xs []uuid.UUID) []string {
	if xs == nil {
		return nil
	}
	out := make([]string, len(xs))
	for i := range xs {
		out[i] = xs[i].String()
	}
	return out
}

/**
 ** Map transforms each element of a slice using a function.
 ** Map 使用函数转换切片的每个元素。
 *
 * Type Parameters:
 *   !- T: Input element type (输入元素类型)
 *   !- R: Output element type (输出元素类型)
 *
 * Parameters:
 *   !- xs: Input slice (输入切片)
 *   !- fn: Transformation function (转换函数)
 *
 * Returns:
 *   !- []R: Transformed slice (转换后的切片)
 *
 * Examples:
 *
 * 	nums := []int{1, 2, 3}
 * 	doubled := Map(nums, func(n int) int { return n * 2 })
 * 	// Returns: [2, 4, 6]
 *
 * 	strs := []string{"a", "b", "c"}
 * 	lengths := Map(strs, func(s string) int { return len(s) })
 * 	// Returns: [1, 1, 1]
 */
func Map[T any, R any](xs []T, fn func(T) R) []R {
	if len(xs) == 0 {
		return make([]R, 0)
	}
	out := make([]R, len(xs))
	for i := range xs {
		out[i] = fn(xs[i])
	}
	return out
}

/**
 ** MapP transforms each element of a slice using a function that takes a pointer.
 ** MapP 使用接受指针的函数转换切片的每个元素。
 *
 * Type Parameters:
 *   !- T: Input element type (输入元素类型)
 *   !- R: Output element type (输出元素类型)
 *
 * Parameters:
 *   !- xs: Input slice (输入切片)
 *   !- fn: Transformation function that takes pointer (接受指针的转换函数)
 *
 * Returns:
 *   !- []R: Transformed slice (转换后的切片)
 *
 * Examples:
 *
 * 	type User struct { Name string }
 * 	users := []User{{"Alice"}, {"Bob"}}
 * 	names := MapP(users, func(u *User) string { return u.Name })
 * 	// Returns: ["Alice", "Bob"]
 */
func MapP[T any, R any](xs []T, fn func(*T) R) []R {
	if len(xs) == 0 {
		return make([]R, 0)
	}
	out := make([]R, len(xs))
	for i := range xs {
		out[i] = fn(&xs[i])
	}
	return out
}

/**
 ** MapPP transforms each element using a function that takes and returns pointers.
 ** The returned pointer is dereferenced before storing in the result slice.
 ** MapPP 使用接受并返回指针的函数转换元素。
 ** 返回的指针在存储到结果切片前会被解引用。
 *
 * Type Parameters:
 *   !- T: Input element type (输入元素类型)
 *   !- R: Output element type (输出元素类型)
 *
 * Parameters:
 *   !- xs: Input slice (输入切片)
 *   !- fn: Transformation function (pointer in, pointer out) (转换函数，指针输入，指针输出)
 *
 * Returns:
 *   !- []R: Transformed slice (转换后的切片)
 *
 * Examples:
 *
 * 	type User struct { ID int }
 * 	type UserDTO struct { ID int }
 * 	users := []User{{1}, {2}}
 * 	dtos := MapPP(users, func(u *User) *UserDTO { return &UserDTO{ID: u.ID} })
 * 	// Returns: [{ID: 1}, {ID: 2}]
 */
func MapPP[T any, R any](xs []T, fn func(*T) *R) []R {
	if len(xs) == 0 {
		return make([]R, 0)
	}
	out := make([]R, len(xs))
	for i := range xs {
		out[i] = *fn(&xs[i])
	}
	return out
}

/**
 ** MapPtr transforms each element and returns a slice of pointers.
 ** MapPtr 转换每个元素并返回指针切片。
 *
 * Type Parameters:
 *   !- T: Input element type (输入元素类型)
 *   !- R: Output element type (输出元素类型)
 *
 * Parameters:
 *   !- xs: Input slice (输入切片)
 *   !- fn: Transformation function (转换函数)
 *
 * Returns:
 *   !- []*R: Slice of pointers to transformed values (指向转换值的指针切片)
 *
 * Examples:
 *
 * 	nums := []int{1, 2, 3}
 * 	ptrs := MapPtr(nums, func(n int) int { return n * 2 })
 * 	// Returns: [*2, *4, *6] (pointers to 2, 4, 6)
 *
 * 	strs := []string{"a", "b"}
 * 	lengths := MapPtr(strs, func(s string) int { return len(s) })
 * 	// Returns: [*1, *1] (pointers to 1, 1)
 */
func MapPtr[T any, R any](xs []T, fn func(T) R) []*R {
	if len(xs) == 0 {
		return make([]*R, 0)
	}
	out := make([]*R, len(xs))
	for i := range xs {
		result := fn(xs[i])
		out[i] = &result
	}
	return out
}

/**
 ** MapPtrP transforms elements using a pointer function and returns pointer slice.
 ** MapPtrP 使用指针函数转换元素并返回指针切片。
 *
 * Type Parameters:
 *   !- T: Input element type (输入元素类型)
 *   !- R: Output element type (输出元素类型)
 *
 * Parameters:
 *   !- xs: Input slice (输入切片)
 *   !- fn: Transformation function that takes pointer (接受指针的转换函数)
 *
 * Returns:
 *   !- []*R: Slice of pointers to transformed values (指向转换值的指针切片)
 *
 * Examples:
 *
 * 	type User struct { Name string; Age int }
 * 	users := []User{{"Alice", 30}, {"Bob", 25}}
 * 	ages := MapPtrP(users, func(u *User) int { return u.Age })
 * 	// Returns: [*30, *25] (pointers to 30, 25)
 */
func MapPtrP[T any, R any](xs []T, fn func(*T) R) []*R {
	if len(xs) == 0 {
		return make([]*R, 0)
	}
	out := make([]*R, len(xs))
	for i := range xs {
		result := fn(&xs[i])
		out[i] = &result
	}
	return out
}

/**
 ** MapPtrPP transforms using pointer in/out function and returns pointer slice.
 ** MapPtrPP 使用指针输入输出函数转换并返回指针切片。
 *
 * Type Parameters:
 *   !- T: Input element type (输入元素类型)
 *   !- R: Output element type (输出元素类型)
 *
 * Parameters:
 *   !- xs: Input slice (输入切片)
 *   !- fn: Transformation function (pointer in, pointer out) (转换函数，指针输入输出)
 *
 * Returns:
 *   !- []*R: Slice of pointers to transformed values (指向转换值的指针切片)
 *
 * Examples:
 *
 * 	type User struct { ID int }
 * 	type UserDTO struct { ID int }
 * 	users := []User{{1}, {2}}
 * 	dtos := MapPtrPP(users, func(u *User) *UserDTO { return &UserDTO{ID: u.ID} })
 * 	// Returns: [&UserDTO{ID: 1}, &UserDTO{ID: 2}]
 */
func MapPtrPP[T any, R any](xs []T, fn func(*T) *R) []*R {
	if len(xs) == 0 {
		return make([]*R, 0)
	}
	out := make([]*R, len(xs))
	for i := range xs {
		out[i] = fn(&xs[i])
	}
	return out
}
