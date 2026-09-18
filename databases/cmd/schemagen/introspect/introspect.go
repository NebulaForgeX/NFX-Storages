// Package introspect reads the live PostgreSQL catalog (after the bundled
// schema has been loaded into a shadow database) and returns a structured
// description of schemas, enums, tables and views. It is the non-Atlas
// replacement for "atlas schema inspect".
package introspect

import (
	"context"
	"database/sql"
	"fmt"
	"sort"

	_ "github.com/jackc/pgx/v5/stdlib"
)

// Realm is the whole introspected database, limited to the requested schemas.
type Realm struct {
	Schemas []*Schema
}

// Schema groups the enums, tables and views of a single Postgres schema.
type Schema struct {
	Name   string
	Enums  []*Enum
	Tables []*Table
	Views  []*View
	// enumByName indexes enums of THIS schema by lowercase type name, mirroring
	// the per-schema ENUMS dict used by the original Atlas templates.
	enumByName map[string]*Enum
}

// Enum is a Postgres enum type with its labels in sort order.
type Enum struct {
	Name   string // lowercase type name, e.g. "friend_request_policy"
	Values []string
}

// Table is a base table with its columns and constraints/indexes.
type Table struct {
	Name    string
	Columns []*Column
	PKName  string   // primary key constraint name ("" if none)
	PKCols  []string // primary key column names
	Indexes []*Index // non-primary indexes (unique + regular), ordered by name
	FKs     []*ForeignKey
}

// View is a (non-materialized) view with its result columns.
type View struct {
	Name    string
	Columns []*Column
}

// Column is a single table/view column resolved against pg_catalog.
type Column struct {
	Name       string
	Nullable   bool
	FormatType string // pg_catalog.format_type output, e.g. "character varying(40)"
	BaseType   string // element pg typname (array element if IsArray), e.g. "int8", "timestamptz", "geography", enum name
	BaseSchema string // schema of the base type
	IsEnum     bool
	IsArray    bool
}

// Index is a non-primary index.
type Index struct {
	Name   string
	Unique bool
	Natts  int        // total index parts (columns + expressions), for composite check
	Cols   []IndexCol // simple (non-expression) member columns
}

// IndexCol is a simple column member of an index with its 1-based position
// within the full index key (expression slots are counted too).
type IndexCol struct {
	Name string
	Pos  int
}

// ForeignKey is a foreign-key constraint.
type ForeignKey struct {
	Name string
}

// Introspect connects to dsn and reads the given schemas.
func Introspect(ctx context.Context, dsn string, schemaNames []string) (*Realm, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, fmt.Errorf("introspect: open: %w", err)
	}
	defer db.Close()
	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("introspect: ping: %w", err)
	}

	realm := &Realm{}
	for _, name := range schemaNames {
		s := &Schema{Name: name, enumByName: map[string]*Enum{}}
		if err := loadEnums(ctx, db, s); err != nil {
			return nil, err
		}
		if err := loadTables(ctx, db, s); err != nil {
			return nil, err
		}
		if err := loadViews(ctx, db, s); err != nil {
			return nil, err
		}
		realm.Schemas = append(realm.Schemas, s)
	}
	return realm, nil
}

// ListSchemas returns the non-system, non-public schema names present in the
// database (auth, asset, content, social, communication, ...), sorted.
func ListSchemas(ctx context.Context, dsn string) ([]string, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, fmt.Errorf("introspect: open: %w", err)
	}
	defer db.Close()

	const q = `
SELECT nspname FROM pg_namespace
WHERE nspname NOT IN ('pg_catalog', 'information_schema', 'public')
  AND nspname NOT LIKE 'pg_%'
ORDER BY nspname;`
	rows, err := db.QueryContext(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("introspect: list schemas: %w", err)
	}
	defer rows.Close()
	var out []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		out = append(out, name)
	}
	return out, rows.Err()
}

// EnumByName returns the enum of this schema with the given lowercase name.
func (s *Schema) EnumByName(name string) (*Enum, bool) {
	e, ok := s.enumByName[name]
	return e, ok
}

// SchemaForTest builds a Schema with enumByName indexed (for unit tests).
func SchemaForTest(name string, enums ...*Enum) *Schema {
	s := &Schema{Name: name, Enums: enums, enumByName: map[string]*Enum{}}
	for _, e := range enums {
		s.enumByName[e.Name] = e
	}
	return s
}

