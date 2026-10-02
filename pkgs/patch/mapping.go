package patch

import (
	"reflect"

	"github.com/ettle/strcase"
	"gorm.io/gorm"
)

type patchFieldMarker interface{ isPatchField() }

var markerType = reflect.TypeOf((*patchFieldMarker)(nil)).Elem()

func isPatchFieldType(t reflect.Type) bool {
	return t.Implements(markerType)
}

type Options struct {
	// 字段名->列名映射（优先使用）。例如 {"Phone":"phone_number", "PostalCode":"postal_code"}
	FieldToColumn map[string]string
	// 若映射表中找不到，则是否回退为 snake_case
	FallbackSnakeCase bool
	// 当 Optional 为 Null 状态时，返回用于 Updates 的“置空值”
	// 例如：在 GORM 中可返回 gorm.Expr("NULL")；或返回 nil + 特殊路径处理
	NullValue func() any
}

var DefaultGormOptions = Options{
	FieldToColumn:     map[string]string{},
	FallbackSnakeCase: true,
	NullValue:         func() any { return gorm.Expr("NULL") },
}

// PatchToColumns: 将任意包含 patch.PatchField[T] 字段的 Patch 转为 map[column]any
func PatchToColumns(patch any, opts Options) map[string]any {
	v := reflect.ValueOf(patch)
	if v.Kind() == reflect.Pointer {
		if v.IsNil() {
			return nil
		}
		v = v.Elem()
	}
	if v.Kind() != reflect.Struct {
		panic("PatchToColumns expects struct or *struct")
	}
	t := v.Type()

	out := make(map[string]any, t.NumField())

	for i := 0; i < t.NumField(); i++ {
		sf := t.Field(i)
		if sf.PkgPath != "" {
			continue
		}
		if !isPatchFieldType(sf.Type) {
			continue
		}
		fv := v.Field(i)

		col := columnName(sf.Name, opts)
		if col == "" {
			continue
		}

		// —— 不再读私有字段；改为调公开方法 —— //

		// 1) IsSet()
		mIsSet := fv.MethodByName("IsSet")
		if !mIsSet.IsValid() {
			continue // 异常：不是 PatchField？
		}
		if !mIsSet.Call(nil)[0].Bool() {
			continue // 未设置 → 不更新
		}

		// 2) IsNull()
		mIsNull := fv.MethodByName("IsNull")
		if mIsNull.IsValid() && mIsNull.Call(nil)[0].Bool() {
			if opts.NullValue != nil {
				out[col] = opts.NullValue() // 显式置空
			} else {
				out[col] = nil
			}
			continue
		}

		// 3) Value() (T, bool) —— 只在 set && !null 时才会 ok=true
		mValue := fv.MethodByName("Value")
		if !mValue.IsValid() {
			continue
		}
		res := mValue.Call(nil)
		// 期望两个返回值：(val, ok)
		if len(res) != 2 || !res[1].Bool() {
			continue
		}
		out[col] = res[0].Interface()
	}

	return out
}

func columnName(field string, opts Options) string {
	if col, ok := opts.FieldToColumn[field]; ok {
		return col
	}
	if opts.FallbackSnakeCase {
		return strcase.ToSnake(field)
	}
	return field
}
