package handler

import (
	systemapp "nfxstorages/modules/s3/application/system"
	"nfxstorages/pkgs/fiberx"
	"nfxstorages/pkgs/httpx"

	"github.com/gofiber/fiber/v3"
)

type SystemHandler struct{ svc *systemapp.Service }

func NewSystemHandler(svc *systemapp.Service) *SystemHandler { return &SystemHandler{svc: svc} }

type initBody struct {
	Version string `json:"version"`
}

func (h *SystemHandler) Latest(c fiber.Ctx) error {
	row, err := h.svc.Latest(c.Context())
	if err != nil {
		return err
	}
	return fiberx.OK(c, "ok", httpx.SuccessOptions{Data: row})
}

func (h *SystemHandler) Initialize(c fiber.Ctx) error {
	var body initBody
	_ = c.Bind().Body(&body)
	row, err := h.svc.Initialize(c.Context(), body.Version)
	if err != nil {
		return err
	}
	return fiberx.Created(c, "initialized", httpx.SuccessOptions{Data: row})
}
