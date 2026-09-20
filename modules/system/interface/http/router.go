package http

import (
	"nfxstorages/pkgs/security/token"

	"github.com/gofiber/fiber/v3"
)

type Router struct {
	app           fiber.Router
	tokenVerifier token.Verifier
	handlers      *Registry
}

func NewRouter(app fiber.Router, v token.Verifier, h *Registry) *Router {
	return &Router{app: app, tokenVerifier: v, handlers: h}
}

func (r *Router) RegisterRoutes() {
	system := r.app.Group("/system")
	r.RegisterLocalesGroup(system)
	r.RegisterSystemStateGroup(system)
}

func (r *Router) RegisterLocalesGroup(system fiber.Router) {
	locales := system.Group("/locales")
	locales.Get("/:lang", r.handlers.I18n.GetErrorTranslations)
	messages := system.Group("/messages")
	messages.Get("/:lang", r.handlers.I18n.GetMessageTranslations)
}

func (r *Router) RegisterSystemStateGroup(system fiber.Router) {
	system.Get("/system-state/latest", r.handlers.App.Latest)
	system.Post("/system-state/initialize", r.handlers.App.Initialize)
}
