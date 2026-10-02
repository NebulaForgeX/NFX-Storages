package errx

import (
	"errors"

	"github.com/go-playground/validator/v10"
)

type FieldError struct {
	Field  string         `json:"field"`
	Code   string         `json:"code"`
	Params map[string]any `json:"params,omitempty"`
}

type ValidationError struct {
	Errors []FieldError `json:"errors"`
}

func (v *ValidationError) Error() string {
	return "validation failed"
}

func AsValidationError(err error) *ValidationError {
	var v *ValidationError
	if errors.As(err, &v) {
		return v
	}
	return nil
}

func NewValidationError(errs validator.ValidationErrors) *ValidationError {
	if len(errs) == 0 {
		return &ValidationError{Errors: nil}
	}

	fieldErrors := make([]FieldError, 0, len(errs))
	for _, fe := range errs {
		field := fe.Field()
		if field == "" {
			field = fe.StructField()
		}
		fieldErrors = append(fieldErrors, FieldError{
			Field:  field,
			Code:   fieldErrorCode(fe),
			Params: fieldErrorParams(fe),
		})
	}

	return &ValidationError{Errors: fieldErrors}
}

func (v *ValidationError) ToErrx() *Error {
	if v == nil {
		return nil
	}
	return InvalidArg("VALIDATION_FAILED", "request validation failed").WithDetail("errors", v.Errors)
}

func FromValidatorErrors(errs validator.ValidationErrors) *Error {
	if len(errs) == 0 {
		return InvalidArg("VALIDATION_FAILED", "request validation failed")
	}
	return NewValidationError(errs).ToErrx()
}

func fieldErrorCode(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "REQUIRED"
	case "min", "max", "gte", "lte":
		return "INVALID_RANGE"
	case "len":
		return "INVALID_LENGTH"
	case "oneof":
		return "INVALID_ONEOF"
	case "email", "url", "uuid", "uuid4", "phone_format", "email_format":
		return "INVALID_FORMAT"
	case "password_policy":
		return "WEAK_PASSWORD"
	case "unsupported_method":
		return "UNSUPPORTED_VALUE"
	default:
		return "INVALID_VALUE"
	}
}

func fieldErrorParams(fe validator.FieldError) map[string]any {
	switch fe.Tag() {
	case "min":
		return map[string]any{"min": fe.Param()}
	case "max":
		return map[string]any{"max": fe.Param()}
	case "gte":
		return map[string]any{"min": fe.Param()}
	case "lte":
		return map[string]any{"max": fe.Param()}
	case "len":
		return map[string]any{"len": fe.Param()}
	case "oneof":
		return map[string]any{"options": fe.Param()}
	default:
		return nil
	}
}
