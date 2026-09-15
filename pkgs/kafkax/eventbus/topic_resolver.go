package eventbus

import "fmt"

// TopicKey 主题键类型，用于标识主题的逻辑键。
// 例如: "access", "clients", "directory"
type TopicKey = string

// TopicResolver 主题解析器。
// 用于在主题键（TopicKey）和实际主题名称之间进行映射。
type TopicResolver struct {
	KeyToName map[TopicKey]string // 主题键到主题名称的映射
	NameToKey map[string]TopicKey // 主题名称到主题键的映射
}

// NewTopicResolver 创建新的主题解析器。
// 根据提供的键值对映射创建双向映射。
//
// 参数:
//   - keyToName: 主题键到主题名称的映射
//
// 返回:
//   - *TopicResolver: 主题解析器实例
//   - error: 如果主题名称为空或存在重复，返回错误
//
// 示例:
//
//	resolver, err := eventbus.NewTopicResolver(map[eventbus.TopicKey]string{
//	    "access":    "nfx-identity-access",
//	    "clients":   "nfx-identity-clients",
//	    "directory": "nfx-identity-directory",
//	})
func NewTopicResolver(keyToName map[TopicKey]string) (*TopicResolver, error) {
	nameToKey := make(map[string]TopicKey)
	for k, name := range keyToName {
		if name == "" {
			return nil, fmt.Errorf("topic name is empty for key %q", k)
		}
		if _, dup := nameToKey[name]; dup {
			return nil, fmt.Errorf("duplicate topic name %q", name)
		}
		nameToKey[name] = k
	}
	return &TopicResolver{
		KeyToName: keyToName,
		NameToKey: nameToKey,
	}, nil
}

// GetName 根据主题键获取主题名称。
//
// 参数:
//   - key: 主题键，例如 "access"
//
// 返回:
//   - string: 主题名称，如果找到
//   - bool: 是否找到对应的主题名称
//
// 示例:
//
//	name, ok := resolver.GetName("access")
//	if ok {
//	    fmt.Println("Topic name:", name) // 输出: "nfx-identity-access"
//	}
func (t *TopicResolver) GetName(key TopicKey) (string, bool) {
	v, ok := t.KeyToName[key]
	return v, ok
}

// GetKey 根据主题名称获取主题键。
//
// 参数:
//   - name: 主题名称，例如 "nfx-identity-access"
//
// 返回:
//   - TopicKey: 主题键，如果找到
//   - bool: 是否找到对应的主题键
//
// 示例:
//
//	key, ok := resolver.GetKey("nfx-identity-access")
//	if ok {
//	    fmt.Println("Topic key:", key) // 输出: "access"
//	}
func (t *TopicResolver) GetKey(name string) (TopicKey, bool) {
	v, ok := t.NameToKey[name]
	return v, ok
}
