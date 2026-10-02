package query

import (
	"context"
	"fmt"
	"nfxstorages/pkgs/utils/filter"
	"strings"

	"golang.org/x/sync/errgroup"
	"gorm.io/gorm"
)

type QueryExecutor[T any] func(*gorm.DB, *[]T) error

// ExecutePaginatedQueryWithCustomLogic executes a paginated query with custom logic for different pagination types
// This function handles the pattern where different pagination strategies require different handling
func ExecuteQuery[T any](
	ctx context.Context,
	baseQuery *gorm.DB,
	queryParams *ListQueryParams,
	queryConfig *QueryConfig,
	executor QueryExecutor[T],
) ([]T, int64, error) {
	var (
		data  []T
		total int64
	)

	listBase := baseQuery.Session(&gorm.Session{})
	listQuery := queryParams.ApplyToQuery(listBase, queryConfig) // 应用查询参数到查询

	if queryParams.NeedOffsetPagination() {
		// For offset pagination, execute count and data queries concurrently
		// Use NewDB to avoid the issue of select conflict
		countBase := baseQuery.Session(&gorm.Session{})                     // 创建一个新的事务
		countQuery := queryParams.ApplyToCountQuery(countBase, queryConfig) // 应用查询参数到计数查询
		g, _ := errgroup.WithContext(ctx)
		g.Go(func() error { return countQuery.Count(&total).Error })
		g.Go(func() error { return executor(listQuery, &data) })
		if err := g.Wait(); err != nil {
			return nil, 0, err
		}

	} else if queryParams.All {
		// For fetching all records, only execute the data query
		if err := executor(listQuery, &data); err != nil {
			return nil, 0, err
		}
		total = int64(len(data))
	}

	return data, total, nil
}

// ApplyToQuery applies the query parameters to the GORM query
func (p *ListQueryParams) ApplyToQuery(query *gorm.DB, config *QueryConfig) *gorm.DB {
	query = p.ApplyToCountQuery(query, config)

	// === Sorting ===
	if len(p.Sorts) > 0 {
		query = p.applySorting(query)
	}

	// === Pagination ===
	// If All is set, skip pagination entirely
	if !p.All {
		if p.NeedOffsetPagination() {
			query = query.Offset(p.GetOffset()).Limit(p.GetLimit())
		} else if p.NeedCursorPagination() {
			query = p.applyCursorPagination(query, config.CursorConfig)
		} else {
			query = query.Limit(p.GetLimit())
		}
	}

	return query
}

// ApplyToCountQuery applies the query parameters to the count query (excluding pagination and sorting)
func (p *ListQueryParams) ApplyToCountQuery(query *gorm.DB, config *QueryConfig) *gorm.DB {
	if config == nil {
		config = &QueryConfig{}
	}
	// === Search ===
	if p.Search != "" {
		query = p.applySearch(query, config.SearchConfig)
	}

	// === filters ===
	if p.Filters != nil {
		query = p.applyFilters(query, config.FilterConfig)
	}

	// === Range filters ===
	if p.RangeFilters != nil {
		query = p.applyRangeFilters(query)
	}

	return query
}

func (p *ListQueryParams) applySearch(query *gorm.DB, config *SearchConfig) *gorm.DB {
	if p.Search == "" || len(config.Fields) == 0 {
		return query
	}

	searchPattern := "%" + p.Search + "%"
	var conditions []string
	var args []any

	for _, field := range config.Fields {
		conditions = append(conditions, fmt.Sprintf("%s %s ?", field, config.Operator))
		args = append(args, searchPattern)
	}

	whereClause := strings.Join(conditions, fmt.Sprintf(" %s ", config.Logic))
	return query.Where(whereClause, args...)
}

func (p *ListQueryParams) applyFilters(query *gorm.DB, config *FilterConfig) *gorm.DB {
	if len(p.Filters) == 0 {
		return query
	}
	for field, rawValues := range p.Filters {
		if len(rawValues) == 0 {
			continue
		}
		// Filter out nil values
		vals := filter.NormalizeValues(rawValues)
		if len(vals) == 0 {
			continue
		}

		// Apply custom filter
		if config != nil {
			if customFilter, exists := config.CustomFilters[field]; exists {
				query = customFilter(query, field, rawValues)
				continue
			}
		}
		if len(vals) == 1 {
			query = query.Where(fmt.Sprintf("%s = ?", field), vals[0])
		} else if len(vals) > 1 {
			query = query.Where(fmt.Sprintf("%s IN ?", field), vals)
		}
	}
	return query
}

func (p *ListQueryParams) applyRangeFilters(query *gorm.DB) *gorm.DB {
	if len(p.RangeFilters) == 0 {
		return query
	}
	for field, rangeValue := range p.RangeFilters {
		if v, ok := filter.NormalizeValue(rangeValue.Min); ok {
			query = query.Where(fmt.Sprintf("%s >= ?", field), v)
		}
		if v, ok := filter.NormalizeValue(rangeValue.Max); ok {
			query = query.Where(fmt.Sprintf("%s <= ?", field), v)
		}
	}
	return query
}

func (p *ListQueryParams) applySorting(query *gorm.DB) *gorm.DB {
	var orders []string
	// Sorting uses field mappings if provided via config in cursor pagination handler.
	for _, sortField := range p.Sorts {
		dbField := sortField.Field
		order := strings.ToUpper(sortField.Order)
		if order != "ASC" && order != "DESC" {
			order = "ASC" // default to ascending order
		}
		orders = append(orders, fmt.Sprintf("%s %s", dbField, order))
	}
	return query.Order(strings.Join(orders, ", "))
}

// Field selection and preloads were removed from ListQueryParams.

func (p *ListQueryParams) applyCursorPagination(query *gorm.DB, config *CursorConfig) *gorm.DB {
	if config == nil {
		config = &CursorConfig{
			Field: "id",
			Order: "ASC",
		}
	}

	cursorField := config.Field
	cursorOrder := config.Order

	if p.AfterCursor != "" {
		query = query.Where(fmt.Sprintf("%s > ?", cursorField), p.AfterCursor)
	}
	if p.BeforeCursor != "" {
		query = query.Where(fmt.Sprintf("%s < ?", cursorField), p.BeforeCursor)
	}

	// Apply cursor field sorting if no explicit sort is set
	if len(p.Sorts) == 0 {
		query = query.Order(fmt.Sprintf("%s %s", cursorField, cursorOrder))
	}

	return query.Limit(p.GetLimit())
}
