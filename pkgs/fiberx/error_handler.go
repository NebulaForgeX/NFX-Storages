package fiberx

import (
	"errors"
	"nfxstorages/pkgs/errx"
	"nfxstorages/pkgs/logx"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v3"
	"go.uber.org/zap"
)

func ErrorHandler(c fiber.Ctx, err error) error {
	var fe *fiber.Error
	if errors.As(err, &fe) {
		httpStatus := fe.Code
		code := "HTTP_ERROR"
		switch httpStatus {
		case fiber.StatusMethodNotAllowed:
			code = "METHOD_NOT_ALLOWED"
		case fiber.StatusNotFound:
			code = "NOT_FOUND"
		case fiber.StatusBadRequest:
			code = "BAD_REQUEST"
		}
		return Error(c, httpStatus, code, fe.Message)
	}

	e := normalizeErr(err)
	logError(c, e)
	return ErrorFromErrx(c, e)
}

func normalizeErr(err error) *errx.Error {
	if err == nil {
		return nil
	}
	var fe *fiber.Error
	if errors.As(err, &fe) {
		switch fe.Code {
		case fiber.StatusNotFound:
			return errx.NotFound("NOT_FOUND", fe.Message).WithCause(err)
		case fiber.StatusMethodNotAllowed:
			return errx.InvalidArg("METHOD_NOT_ALLOWED", fe.Message).WithCause(err)
		default:
			if fe.Code >= 500 {
				return errx.Internal("INTERNAL", fe.Message).WithCause(err)
			}
			return errx.InvalidArg("BAD_REQUEST", fe.Message).WithCause(err)
		}
	}
	var verrs validator.ValidationErrors
	if errors.As(err, &verrs) {
		return errx.FromValidatorErrors(verrs)
	}
	if ve := errx.AsValidationError(err); ve != nil {
		return ve.ToErrx()
	}
	if e := errx.AsError(err); e != nil {
		return e
	}
	return errx.ErrInternal.WithCause(err)
}

func logError(c fiber.Ctx, e *errx.Error) {
	if e == nil {
		return
	}
	l := logx.From(c.Context())
	switch {
	case e.Kind == errx.KindInternal:
		l.Error("http request failed",
			zap.String("error_code", e.Code),
			zap.Any("details", e.Details),
			zap.Error(e.Cause),
		)
	case e.Kind == errx.KindFailedPrecondition || e.Kind == errx.KindConflict:
		l.Warn("http request rejected", zap.String("error_code", e.Code))
	default:
		l.Debug("http request rejected", zap.String("error_code", e.Code))
	}
}