func loadEnums(ctx context.Context, db *sql.DB, s *Schema) error {
	// Order enums by type OID (creation / definition order), matching the order
	// in which Atlas iterated $schema.Objects, not alphabetically.
	const q = `
SELECT t.typname, e.enumlabel
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
JOIN pg_enum e ON e.enumtypid = t.oid
WHERE n.nspname = $1
ORDER BY t.oid, e.enumsortorder;`
	rows, err := db.QueryContext(ctx, q, s.Name)
	if err != nil {
		return fmt.Errorf("introspect enums %s: %w", s.Name, err)
	}
	defer rows.Close()

	byName := map[string]*Enum{}
	var order []string
	for rows.Next() {
		var typ, label string
		if err := rows.Scan(&typ, &label); err != nil {
			return err
		}
		e, ok := byName[typ]
		if !ok {
			e = &Enum{Name: typ}
			byName[typ] = e
			order = append(order, typ)
		}
		e.Values = append(e.Values, label)
	}
	if err := rows.Err(); err != nil {
		return err
	}
	for _, name := range order {
		s.Enums = append(s.Enums, byName[name])
		s.enumByName[name] = byName[name]
	}
	return nil
}

// columnQuery loads columns for relations of the given relkind ('r' table, 'v' view).
const columnQuery = `
SELECT c.relname, a.attname, a.attnum, a.attnotnull,
       format_type(a.atttypid, a.atttypmod) AS ftype,
       bt.typname AS base_typname,
       bn.nspname AS base_typschema,
       (bt.typtype = 'e') AS is_enum,
       (t.typcategory = 'A') AS is_array
FROM pg_attribute a
JOIN pg_class c ON c.oid = a.attrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_type t ON t.oid = a.atttypid
JOIN pg_type bt ON bt.oid = CASE WHEN t.typcategory = 'A' THEN t.typelem ELSE t.oid END
JOIN pg_namespace bn ON bn.oid = bt.typnamespace
WHERE n.nspname = $1 AND c.relkind = $2 AND a.attnum > 0 AND NOT a.attisdropped
ORDER BY c.relname, a.attnum;`

func loadColumns(ctx context.Context, db *sql.DB, schema, relkind string) (map[string][]*Column, []string, error) {
	rows, err := db.QueryContext(ctx, columnQuery, schema, relkind)
	if err != nil {
		return nil, nil, fmt.Errorf("introspect columns %s/%s: %w", schema, relkind, err)
	}
	defer rows.Close()

	cols := map[string][]*Column{}
	var order []string
	for rows.Next() {
		var (
			rel, name, ftype, baseType, baseSchema string
			attnum                                 int
			notnull, isEnum, isArray               bool
		)
		if err := rows.Scan(&rel, &name, &attnum, &notnull, &ftype, &baseType, &baseSchema, &isEnum, &isArray); err != nil {
			return nil, nil, err
		}
		if _, ok := cols[rel]; !ok {
			order = append(order, rel)
		}
		cols[rel] = append(cols[rel], &Column{
			Name:       name,
			Nullable:   !notnull,
			FormatType: ftype,
			BaseType:   baseType,
			BaseSchema: baseSchema,
			IsEnum:     isEnum,
			IsArray:    isArray,
		})
	}
	if err := rows.Err(); err != nil {
		return nil, nil, err
	}
	return cols, order, nil
}

func loadTables(ctx context.Context, db *sql.DB, s *Schema) error {
	cols, order, err := loadColumns(ctx, db, s.Name, "r")
	if err != nil {
		return err
	}
	pkNames, pkCols, err := loadPrimaryKeys(ctx, db, s.Name)
	if err != nil {
		return err
	}
	indexes, err := loadIndexes(ctx, db, s.Name)
	if err != nil {
		return err
	}
	fks, err := loadForeignKeys(ctx, db, s.Name)
	if err != nil {
		return err
	}
	for _, name := range order {
		t := &Table{
			Name:    name,
			Columns: cols[name],
			PKName:  pkNames[name],
			PKCols:  pkCols[name],
			Indexes: indexes[name],
			FKs:     fks[name],
		}
		s.Tables = append(s.Tables, t)
	}
	return nil
}

func loadViews(ctx context.Context, db *sql.DB, s *Schema) error {
	cols, order, err := loadColumns(ctx, db, s.Name, "v")
	if err != nil {
		return err
	}
	for _, name := range order {
		s.Views = append(s.Views, &View{Name: name, Columns: cols[name]})
	}
	return nil
}

