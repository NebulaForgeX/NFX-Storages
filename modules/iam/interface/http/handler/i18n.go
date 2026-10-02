package handler

import (
	"os"
	"path/filepath"
	"strings"

	"nfxstorages/pkgs/errx"

	"github.com/gofiber/fiber/v3"
)

var supportedLangs = map[string]bool{"en": true, "zh": true, "fr": true}

type I18nHandler struct {
	errorsLangsPath   string
	messagesLangsPath string
}

func NewI18nHandler(errorsLangsPath string) *I18nHandler {
	messagesLangsPath := strings.Replace(errorsLangsPath, "errors/langs", "messages/langs", 1)
	if messagesLangsPath == errorsLangsPath {
		messagesLangsPath = "./messages/langs"
	}
	return &I18nHandler{errorsLangsPath: errorsLangsPath, messagesLangsPath: messagesLangsPath}
}

func (h *I18nHandler) GetErrorTranslations(c fiber.Ctx) error {
	return h.sendLangJSON(c, h.errorsLangsPath)
}

func (h *I18nHandler) GetMessageTranslations(c fiber.Ctx) error {
	return h.sendLangJSON(c, h.messagesLangsPath)
}

func (h *I18nHandler) sendLangJSON(c fiber.Ctx, dir string) error {
	lang := c.Params("lang")
	if lang == "" || !supportedLangs[lang] {
		return errx.ErrInvalidParams.WithMsg("lang must be one of: en, zh, fr")
	}
	name := lang + ".json"
	fpath := filepath.Join(dir, name)
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
