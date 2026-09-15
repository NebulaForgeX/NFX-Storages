package query

type DomainPagination struct {
	Offset int  `json:"offset,omitempty"`
	Limit  int  `json:"limit,omitempty"`
	All    bool `json:"all,omitempty"`
}

func (q *DomainPagination) Normalize(maxLimit int, defaultLimit int) {
	if q.Offset < 0 {
		q.Offset = 0
	}
	if q.Limit <= 0 || q.Limit > maxLimit {
		q.Limit = defaultLimit
	}
}