func loadPrimaryKeys(ctx context.Context, db *sql.DB, schema string) (map[string]string, map[string][]string, error) {
	const q = `
SELECT c.relname, con.conname,
       a.attname,
       array_position(con.conkey, a.attnum) AS ord
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(con.conkey)
WHERE n.nspname = $1 AND con.contype = 'p'
ORDER BY c.relname, ord;`
	rows, err := db.QueryContext(ctx, q, schema)
	if err != nil {
		return nil, nil, fmt.Errorf("introspect pk %s: %w", schema, err)
	}
	defer rows.Close()
	names := map[string]string{}
	colsByTable := map[string][]string{}
	for rows.Next() {
		var rel, conname, attname string
		var ord int
		if err := rows.Scan(&rel, &conname, &attname, &ord); err != nil {
			return nil, nil, err
		}
		names[rel] = conname
		colsByTable[rel] = append(colsByTable[rel], attname)
	}
	return names, colsByTable, rows.Err()
}

func loadIndexes(ctx context.Context, db *sql.DB, schema string) (map[string][]*Index, error) {
	// Step 1: index metadata (independent of columns) so that expression-only
	// indexes (e.g. UNIQUE ON (lower(email))) are still captured for the Uk const.
	const qMeta = `
SELECT c.relname AS table, ic.relname AS index, ix.indisunique, ix.indnatts
FROM pg_index ix
JOIN pg_class c ON c.oid = ix.indrelid
JOIN pg_class ic ON ic.oid = ix.indexrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = $1 AND c.relkind = 'r' AND NOT ix.indisprimary
ORDER BY c.relname, ic.relname;`
	rows, err := db.QueryContext(ctx, qMeta, schema)
	if err != nil {
		return nil, fmt.Errorf("introspect indexes %s: %w", schema, err)
	}
	type key struct{ table, index string }
	byKey := map[key]*Index{}
	tableIdx := map[string][]*Index{}
	for rows.Next() {
		var table, index string
		var unique bool
		var natts int
		if err := rows.Scan(&table, &index, &unique, &natts); err != nil {
			rows.Close()
			return nil, err
		}
		idx := &Index{Name: index, Unique: unique, Natts: natts}
		byKey[key{table, index}] = idx
		tableIdx[table] = append(tableIdx[table], idx)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// Step 2: simple (non-expression) member columns with their 1-based key
	// position. unnest ... WITH ORDINALITY handles int2vector correctly (it is
	// 0-based, so array_position would be off by one) and skips expression
	// slots (attnum = 0).
	const qCols = `
SELECT c.relname AS table, ic.relname AS index, a.attname, k.ord
FROM pg_index ix
JOIN pg_class c ON c.oid = ix.indrelid
JOIN pg_class ic ON ic.oid = ix.indexrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
CROSS JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ord)
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = k.attnum
WHERE n.nspname = $1 AND c.relkind = 'r' AND NOT ix.indisprimary AND k.attnum <> 0
ORDER BY c.relname, ic.relname, k.ord;`
	crows, err := db.QueryContext(ctx, qCols, schema)
	if err != nil {
		return nil, fmt.Errorf("introspect index columns %s: %w", schema, err)
	}
	defer crows.Close()
	for crows.Next() {
		var table, index, attname string
		var ord sql.NullInt64
		if err := crows.Scan(&table, &index, &attname, &ord); err != nil {
			return nil, err
		}
		if idx, ok := byKey[key{table, index}]; ok {
			pos := 0
			if ord.Valid {
				pos = int(ord.Int64)
			}
			idx.Cols = append(idx.Cols, IndexCol{Name: attname, Pos: pos})
		}
	}
	if err := crows.Err(); err != nil {
		return nil, err
	}

	for _, idxs := range tableIdx {
		sort.Slice(idxs, func(i, j int) bool { return idxs[i].Name < idxs[j].Name })
	}
	return tableIdx, nil
}

func loadForeignKeys(ctx context.Context, db *sql.DB, schema string) (map[string][]*ForeignKey, error) {
	const q = `
SELECT c.relname, con.conname
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = $1 AND con.contype = 'f'
ORDER BY c.relname, con.conname;`
	rows, err := db.QueryContext(ctx, q, schema)
	if err != nil {
		return nil, fmt.Errorf("introspect fk %s: %w", schema, err)
	}
	defer rows.Close()
	byTable := map[string][]*ForeignKey{}
	for rows.Next() {
		var rel, conname string
		if err := rows.Scan(&rel, &conname); err != nil {
			return nil, err
		}
		byTable[rel] = append(byTable[rel], &ForeignKey{Name: conname})
	}
	return byTable, rows.Err()
}
