package fiberx

import (
	"nfxstorages/pkgs/errx"
	"nfxstorages/pkgs/httpx"

	"github.com/gofiber/fiber/v3"
	fiberutils "github.com/gofiber/utils/v2"
)

func Success(c fiber.Ctx, httpStatus int, message string, opts ...httpx.SuccessOptions) error {
	resp := httpx.BuildSuccessResp(httpStatus, message, opts...)
	if resp.Message == "" {
		resp.Message = fiberutils.StatusMessage(httpStatus)
	}
	return c.Status(httpStatus).JSON(resp)
}

func OK(c fiber.Ctx, message string, opts ...httpx.SuccessOptions) error {
	return Success(c, fiber.StatusOK, message, opts...)
}

func Created(c fiber.Ctx, message string, opts ...httpx.SuccessOptions) error {
	return Success(c, fiber.StatusCreated, message, opts...)
}

func Accepted(c fiber.Ctx, message string, opts ...httpx.SuccessOptions) error {
	return Success(c, fiber.StatusAccepted, message, opts...)
}

func NoContent(c fiber.Ctx) error {
	return c.SendStatus(fiber.StatusNoContent)
}

func Error(c fiber.Ctx, httpStatus int, code string, message string, opts ...httpx.ErrorOptions) error {
	traceID := TraceIDFromContext(c.Context())
	resp := httpx.BuildErrorResp(httpStatus, code, message, traceID, opts...)
	if resp.Message == "" {
		resp.Message = fiberutils.StatusMessage(httpStatus)
	}
	return c.Status(httpStatus).JSON(resp)
}

func ErrorFromErrx(c fiber.Ctx, e *errx.Error, opts ...httpx.ErrorOptions) error {
	var opt httpx.ErrorOptions
	if len(opts) > 0 {
		opt = opts[0]
	}
	if opt.Details == nil && e.Details != nil {
		opt.Details = e.Details
	}
	return Error(c, e.HttpStatus(), e.Code, e.Message, opt)
}
