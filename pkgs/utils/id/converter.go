package id

import "github.com/google/uuid"

/**
 ** IDtype defines the constraint for ID types that can be converted.
 ** Supported types: string and uuid.UUID
 ** IDtype 定义了可以转换的 ID 类型约束。
 ** 支持的类型：string 和 uuid.UUID
 */
type IDtype interface {
	string | uuid.UUID
}

/**
 ** IDConverter is a generic interface for converting between ID types and strings.
 ** It provides methods to convert IDs to strings, strings to IDs, and slices of IDs to string slices.
 ** IDConverter 是用于在 ID 类型和字符串之间转换的泛型接口。
 ** 它提供了将 ID 转换为字符串、字符串转换为 ID 以及 ID 切片转换为字符串切片的方法。
 *
 * Type Parameters:
 *   !- ID: The ID type (must satisfy IDtype constraint) (ID 类型，必须满足 IDtype 约束)
 *
 * Methods:
 *   !- ToString: Convert an ID to string (将 ID 转换为字符串)
 *   !- ToID: Convert a string to ID (将字符串转换为 ID)
 *   !- ToStringSlice: Convert a slice of IDs to string slice (将 ID 切片转换为字符串切片)
 */
type IDConverter[ID IDtype] interface {
	ToString(id ID) string
	ToID(s string) ID
	ToStringSlice(ids []ID) []string
}

var _ IDConverter[string] = StringIDConverter{}
var _ IDConverter[uuid.UUID] = UUIDIDConverter{}

/**
 ** StringIDConverter implements IDConverter for string IDs.
 ** It's a no-op converter since the ID is already a string.
 ** StringIDConverter 为字符串 ID 实现 IDConverter 接口。
 ** 这是一个无操作转换器，因为 ID 本身就是字符串。
 *
 * Examples:
 *
 * 	converter := StringIDConverter{}
 *
 * 	// ToString (转换为字符串)
 * 	str := converter.ToString("user-123")  // Returns: "user-123"
 *
 * 	// ToID (转换为 ID)
 * 	id := converter.ToID("user-456")  // Returns: "user-456"
 *
 * 	// ToStringSlice (转换切片)
 * 	ids := []string{"id1", "id2", "id3"}
 * 	strs := converter.ToStringSlice(ids)  // Returns: ["id1", "id2", "id3"]
 */
type StringIDConverter struct{}

func (c StringIDConverter) ToString(id string) string {
	return string(id)
}

func (c StringIDConverter) ToID(s string) string {
	return s
}

func (c StringIDConverter) ToStringSlice(ids []string) []string {
	return ids
}

/**
 ** UUIDIDConverter implements IDConverter for UUID IDs.
 ** It converts between uuid.UUID and string representations.
 ** Invalid UUID strings are converted to uuid.Nil.
 ** UUIDIDConverter 为 UUID ID 实现 IDConverter 接口。
 ** 它在 uuid.UUID 和字符串表示之间进行转换。
 ** 无效的 UUID 字符串会被转换为 uuid.Nil。
 *
 * Examples:
 *
 * 	converter := UUIDIDConverter{}
 *
 * 	// ToString (转换为字符串)
 * 	id := uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")
 * 	str := converter.ToString(id)
 * 	// Returns: "550e8400-e29b-41d4-a716-446655440000"
 *
 * 	// ToID (转换为 ID)
 * 	id := converter.ToID("550e8400-e29b-41d4-a716-446655440000")
 * 	// Returns: uuid.UUID{...}
 *
 * 	// ToID with invalid string (无效字符串)
 * 	id := converter.ToID("invalid-uuid")
 * 	// Returns: uuid.Nil (00000000-0000-0000-0000-000000000000)
 *
 * 	// ToStringSlice (转换切片)
 * 	ids := []uuid.UUID{
 * 		uuid.MustParse("550e8400-e29b-41d4-a716-446655440000"),
 * 		uuid.MustParse("6ba7b810-9dad-11d1-80b4-00c04fd430c8"),
 * 	}
 * 	strs := converter.ToStringSlice(ids)
 * 	// Returns: ["550e8400-e29b-41d4-a716-446655440000", "6ba7b810-9dad-11d1-80b4-00c04fd430c8"]
 */
type UUIDIDConverter struct{}

func (c UUIDIDConverter) ToString(id uuid.UUID) string {
	return id.String()
}

func (c UUIDIDConverter) ToID(s string) uuid.UUID {
	if id, err := uuid.Parse(s); err == nil {
		return id
	}
	return uuid.Nil
}

func (c UUIDIDConverter) ToStringSlice(ids []uuid.UUID) []string {
	tmp := make([]string, len(ids))
	for i := range ids {
		tmp[i] = c.ToString(ids[i])
	}
	return tmp
}

/**
 ** NewIDConverter creates a new IDConverter based on the ID type parameter.
 ** Returns StringIDConverter for string IDs and UUIDIDConverter for UUID IDs.
 ** NewIDConverter 根据 ID 类型参数创建一个新的 IDConverter。
 ** 为字符串 ID 返回 StringIDConverter，为 UUID ID 返回 UUIDIDConverter。
 *
 * Type Parameters:
 *   !- ID: The ID type (must be string or uuid.UUID) (ID 类型，必须是 string 或 uuid.UUID)
 *
 * Returns:
 *   !- IDConverter[ID]: The appropriate converter for the ID type (适合 ID 类型的转换器)
 *
 * Examples:
 *
 * 	// Create converter for string IDs (创建字符串 ID 转换器)
 * 	strConverter := NewIDConverter[string]()
 * 	id := strConverter.ToID("user-123")  // Returns: "user-123"
 *
 * 	// Create converter for UUID IDs (创建 UUID ID 转换器)
 * 	uuidConverter := NewIDConverter[uuid.UUID]()
 * 	id := uuidConverter.ToID("550e8400-e29b-41d4-a716-446655440000")
 * 	// Returns: uuid.UUID{...}
 */
func NewIDConverter[ID IDtype]() IDConverter[ID] {
	var zero ID
	switch any(zero).(type) {
	case string:
		return any(StringIDConverter{}).(IDConverter[ID])
	case uuid.UUID:
		return any(UUIDIDConverter{}).(IDConverter[ID])
	default:
		return any(StringIDConverter{}).(IDConverter[ID])
	}
}
