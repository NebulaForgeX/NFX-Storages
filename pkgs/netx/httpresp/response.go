// Package httpresp 已弃用：请使用 pkgs/httpx + pkgs/fiberx（与 Rex-Backend 一致）。
// 错误响应应使用 fiberx.Error / ErrorFromErrx，返回格式为 status(int), err_code, message, details, trace_id。
package httpresp

import (
	"github.com/gofiber/fiber/v3"
	fiberutils "github.com/gofiber/utils/v2"
	"github.com/google/uuid"
)

// httpresp represents a legacy HTTP response structure (Status string "success"/"error", Code uint16).
// Deprecated: use httpx.HTTPResp + fiberx.Error/BuildErrorResp for Rex-aligned error returns.
type HTTPResp struct {
	Status  string         `json:"status"`
	Code    uint16         `json:"code"`
	Message string         `json:"message"`
	Data    any            `json:"data"`
	Meta    map[string]any `json:"meta,omitempty"`
	TraceID string         `json:"trace_id,omitempty"`
}

// Success creates a successful response
func Success(c fiber.Ctx, httpStatus int, message string, opts ...SuccessOptions) error {
	var opt SuccessOptions
	if len(opts) > 0 {
		opt = opts[0]
	}

	return jsonResponse(c, httpStatus, "success", message, opt.Data, opt.Meta, false)
}

// Error creates an error response
func Error(c fiber.Ctx, httpStatus int, message string, opts ...ErrorOptions) error {
	var opt ErrorOptions
	if len(opts) > 0 {
		opt = opts[0]
	}

	return jsonResponse(c, httpStatus, "error", message, nil, opt.Meta, true)
}

// CustomStatus creates a response with custom status string
func CustomStatus(c fiber.Ctx, httpStatus int, status string, message string, opts ...SuccessOptions) error {
	var opt SuccessOptions
	if len(opts) > 0 {
		opt = opts[0]
	}

	return jsonResponse(c, httpStatus, status, message, opt.Data, opt.Meta, false)
}

// jsonResponse creates a standardized JSON response
func jsonResponse(c fiber.Ctx, httpStatus int, statusStr string, message string, data any, meta map[string]any, addTraceID bool) error {
	if message == "" {
		message = fiberutils.StatusMessage(httpStatus)
	}

	traceID := ""
	if addTraceID {
		traceID = genTraceID()
	}

	return c.Status(httpStatus).JSON(HTTPResp{
		Status:  statusStr,
		Code:    uint16(httpStatus),
		Message: message,
		Data:    data,
		Meta:    meta,
		TraceID: traceID,
	})
}

// generateTraceID generates a unique trace ID for error tracking
func genTraceID() string {
	return uuid.NewString()
}
