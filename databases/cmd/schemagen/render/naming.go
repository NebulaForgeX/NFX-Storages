package render

import "strings"

// acronyms are column-name segments kept fully uppercase in Go field names,
// mirroring the FieldName helper in databases/templates/_helpers.tmpl.
var acronyms = map[string]bool{
	"ID": true, "URL": true, "UID": true, "API": true, "UUID": true, "IP": true,
}

// Title converts snake_case to PascalCase, preserving inner casing for names
// that are not snake_case (e.g. "ActivityEvents" stays "ActivityEvents").
// Port of the "Title" template define.
func Title(s string) string {
	parts := strings.Split(s, "_")
	if len(parts) <= 1 {
		if len(s) <= 1 {
			return strings.ToUpper(s)
		}
		return strings.ToUpper(s[:1]) + s[1:]
	}
	var b strings.Builder
	for _, w := range parts {
		if len(w) <= 1 {
			b.WriteString(strings.ToUpper(w))
			continue
		}
		b.WriteString(strings.ToUpper(w[:1]))
		b.WriteString(strings.ToLower(w[1:]))
	}
	return b.String()
}

// Singular converts a plural identifier to singular. Port of "Singular".
func Singular(s string) string {
	switch {
	case strings.HasSuffix(s, "ies") && len(s) > 3:
		return s[:len(s)-3] + "y"
	case strings.HasSuffix(s, "ses"):
		return strings.TrimSuffix(s, "es")
	case strings.HasSuffix(s, "xes"):
		return strings.TrimSuffix(s, "es")
	case strings.HasSuffix(s, "s") && len(s) > 1:
		return strings.TrimSuffix(s, "s")
	default:
		return s
	}
}

// FieldName converts a column name to a Go field name, keeping known acronyms
// (ID, URL, UUID, ...) uppercase. Port of "FieldName".
func FieldName(col string) string {
	parts := strings.Split(col, "_")
	var b strings.Builder
	for _, p := range parts {
		u := strings.ToUpper(p)
		if acronyms[u] {
			b.WriteString(u)
			continue
		}
		if len(p) == 0 {
			continue
		}
		b.WriteString(strings.ToUpper(p[:1]))
		if len(p) > 1 {
			b.WriteString(strings.ToLower(p[1:]))
		}
	}
	return b.String()
}

// indexPrefixes are the leading tokens stripped by IndexSuffix.
var indexPrefixes = map[string]bool{
	"fk": true, "uk": true, "uq": true, "idx": true, "pk": true, "fkey": true,
}

// IndexSuffix derives a Go-friendly suffix from an index/constraint name,
// stripping a leading fk/uk/idx/... token and the table-name prefix. Port of
// the "IndexSuffix" template define (note: uses Title, so "id" -> "Id").
func IndexSuffix(name, table string) string {
	parts := strings.Split(name, "_")
	tableParts := strings.Split(strings.ToLower(table), "_")

	start := 0
	if len(parts) > 0 && indexPrefixes[strings.ToLower(parts[0])] {
		start = 1
	}
	parts2 := parts[start:]

	parts3 := parts2
	if len(tableParts) > 0 && len(parts2) >= len(tableParts) {
		match := true
		for j, tp := range tableParts {
			if strings.ToLower(parts2[j]) != tp {
				match = false
				break
			}
		}
		if match {
			parts3 = parts2[len(tableParts):]
		}
	}

	if len(parts3) == 0 {
		return Title(name)
	}
	var b strings.Builder
	for _, p := range parts3 {
		b.WriteString(Title(p))
	}
	return b.String()
}

// SchemaPrefix is the Go type prefix derived from a schema name (Title).
func SchemaPrefix(schema string) string { return Title(schema) }

// EnumGoType returns the exported Go enum type name, e.g.
// schema "social" + name "friend_request_policy" -> "SocialFriendRequestPolicy".
func EnumGoType(schema, enumName string) string {
	return SchemaPrefix(schema) + Title(enumName)
}
