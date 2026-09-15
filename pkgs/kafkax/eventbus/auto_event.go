package eventbus

import (
	"reflect"
	"strings"
	"sync"
	"unicode"
)

// eventTypeCache 缓存类型名到 EventType 的映射
// key: 类型完整名称 (包含包路径)
// value: 生成的 EventType
var eventTypeCache sync.Map

// AutoEventType 从类型名自动生成 EventType
// 使用反射获取类型名，然后转换为 EventType 格式
// 结果会被缓存，避免重复计算
// EventType 只包含事件类型本身，不包含 topicKey（路由通过 TopicKey() 方法处理）
// 例如: "GrantsInvalidateCacheEvent" -> "grants_invalidate_cache"
//
// 命名规则:
//  1. 移除 "Event" 后缀
//  2. 将驼峰命名转换为小写下划线格式
//
// 示例:
//   - GrantsInvalidateCacheEvent -> "grants_invalidate_cache"
//   - UserCreatedEvent -> "user_created"
func AutoEventType[T TypedEvent]() EventType {
	var zero T
	t := reflect.TypeOf(zero)
	if t == nil {
		return ""
	}

	// 构建缓存键: 类型完整名称
	cacheKey := t.String()

	// 先检查缓存
	if cached, ok := eventTypeCache.Load(cacheKey); ok {
		return cached.(EventType)
	}

	// 获取类型名（去掉包路径）
	typeName := t.Name()
	if typeName == "" {
		// 如果 Name() 为空，尝试从 String() 中提取
		fullName := t.String()
		parts := strings.Split(fullName, ".")
		if len(parts) > 0 {
			typeName = parts[len(parts)-1]
		}
	}

	// 移除 "Event" 后缀
	typeName = strings.TrimSuffix(typeName, "Event")

	// 将驼峰命名转换为小写下划线格式
	// "GrantsInvalidateCache" -> "grants_invalidate_cache"
	var result strings.Builder
	for i, r := range typeName {
		if i > 0 && unicode.IsUpper(r) {
			result.WriteByte('_')
		}
		result.WriteRune(unicode.ToLower(r))
	}

	eventTypeValue := EventType(result.String())

	// 存入缓存
	eventTypeCache.Store(cacheKey, eventTypeValue)

	return eventTypeValue
}

// AutoEvent 自动生成 EventType 的基础事件结构体。
// 嵌入此结构体后，EventType() 返回空字符串，EventTypeOf 会自动使用 AutoEventType 生成。
// 如果用户自己实现了 EventType() 方法，会优先使用用户定义的（覆盖嵌入的方法）。
//
// 使用方式:
//
//	type GrantsInvalidateCacheEvent struct {
//	    eventbus.AutoEvent
//	    ID string `json:"id"`
//	}
//
//	func (GrantsInvalidateCacheEvent) TopicKey() events.TopicKey {
//	    return events.TKAccess
//	}
//
//	// EventType() 返回空字符串，EventTypeOf 会自动使用 AutoEventType 生成
//	// 如果需要自定义，可以自己实现 EventType() 方法覆盖默认行为
type AutoEvent struct {
	topicKey TopicKey
}

// EventType 返回空字符串，表示使用自动生成。
// EventTypeOf 函数会检测到空字符串，然后使用 AutoEventType 自动生成。
func (e AutoEvent) EventType() EventType {
	return "" // 返回空字符串，触发 EventTypeOf 使用 AutoEventType
}

// TopicKey 返回主题键。
func (e AutoEvent) TopicKey() TopicKey {
	return e.topicKey
}

// NewAutoEvent 创建自动生成 EventType 的基础事件。
func NewAutoEvent(topicKey TopicKey) AutoEvent {
	return AutoEvent{
		topicKey: topicKey,
	}
}
