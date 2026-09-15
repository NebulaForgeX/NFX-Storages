package errx

import (
	"errors"
	"fmt"

	"google.golang.org/grpc/codes"
)

type Error struct {
	Kind    Kind           `json:"kind"`
	Code    string         `json:"code"`
	Message string         `json:"message"`
	Details map[string]any `json:"details,omitempty"` // External details for client
	Cause   error          `json:"-"`                 // Internal details for debugging
}

func New(kind Kind, code string, message string) *Error {
	return &Error{Kind: kind, Code: code, Message: message}
}

func (e *Error) WithMsg(message string) *Error {
	if e == nil {
		return nil
	}
	ne := e.clone()
	ne.Message = message
	return ne
}

func (e *Error) WithDetail(k string, v any) *Error {
	if e == nil {
		return nil
	}
	ne := e.clone()
	if ne.Details == nil {
		ne.Details = make(map[string]any)
	}
	ne.Details[k] = v
	return ne
}

func (e *Error) WithDetails(details map[string]any) *Error {
	if e == nil {
		return nil
	}
	ne := e.clone()
	ne.Details = details
	return ne
}

func (e *Error) WithCause(err error) *Error {
	if err == nil {
		return e
	}
	var inner *Error
	if errors.As(err, &inner) {
		return inner
	}
	return &Error{Code: e.Code, Message: e.Message, Cause: err}
}

func (e *Error) Error() string {
	if e == nil {
		return ""
	}

	switch {
	case e.Message != "" && e.Cause != nil:
		return fmt.Sprintf("%s: %v", e.Message, e.Cause)
	case e.Message != "":
		return e.Message
	case e.Code != "" && e.Cause != nil:
		return fmt.Sprintf("%s: %v", e.Code, e.Cause)
	case e.Code != "":
		return e.Code
	case e.Cause != nil:
		return e.Cause.Error()
	default:
		return "error"
	}
}

func (e *Error) Unwrap() error {
	if e == nil {
		return nil
	}
	return e.Cause
}

// HttpStatus returns the HTTP status code for the error.
func (e *Error) HttpStatus() int {
	return HTTPStatusFromKind(e.Kind)
}

func (e *Error) GrpcCode() codes.Code {
	return GRPCCodeFromKind(e.Kind)
}

func (e *Error) clone() *Error {
	if e == nil {
		return nil
	}

	var details map[string]any
	if e.Details != nil {
		details = make(map[string]any, len(e.Details))
		for k, v := range e.Details {
			details[k] = v
		}
	}

	return &Error{
		Kind:    e.Kind,
		Code:    e.Code,
		Message: e.Message,
		Details: details,
		Cause:   e.Cause,
	}
}

func AsError(err error) *Error {
	var e *Error
	if errors.As(err, &e) {
		return e
	}
	return nil
}
