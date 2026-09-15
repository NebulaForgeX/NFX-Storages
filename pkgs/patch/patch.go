package patch

import (
	"reflect"
	"sync"
)

type hasIsUnset interface{ IsUnset() bool }

var patchFieldsCache sync.Map // map[reflect.Type][]int

// IsPatchEmpty 判断 *struct 或 struct 的所有字段是否都 IsUnset()。
func IsPatchEmpty(p any) bool {
	if p == nil {
		return true
	}
	v := reflect.ValueOf(p)
	// 解引用到 struct
	for v.Kind() == reflect.Ptr {
		if v.IsNil() {
			return true // nil 指针视为“空”
		}
		v = v.Elem()
	}
	if v.Kind() != reflect.Struct {
		return true
	}

	t := v.Type()

	// 缓存：只遍历一次字段，后续复用索引
	var idxs []int
	if cached, ok := patchFieldsCache.Load(t); ok {
		idxs = cached.([]int)
	} else {
		idxs = make([]int, 0, t.NumField())
		for i := 0; i < v.NumField(); i++ {
			fv := v.Field(i)
			// 只要能拿到接口，就试图断言 hasIsUnset
			if fv.CanInterface() {
				if _, ok := fv.Interface().(hasIsUnset); ok {
					idxs = append(idxs, i)
				}
			}
		}
		patchFieldsCache.Store(t, idxs)
	}

	for _, i := range idxs {
		fv := v.Field(i)
		// 再取一次接口以适配当前实例
		if u, ok := fv.Interface().(hasIsUnset); ok {
			if !u.IsUnset() {
				return false
			}
		}
	}
	return true
}
