package http

import (
	"encoding/json"
	"time"

	authconn "nfxstorages/connections/auth"
	"nfxstorages/engine/iam"
	"nfxstorages/engine/store"
	adminhandler "nfxstorages/modules/admin/interfaces/http/handler"
	systemapp "nfxstorages/modules/admin/application/system"
	"nfxstorages/pkgs/fiberx"
	"nfxstorages/pkgs/fiberx/middleware"
	"nfxstorages/pkgs/httpx"
	"nfxstorages/pkgs/security/token"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
)

type httpDeps interface {
	AppSvc() *systemapp.Service
	Store() *store.Engine
	IAM() *iam.Service
	AuthClient() *authconn.Client
	UserTokenVerifier() token.Verifier
	ErrorsLangsPath() string
}

func NewHTTPServer(d httpDeps, accessLog httpx.AccessLogConfig) *fiber.App {
	app := fiber.New(fiber.Config{
		JSONEncoder: json.Marshal, JSONDecoder: json.Unmarshal, ErrorHandler: fiberx.ErrorHandler,
		ReadTimeout: 30 * time.Second, WriteTimeout: 60 * time.Second, IdleTimeout: 120 * time.Second,
		BodyLimit: 64 * 1024 * 1024,
	})
	app.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"},
		AllowHeaders: []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Amz-Date", "X-Amz-Content-Sha256", "X-Amz-Security-Token", "X-Requested-With"},
		AllowCredentials: false, MaxAge: 3600,
	}))
	app.Use(middleware.Logger(), middleware.AccessLog(accessLog), middleware.Recover())
	admin := adminhandler.NewAdminHandler(d.Store(), d.IAM(), d.AuthClient(), d.UserTokenVerifier())
	NewRouter(app, NewRegistry(d.AppSvc(), admin, d.ErrorsLangsPath())).RegisterRoutes()
	return app
}
