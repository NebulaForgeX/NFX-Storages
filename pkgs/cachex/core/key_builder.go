package core

import (
	"crypto/sha1"
	"encoding/hex"
	"sort"
	"strconv"
	"strings"
)

type KeyType string

const (
	KeyTypeEntity  KeyType = "entity"
	KeyTypeIndex   KeyType = "index"
	KeyTypeList    KeyType = "list"
	KeyTypeCounter KeyType = "counter"
)

// keyBuilder helps unify key naming & soft invalidation (versioning)
type keyBuilder struct {
	Prefix    string        // e.g. "category"
	Namespace string        // optional, e.g. "prod" / "stg" / tenantId
	Version   func() string // optional, e.g. returns "42"
}

// NewKeyBuilder creates a builder with optional version and namespace
func NewKeyBuilder(prefix string, namespace string, version func() string) KeyBuilder {
	return &keyBuilder{Prefix: prefix, Version: version, Namespace: namespace}
}

func (k keyBuilder) realPrefix(keyType KeyType) string {
	p := k.Prefix

	if k.Namespace != "" {
		p = p + ":" + k.Namespace
	}

	if k.Version != nil {
		if v := k.Version(); v != "" {
			p = p + ":v" + v
		}
	}

	switch keyType {
	case KeyTypeEntity:
		p = p + ":entity"
	case KeyTypeList:
		p = p + ":list"
	case KeyTypeIndex:
		p = p + ":index"
	case KeyTypeCounter:
		p = p + ":counter"
	}
	return p
}

// Entity: {prefix[:ns][:vN]}:entity:{id}
// Use hash tag，ensure the same slot for the same ID related keys (entity/negative cache)
func (k keyBuilder) Entity(id string) string {
	return k.realPrefix(KeyTypeEntity) + ":{" + id + "}"
}

// EntityNil: negative cache key for entity
// Share the same hash tag with entity key (the id is still in the curly braces)
func (k keyBuilder) EntityNil(id string) string {
	return k.Entity(id) + ":nil"
}

// Index: {prefix[:ns][:vN]}:index:{type}:{value}
func (k keyBuilder) Index(indexType, value string) string {
	return k.realPrefix(KeyTypeIndex) + ":" + indexType + ":" + value
}

// List: {prefix[:ns][:vN]}:list:{name}
func (k keyBuilder) List(name string) string {
	return k.realPrefix(KeyTypeList) + ":" + name
}

// PageIDs: {prefix[:ns][:vN]}:page:{page}:{size}
func (k keyBuilder) PageIDs(page, size int) string {
	return k.realPrefix(KeyTypeList) + ":page:" + strconv.Itoa(page) + ":" + strconv.Itoa(size)
}

// ListWithFilter: 把复杂过滤参数做成稳定哈希，避免超长 key
// 例如传入 ["gender=f","brand=nike","price=0-100"]（需上层先规范化顺序/格式）
func (k keyBuilder) ListWithFilter(name string, normalizedParts []string) string {
	h := sha1.New()
	sort.Strings(normalizedParts) // 稳定化
	for _, p := range normalizedParts {
		h.Write([]byte(p))
		h.Write([]byte{0})
	}
	return k.realPrefix(KeyTypeList) + ":" + name + ":h:" + hex.EncodeToString(h.Sum(nil))[:16]
}

// Counter: {prefix[:ns]}:counter:{name}:{id}
func (k keyBuilder) Counter(name, id string) string {
	return k.realPrefix(KeyTypeCounter) + ":" + name + ":{" + id + "}"
}

// CounterPattern: {prefix[:ns]}:counter:{name}:*
func (k keyBuilder) CounterPattern(name string) string {
	return k.realPrefix(KeyTypeCounter) + ":" + name + ":*"
}

func (k keyBuilder) GetIDFromCounterKey(key string, name string) (string, bool) {
	head := k.realPrefix(KeyTypeCounter) + ":" + name + ":{"
	if strings.HasPrefix(key, head) && strings.HasSuffix(key, "}") {
		return key[len(head) : len(key)-1], true
	}
	return "", false
}
