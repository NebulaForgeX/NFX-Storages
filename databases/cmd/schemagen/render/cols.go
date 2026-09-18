package render

import (
	"fmt"
	"strings"

	"nfxstorages/databases/cmd/schemagen/introspect"
)

const colsPerLine = 7

// colsStruct renders the "var <TableName>Cols = struct{...}{...}" block shared
// by models and views (port of the "ColsStruct" template define). Field names
// in the anonymous struct type are wrapped 7 per line.
func colsStruct(typeName string, columns []*introspect.Column) string {
	fields := make([]string, len(columns))
	for i, c := range columns {
		fields[i] = FieldName(c.Name)
	}

	var lines []string
	for i := 0; i < len(fields); i += colsPerLine {
		end := i + colsPerLine
		if end > len(fields) {
			end = len(fields)
		}
		lines = append(lines, strings.Join(fields[i:end], ", "))
	}

	var b strings.Builder
	fmt.Fprintf(&b, "var %sCols = struct {\n", typeName)
	b.WriteString("\t")
	b.WriteString(strings.Join(lines, ",\n\t"))
	b.WriteString(" string\n")
	b.WriteString("}{\n")
	for _, c := range columns {
		fmt.Fprintf(&b, "\t%s: %q,\n", FieldName(c.Name), c.Name)
	}
	b.WriteString("}\n")
	return b.String()
}
