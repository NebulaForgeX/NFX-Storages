package http

import "github.com/gofiber/fiber/v3"

type Router struct {
	app      fiber.Router
	handlers *Registry
}

func NewRouter(app fiber.Router, h *Registry) *Router {
	return &Router{app: app, handlers: h}
}

func (r *Router) RegisterRoutes() {
	r.RegisterAdminGroup()
}

func (r *Router) RegisterAdminGroup() {
	g := r.app.Group("/admin/v3")
	r.handlers.Admin.Register(g)
	g.Get("/locales/:lang", r.handlers.I18n.GetErrorTranslations)
	g.Get("/messages/:lang", r.handlers.I18n.GetMessageTranslations)
}
