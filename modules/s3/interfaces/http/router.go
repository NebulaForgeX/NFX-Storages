package http

import (
	"github.com/gofiber/fiber/v3"
)

type Router struct {
	app      fiber.Router
	handlers *Registry
}

func NewRouter(app fiber.Router, h *Registry) *Router {
	return &Router{app: app, handlers: h}
}

func (r *Router) RegisterRoutes() {
	r.app.Get("/health", func(c fiber.Ctx) error { return c.JSON(map[string]any{"ok": true}) })
	r.app.All("/", r.handlers.S3.Handle)
	r.app.All("/*", r.handlers.S3.Handle)
}
