package http

import (
	systemapp "nfxstorages/modules/notify/application/system"
	"nfxstorages/modules/notify/interface/http/handler"
)

type Registry struct {
	App  *handler.SystemHandler
	I18n *handler.I18nHandler
}

func NewRegistry(svc *systemapp.Service, langs string) *Registry {
	return &Registry{App: handler.NewSystemHandler(svc), I18n: handler.NewI18nHandler(langs)}
}
