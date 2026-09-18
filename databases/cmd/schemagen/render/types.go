package render

import (
	"strings"

	"nfxstorages/databases/cmd/schemagen/introspect"
)

// pgToGo maps a Postgres base type name (pg_type.typname) to a Go type,
// mirroring the PG2GO table in databases/templates/_helpers.tmpl.
var pgToGo = map[string]string{
	"int2": "int16", "int4": "int", "int8": "int64",
	"numeric": "float64", "float4": "float32", "float8": "float64", "money": "float64",
	"bool":   "bool",
	"bpchar": "string", "char": "string", "varchar": "string", "text": "string", "citext": "string",
	"uuid":  "uuid.UUID",
	"bytea": "[]byte",
	"json":  "datatypes.JSON", "jsonb": "datatypes.JSON",
	"timestamp": "time.Time", "timestamptz": "time.Time", "date": "time.Time",
	"time": "time.Time", "timetz": "time.Time",
	"inet": "string", "cidr": "string", "macaddr": "string",
	"geometry": "string", "geography": "string",
}

// pgCanonical maps a Postgres base type name to the canonical SQL spelling used
// by Atlas in gorm "type:" tags (int8 -> bigint, timestamptz stays timestamptz, ...).
var pgCanonical = map[string]string{
	"int2": "smallint", "int4": "integer", "int8": "bigint",
	"numeric": "numeric", "float4": "real", "float8": "double precision", "money": "money",
	"bool":   "boolean",
	"bpchar": "character", "varchar": "varchar", "text": "text", "citext": "citext",
	"uuid":  "uuid",
	"bytea": "bytea",
	"json":  "json", "jsonb": "jsonb",
	"timestamp": "timestamp", "timestamptz": "timestamptz", "date": "date",
	"time": "time", "timetz": "timetz",
	"inet": "inet", "cidr": "cidr", "macaddr": "macaddr",
}

// GoType resolves the Go type for a column within the given schema.
//
// Enums are resolved ONLY against the container schema (mirroring the per-schema
// $ENUMS dict in ResolveType); a cross-schema enum falls through to the base
// type mapping (i.e. "string"), exactly as the Atlas template did.
func GoType(schema *introspect.Schema, c *introspect.Column) string {
	if c.IsEnum {
		if _, ok := schema.EnumByName(c.BaseType); ok {
			elem := "enums." + EnumGoType(schema.Name, c.BaseType)
			if c.IsArray {
				// Postgres enum arrays map to enumx.Array[T], which implements
				// sql.Scanner/driver.Valuer for the "{a,b,c}" literal. A nil
				// slice already represents SQL NULL/absent, so it is never
				// pointerized (even for nullable / view columns).
				return "enumx.Array[" + elem + "]"
			}
			if c.Nullable {
				return "*" + elem
			}
			return elem
		}
		// Cross-schema enum: not in this schema's dict -> base mapping below.
	}

	base, ok := pgToGo[c.BaseType]
	if !ok {
		base = "string"
	}
	if !c.Nullable {
		return base
	}
	// Pointer-nulls strategy (USE_POINTER_NULLS = true).
	switch {
	case base == "[]byte":
		return "[]byte"
	case strings.HasPrefix(base, "*"):
		return base
	default:
		return "*" + base
	}
}

// TypeTag returns the value of the gorm "type:" tag for a model column.
func TypeTag(schema *introspect.Schema, c *introspect.Column) string {
	if c.IsEnum {
		// Prefer schema-qualified enum arrays (matches DDL: "social".direct_message_policy[]).
		tag := c.BaseType
		if c.BaseSchema != "" && (c.IsArray || c.BaseSchema != schema.Name) {
			tag = c.BaseSchema + "." + c.BaseType
		}
		if c.IsArray {
			tag += "[]"
		}
		return tag
	}

	canonical, ok := pgCanonical[c.BaseType]
	if !ok {
		canonical = c.BaseType
	}
	// PostGIS (and other non-catalog) types are schema-qualified, e.g.
	// "public.geometry", "public.geography".
	if c.BaseType == "geometry" || c.BaseType == "geography" {
		canonical = c.BaseSchema + "." + c.BaseType
	}

	tag := canonical + typmodSuffix(c.FormatType)
	if c.IsArray {
		tag += "[]"
	}
	return tag
}

// typmodSuffix extracts the "(...)" modifier from a format_type string, e.g.
// "character varying(40)" -> "(40)", "geography(Point,4326)" -> "(Point,4326)",
// "timestamp with time zone" -> "".
func typmodSuffix(formatType string) string {
	open := strings.IndexByte(formatType, '(')
	if open < 0 {
		return ""
	}
	close := strings.LastIndexByte(formatType, ')')
	if close < open {
		return ""
	}
	return formatType[open : close+1]
}
