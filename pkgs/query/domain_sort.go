package query

import (
	"nfxstorages/pkgs/utils/filter"
	"nfxstorages/pkgs/utils/slice"
	"strings"
)

// DomainSortField represents a sort field within the domain
type DomainSort[T comparable] struct {
	Field T      `json:"field,omitempty"`
	Order string `json:"order,omitempty"`
}

type DomainSorts[T comparable] []DomainSort[T]

func (s *DomainSorts[T]) Normalize(allowedSorts map[T]struct{}, defaultSort *DomainSort[T]) {
	*s = slice.DeduplicateBy(*s, func(t DomainSort[T]) T { return t.Field })
	if allowedSorts != nil {
		*s = filter.FilterByAllowed(*s, allowedSorts, func(t DomainSort[T]) T { return t.Field })
	}
	if defaultSort != nil && len(*s) == 0 {
		*s = append(*s, *defaultSort)
	}
}

// ParseParams parses sort parameters from string slice
// e.g. ["created_at","-price"] → [{Field:"created_at",Order:"asc"},{Field:"price",Order:"desc"}]
func ParseSortParams[T comparable](in []string, mapper map[string]T) []DomainSort[T] {
	if len(in) == 0 {
		return nil
	}

	out := make([]DomainSort[T], 0, len(in))
	for _, raw := range in {
		raw = strings.TrimSpace(raw)
		if raw == "" {
			continue
		}

		order := "asc"
		field := raw
		if strings.HasPrefix(raw, "-") {
			order = "desc"
			field = strings.TrimPrefix(raw, "-")
		}

		// Skip if field is not found in mapper (zero value)
		if mappedField, exists := mapper[field]; exists {
			out = append(out, DomainSort[T]{Field: mappedField, Order: order})
		}
	}
	return out
}

func DomainSortToSort[T comparable](domainSorts []DomainSort[T], mapper map[T]string) []Sort {
	if len(domainSorts) == 0 {
		return nil
	}

	out := make([]Sort, 0, len(domainSorts))
	for _, sort := range domainSorts {
		out = append(out, Sort{Field: mapper[sort.Field], Order: sort.Order})
	}
	return out
}
