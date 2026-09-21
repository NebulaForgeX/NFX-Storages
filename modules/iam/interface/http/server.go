package http

import (
	"encoding/json"
	"time"

	"nfxstorages/pkgs/fiberx"
	"nfxstorages/pkgs/fiberx/middleware"
	"nfxstorages/pkgs/httpx"
	"nfxstorages/pkgs/security/token"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
)

type httpDeps interface {
	UserTokenVerifier() token.Verifier
}

func NewHTTPServer(d httpDeps, accessLog httpx.AccessLogConfig) *fiber.App {
	app := fiber.New(fiber.Config{
		JSONEncoder: json.Marshal, JSONDecoder: json.Unmarshal, ErrorHandler: fiberx.ErrorHandler,
		ReadTimeout: 30 * time.Second, WriteTimeout: 30 * time.Second, IdleTimeout: 120 * time.Second,
	})
	app.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With", "X-Api-Key", "X-Request-ID"},
		AllowCredentials: false, ExposeHeaders: []string{"Content-Length", "Content-Type"}, MaxAge: 3600,
	}))
	app.Use(middleware.Logger(), middleware.AccessLog(accessLog), middleware.Recover())
	NewRouter(app, d.UserTokenVerifier(), NewRegistry()).RegisterRoutes()
	return app
}
