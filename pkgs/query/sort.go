package query

import (
	"strings"
)

// SortField represents a single sorting field and direction in the database
type Sort struct {
	Field string // field name, e.g. "created_at"
	Order string // "asc" or "desc"
}

// ToSQLOrder converts SortField to SQL ORDER BY clause
func (s Sort) ToSQLOrder() string {
	order := strings.ToUpper(s.Order)
	if order != "ASC" && order != "DESC" {
		order = "ASC" // default to ASC if invalid
	}
	return s.Field + " " + order
}

// IsDesc returns true if the sort order is descending
func (s Sort) IsDesc() bool {
	return strings.ToLower(s.Order) == "desc"
}

// ToDescBool converts Order string to boolean for backward compatibility
func (s Sort) ToDescBool() bool {
	return s.IsDesc()
}

// MakeRangeSet creates a set of integers from 1 to max (exclusive).
// Used for validating sort fields that are defined as iota constants.
func MakeRangeSet[T ~int](max T) map[T]struct{} {
	set := make(map[T]struct{}, int(max))
	for i := T(1); i < max; i++ {
		set[i] = struct{}{}
	}
	return set
}
