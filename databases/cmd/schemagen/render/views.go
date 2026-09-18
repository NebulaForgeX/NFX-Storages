package render

import (
	"fmt"
	"strings"

	"nfxstorages/databases/cmd/schemagen/introspect"
)

// View renders one view file (port of the "ViewModel" template). View columns
// are always treated as nullable (pointer types) with a read-only ";->" tag.
func View(schema *introspect.Schema, v *introspect.View) string {
	typeName := Singular(Title(v.Name))

	var body strings.Builder
	fmt.Fprintf(&body, "type %s struct {\n", typeName)
	for _, c := range v.Columns {
		col := forceNullable(c)
		fmt.Fprintf(&body, "\t%s %s `gorm:\"column:%s;->\"`\n", FieldName(c.Name), GoType(schema, col), c.Name)
	}
	body.WriteString("}\n\n")

	fmt.Fprintf(&body, "func (%s) TableName() string { return %q }\n\n", typeName, schema.Name+"."+v.Name)
	body.WriteString(colsStruct(typeName, v.Columns))

	return assembleFile("views", body.String())
}

// forceNullable returns a copy of the column marked nullable, so view fields are
// rendered as pointers regardless of the catalog's reported nullability.
func forceNullable(c *introspect.Column) *introspect.Column {
	cp := *c
	cp.Nullable = true
	return &cp
}
