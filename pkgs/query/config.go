package query

import "gorm.io/gorm"

type QueryConfig struct {
	SearchConfig *SearchConfig
	FilterConfig *FilterConfig
	CursorConfig *CursorConfig
}

type SearchConfig struct {
	Fields   []string // fields to search in (default: ["name", "description"])
	Operator string   // search operator: "ILIKE", "LIKE", "=", etc. (default: "ILIKE")
	Logic    string   // "AND" or "OR" for multiple fields (default: "OR")
}

type FilterConfig struct {
	CustomFilters map[string]FilterFunc
}

type CursorConfig struct {
	Field string // field to use for cursor (default: "id")
	Order string // "ASC" or "DESC" (default: "ASC")
}

type FilterFunc func(query *gorm.DB, field string, values []any) *gorm.DB

func (c *QueryConfig) WithSearchFields(fields ...string) *QueryConfig {
	c.SearchConfig.Fields = fields
	return c
}

func (c *QueryConfig) WithSearchOperator(operator string) *QueryConfig {
	c.SearchConfig.Operator = operator
	return c
}

func (c *QueryConfig) WithSearchLogic(logic string) *QueryConfig {
	c.SearchConfig.Logic = logic
	return c
}

func (c *QueryConfig) WithCursorField(field string) *QueryConfig {
	c.CursorConfig.Field = field
	return c
}

func (c *QueryConfig) WithCursorOrder(order string) *QueryConfig {
	c.CursorConfig.Order = order
	return c
}
