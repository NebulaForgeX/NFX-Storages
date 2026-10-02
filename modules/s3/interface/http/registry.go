package http

import (
	"nfxstorages/modules/s3/interface/http/handler"
)

type Registry struct {
	S3 *handler.S3Handler
}

func NewRegistry(s3 *handler.S3Handler) *Registry {
	return &Registry{S3: s3}
}
