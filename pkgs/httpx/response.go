package httpx

// HTTPResp 为统一响应体。错误响应经 fiberx.Error/ErrorFromErrx 使用 BuildErrorResp，字段：status, err_code, message, details?, trace_id?
type HTTPResp struct {
	Status  int            `json:"status"`
	ErrCode string         `json:"err_code,omitempty"`
	Message string         `json:"message"`
	Details any            `json:"details,omitempty"`
	Data    any            `json:"data"`
	Meta    map[string]any `json:"meta,omitempty"`
	TraceID string         `json:"trace_id,omitempty"`
}

type SuccessOptions struct {
	Data any
	Meta map[string]any
}

type ErrorOptions struct {
	Meta    map[string]any
	Details any
}

func BuildSuccessResp(httpStatus int, message string, opts ...SuccessOptions) HTTPResp {
	var opt SuccessOptions
	if len(opts) > 0 {
		opt = opts[0]
	}
	return HTTPResp{
		Status:  httpStatus,
		Message: message,
		Data:    opt.Data,
		Meta:    opt.Meta,
	}
}

func BuildErrorResp(httpStatus int, errCode string, message string, traceID string, opts ...ErrorOptions) HTTPResp {
	var opt ErrorOptions
	if len(opts) > 0 {
		opt = opts[0]
	}
	return HTTPResp{
		Status:  httpStatus,
		ErrCode: errCode,
		Message: message,
		Details: opt.Details,
		Data:    nil,
		Meta:    opt.Meta,
		TraceID: traceID,
	}
}
