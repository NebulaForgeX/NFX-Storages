package handler

import (
	"os"
	"path/filepath"

	"nfxstorages/pkgs/errx"

	"github.com/gofiber/fiber/v3"
)

var supportedLangs = map[string]bool{"en": true, "zh": true, "fr": true}

type I18nHandler struct {
	errorsLangsPath string
}

func NewI18nHandler(errorsLangsPath string) *I18nHandler {
	return &I18nHandler{errorsLangsPath: errorsLangsPath}
}

func (h *I18nHandler) GetErrorTranslations(c fiber.Ctx) error {
	lang := c.Params("lang")
	if lang == "" || !supportedLangs[lang] {
		return errx.ErrInvalidParams.WithMsg("lang must be one of: en, zh, fr")
	}
	name := lang + ".json"
	fpath := filepath.Join(h.errorsLangsPath, name)
	data, err := os.ReadFile(fpath)
	if err != nil {
		if os.IsNotExist(err) {
			return c.Status(200).JSON(map[string]any{})
		}
		return errx.ErrInternal.WithCause(err)
	}
	c.Set("Content-Type", "application/json; charset=utf-8")
	return c.Send(data)
}
