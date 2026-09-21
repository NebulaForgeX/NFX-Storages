package http

import (
	"encoding/json"
	"time"

	s3app "nfxstorages/modules/s3/application/s3"
	"nfxstorages/modules/s3/interface/http/handler"
	"nfxstorages/pkgs/fiberx"
	"nfxstorages/pkgs/fiberx/middleware"
	"nfxstorages/pkgs/httpx"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
)

type httpDeps interface {
	S3Svc() *s3app.Service
}

func NewHTTPServer(d httpDeps, accessLog httpx.AccessLogConfig) *fiber.App {
	app := fiber.New(fiber.Config{
		JSONEncoder: json.Marshal, JSONDecoder: json.Unmarshal, ErrorHandler: fiberx.ErrorHandler,
		ReadTimeout: 60 * time.Second, WriteTimeout: 120 * time.Second, IdleTimeout: 120 * time.Second,
		BodyLimit: 512 * 1024 * 1024,
	})
	app.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Amz-Date", "X-Amz-Content-Sha256", "X-Amz-Security-Token", "X-Amz-Target", "X-Requested-With"},
		AllowCredentials: false, MaxAge: 3600,
	}))
	app.Use(middleware.Logger(), middleware.AccessLog(accessLog), middleware.Recover())
	s3h := handler.NewS3Handler(d.S3Svc())
	NewRouter(app, NewRegistry(s3h)).RegisterRoutes()
	return app
}
