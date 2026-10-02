package httpresp

// SuccessOptions defines the options for a successful response
type SuccessOptions struct {
	Data any            `json:"data"`
	Meta map[string]any `json:"meta"`
}

// ErrorResponseOptions defines the options for an error response
type ErrorOptions struct {
	Meta map[string]any `json:"meta"`
}
