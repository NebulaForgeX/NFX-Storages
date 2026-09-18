package http

import (
	adminhandler "nfxstorages/modules/admin/interfaces/http/handler"
	systemapp "nfxstorages/modules/admin/application/system"
	"nfxstorages/modules/admin/interfaces/http/handler"
)

type Registry struct {
	App   *handler.SystemHandler
	Admin *adminhandler.AdminHandler
	I18n  *handler.I18nHandler
}

func NewRegistry(sys *systemapp.Service, admin *adminhandler.AdminHandler, langs string) *Registry {
	return &Registry{App: handler.NewSystemHandler(sys), Admin: admin, I18n: handler.NewI18nHandler(langs)}
}
