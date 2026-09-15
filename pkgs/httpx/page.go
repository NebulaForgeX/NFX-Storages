package httpx

type Page[T any] struct {
	Items []T `json:"items"`
	Total int `json:"total"`
}

func NewPage[T any](items []T, total int) Page[T] {
	return Page[T]{Items: items, Total: total}
}
