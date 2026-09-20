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
	g := r.app.Group("/admin/v3")
	r.handlers.Admin.Register(g)
}
