package validatorx

import (
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
)

func UseJSONTagAsFieldName(v *validator.Validate) {
	v.RegisterTagNameFunc(func(fld reflect.StructField) string {
		name := strings.Split(fld.Tag.Get("json"), ",")[0]
		if name == "-" {
			return ""
		}
		if name != "" {
			return name
		}
		return fld.Name
	})
}
