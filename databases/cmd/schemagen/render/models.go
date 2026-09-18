package render

import (
	"fmt"
	"strings"

	"nfxstorages/databases/cmd/schemagen/introspect"
)

// Model renders one model file for a table (port of the "Model" template).
func Model(schema *introspect.Schema, t *introspect.Table) string {
	typeName := Singular(Title(t.Name))
	pkSet := map[string]bool{}
	for _, c := range t.PKCols {
		pkSet[c] = true
	}

	var body strings.Builder
	fmt.Fprintf(&body, "type %s struct {\n", typeName)

	hasUUIDPK := false
	for _, c := range t.Columns {
		field := FieldName(c.Name)
		goType := GoType(schema, c)

		if c.Name == "id" && goType == "uuid.UUID" && pkSet["id"] {
			hasUUIDPK = true
		}

		switch c.Name {
		case "deleted_at":
			body.WriteString("\tDeletedAt gorm.DeletedAt `gorm:\"index\"`\n")
			continue
		case "created_at":
			fmt.Fprintf(&body, "\t%s time.Time `gorm:\"autoCreateTime\"`\n", field)
			continue
		case "updated_at":
			fmt.Fprintf(&body, "\t%s time.Time `gorm:\"autoUpdateTime\"`\n", field)
			continue
		}

		var tags []string
		if tag := TypeTag(schema, c); tag != "" {
			tags = append(tags, "type:"+tag)
		}
		if pkSet[c.Name] {
			tags = append(tags, "primaryKey")
		}
		tags = append(tags, indexTags(t, c.Name)...)

		if len(tags) > 0 {
			fmt.Fprintf(&body, "\t%s %s `gorm:%q`\n", field, goType, strings.Join(tags, ";"))
		} else {
			fmt.Fprintf(&body, "\t%s %s\n", field, goType)
		}
	}
	body.WriteString("}\n\n")

	fmt.Fprintf(&body, "func (%s) TableName() string { return %q }\n\n", typeName, schema.Name+"."+t.Name)

	if hasUUIDPK {
		fmt.Fprintf(&body, "func (m *%s) BeforeCreate(tx *gorm.DB) (err error) {\n", typeName)
		body.WriteString("\tif m.ID == uuid.Nil {\n")
		body.WriteString("\t\tm.ID, err = uuid.NewV7()\n")
		body.WriteString("\t}\n")
		body.WriteString("\treturn\n")
		body.WriteString("}\n\n")
	}

	body.WriteString(colsStruct(typeName, t.Columns))

	if constBlock := modelConsts(typeName, t); constBlock != "" {
		body.WriteString("\n")
		body.WriteString(constBlock)
	}

	return assembleFile("models", body.String())
}

// indexTags returns the gorm index/uniqueIndex tags for a column across all of
// the table's non-primary indexes (ordered by index name).
func indexTags(t *introspect.Table, col string) []string {
	var out []string
	for _, idx := range t.Indexes {
		prio := 0
		belongs := false
		for _, ic := range idx.Cols {
			if ic.Name == col {
				belongs = true
				prio = ic.Pos
			}
		}
		if !belongs {
			continue
		}
		composite := idx.Natts > 1
		kind := "index"
		if idx.Unique {
			kind = "uniqueIndex"
		}
		switch {
		case idx.Name != "" && composite:
			out = append(out, fmt.Sprintf("%s:%s,priority:%d", kind, idx.Name, prio))
		case idx.Name != "":
			out = append(out, fmt.Sprintf("%s:%s", kind, idx.Name))
		case composite:
			out = append(out, fmt.Sprintf("%s,priority:%d", kind, prio))
		default:
			out = append(out, kind)
		}
	}
	return out
}

// modelConsts renders the "const (...)" block with Pk / Uk / Fk names, or "".
func modelConsts(typeName string, t *introspect.Table) string {
	hasPk := t.PKName != ""
	var uk []*introspect.Index
	for _, idx := range t.Indexes {
		if idx.Unique && idx.Name != "" {
			uk = append(uk, idx)
		}
	}
	if !hasPk && len(uk) == 0 && len(t.FKs) == 0 {
		return ""
	}

	var b strings.Builder
	b.WriteString("const (\n")
	if hasPk {
		fmt.Fprintf(&b, "\t%sPk = %q\n", typeName, t.PKName)
	}
	for _, idx := range uk {
		fmt.Fprintf(&b, "\t%sUk%s = %q\n", typeName, IndexSuffix(idx.Name, t.Name), idx.Name)
	}
	for _, fk := range t.FKs {
		if fk.Name == "" {
			continue
		}
		fmt.Fprintf(&b, "\t%sFk%s = %q\n", typeName, IndexSuffix(fk.Name, t.Name), fk.Name)
	}
	b.WriteString(")\n")
	return b.String()
}
