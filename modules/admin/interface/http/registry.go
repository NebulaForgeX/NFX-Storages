package http

import (
	"nfxstorages/modules/admin/interface/http/handler"
)

type Registry struct {
	Admin *handler.AdminHandler
	I18n  *handler.I18nHandler
}

func NewRegistry(admin *handler.AdminHandler, langs string) *Registry {
	return &Registry{Admin: admin, I18n: handler.NewI18nHandler(langs)}
}
