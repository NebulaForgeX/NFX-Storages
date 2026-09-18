package http

import (
	"nfxstorages/modules/s3/interface/http/handler"
	systemapp "nfxstorages/modules/s3/application/system"
)

type Registry struct {
	App *handler.SystemHandler
	S3  *handler.S3Handler
	I18n *handler.I18nHandler
}

func NewRegistry(sys *systemapp.Service, s3 *handler.S3Handler, langs string) *Registry {
	return &Registry{App: handler.NewSystemHandler(sys), S3: s3, I18n: handler.NewI18nHandler(langs)}
}
