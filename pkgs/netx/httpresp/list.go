package httpresp

type List[T any] struct {
	Items []T `json:"items"`
	Total int `json:"total"`
}

func ToList[D any](items []D, total int) List[D] {
	return List[D]{
		Items: items,
		Total: total,
	}
}
