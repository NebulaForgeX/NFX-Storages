package query

type ListQueryParams struct {
	// --- Offset pagination ---
	Offset int

	// --- Cursor pagination ---
	AfterCursor  string // cursor: get next page
	BeforeCursor string // cursor: get previous page

	Limit int // page size

	// --- Sorting ---
	Sorts []Sort // support multiple fields sorting

	// --- Fuzzy / Full-text search ---
	Search string // general full-text / name / description

	// --- Exact & multi-value filters ---
	Filters map[string][]any
	/* e.g. {
		"status":      {"ACTIVE"},
		"category_id": {"uuid1","uuid2"},
		"type":        {"A","B","C"},
	} */

	// --- Range filters ---
	RangeFilters map[string]RangeValue
	/* e.g. {
		"price":     {Min:10, Max:100},
		"created_at":{From:"2025-01-01T00:00:00Z", To:"2025-07-01T23:59:59Z"},
	} */

	// --- Fetch all ---
	All bool // if true, ignore pagination and return all records
}

// RangeValue represents the upper and lower bounds of a range filter
type RangeValue struct {
	Min any // minimum value (inclusive)
	Max any // maximum value (inclusive)
}

func (p *ListQueryParams) GetOffset() int {
	if p.Offset < 0 {
		p.Offset = 0
	}
	return p.Offset
}

func (p *ListQueryParams) GetLimit() int {
	if p.Limit > 0 {
		return p.Limit
	}
	return 20 // default limit
}

func (p *ListQueryParams) GetFilterValue(key string) []any {
	if p.Filters == nil {
		return nil
	}
	return p.Filters[key]
}

func (p *ListQueryParams) GetRangeFilter(key string) *RangeValue {
	if p.RangeFilters == nil {
		return nil
	}
	if value, exists := p.RangeFilters[key]; exists {
		return &value
	}
	return nil
}

func (p *ListQueryParams) NeedCursorPagination() bool {
	if p.All {
		return false
	}
	return p.AfterCursor != "" || p.BeforeCursor != ""
}

func (p *ListQueryParams) NeedOffsetPagination() bool {
	if p.All {
		return false
	}
	return p.AfterCursor == "" && p.BeforeCursor == ""
}
