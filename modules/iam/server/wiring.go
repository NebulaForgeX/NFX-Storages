package server

import (
	"context"
	"fmt"
	"time"

	"google.golang.org/grpc"
	authconn "nfxstorages/connections/auth"
	iamapp "nfxstorages/modules/iam/application/iam"
	resourceApp "nfxstorages/modules/iam/application/resource"
	"nfxstorages/modules/iam/config"
	iaminfra "nfxstorages/modules/iam/infrastructure/iam"
	"nfxstorages/pkgs/cachex"
	"nfxstorages/pkgs/connections/otelx"
	"nfxstorages/pkgs/health"
	"nfxstorages/pkgs/kafkax"
	"nfxstorages/pkgs/kafkax/eventbus"
	"nfxstorages/pkgs/postgresqlx"
	"nfxstorages/pkgs/security/token"
	"nfxstorages/pkgs/security/token/servertoken"
	"nfxstorages/pkgs/tokenx"
)

type Dependencies struct {
	healthMgr           *health.Manager
	cache               *cachex.Connection
	postgres            *postgresqlx.Connection
	kafkaConfig         *kafkax.Config
	busPublisher        *eventbus.BusPublisher
	otelShutdown        otelx.ShutdownFunc
	resourceSvc         *resourceApp.Service
	userTokenVerifier   token.Verifier
	serverTokenVerifier token.Verifier
	errorsLangsPath     string
	conns               []*grpc.ClientConn
	identityAuth        *authconn.Client
	iamSvc              *iamapp.Service
}

func NewDeps(ctx context.Context, cfg *config.Config) (*Dependencies, error) {
	postgres, err := postgresqlx.Init(ctx, cfg.PostgreSQL)
	if err != nil {
		return nil, fmt.Errorf("init PostgreSQL: %w", err)
	}
	cacheConn, err := cachex.InitConn(ctx, cfg.Cache)
	if err != nil {
		return nil, fmt.Errorf("init Redis: %w", err)
	}
	healthMgr := health.NewManager(ctx, 30*time.Second)
	healthMgr.Register(postgres)
	healthMgr.Register(cacheConn)
	kafkaConfig := cfg.KafkaConfig
	busPublisher, err := kafkax.NewPublisher(&kafkaConfig)
	if err != nil {
		return nil, fmt.Errorf("kafka publisher: %w", err)
	}
	tokenxInstance := tokenx.New(cfg.Token)
	userTokenVerifier := &tokenxVerifierAdapter{tokenx: tokenxInstance}
	serverTokenVerifier := servertoken.NewVerifier(
		&servertoken.HMACSigner{Key: []byte(cfg.Token.SecretKey)},
		cfg.Token.Issuer,
		servertoken.WithAllowedSkew(5*time.Second),
	)
	provider := servertoken.NewProvider(
		&servertoken.HMACSigner{Key: []byte(cfg.Token.SecretKey)},
		cfg.Token.Issuer,
		"iam",
	)
	identityClient, err := authconn.Dial(authconn.GRPCConfig{
		Addr:           cfg.GRPCClient.AuthAddr,
		TokenSecretKey: cfg.Token.SecretKey,
		TokenIssuer:    cfg.Token.Issuer,
		CallerService:  "iam",
	})
	if err != nil {
		return nil, fmt.Errorf("dial identity auth: %w", err)
	}
	errorsLangsPath := cfg.I18n.ErrorsLangsPath
	if errorsLangsPath == "" {
		errorsLangsPath = "./errors/langs"
	}
	otelShutdown, err := otelx.Init(ctx, cfg.OTEL, cfg.Server.Name, cfg.Env)
	if err != nil {
		return nil, fmt.Errorf("init otel: %w", err)
	}
	d := &Dependencies{
		healthMgr: healthMgr, postgres: postgres, cache: cacheConn, kafkaConfig: &kafkaConfig,
		busPublisher: busPublisher, otelShutdown: otelShutdown,
		resourceSvc:       resourceApp.NewService(postgres, cacheConn, &kafkaConfig),
		userTokenVerifier: userTokenVerifier, serverTokenVerifier: serverTokenVerifier, errorsLangsPath: errorsLangsPath,
		identityAuth: identityClient,
	}
	d.iamSvc = iamapp.New(iaminfra.New(postgres.DB()))
	_ = provider
	return d, nil
}

func (d *Dependencies) Cleanup() {
	d.healthMgr.Stop()
	d.postgres.Close()
	d.cache.Close()
	if d.otelShutdown != nil {
		_ = d.otelShutdown(context.Background())
	}
	if d.identityAuth != nil {
		_ = d.identityAuth.Close()
	}
	for _, c := range d.conns {
		_ = c.Close()
	}
}

func (d *Dependencies) ResourceSvc() *resourceApp.Service    { return d.resourceSvc }
func (d *Dependencies) UserTokenVerifier() token.Verifier    { return d.userTokenVerifier }
func (d *Dependencies) ServerTokenVerifier() token.Verifier  { return d.serverTokenVerifier }
func (d *Dependencies) KafkaConfig() *kafkax.Config          { return d.kafkaConfig }
func (d *Dependencies) BusPublisher() *eventbus.BusPublisher { return d.busPublisher }
func (d *Dependencies) ErrorsLangsPath() string              { return d.errorsLangsPath }
func (d *Dependencies) AuthClient() *authconn.Client         { return d.identityAuth }
func (d *Dependencies) IAMSvc() *iamapp.Service              { return d.iamSvc }

type tokenxVerifierAdapter struct{ tokenx *tokenx.Tokenx }

func (a *tokenxVerifierAdapter) Verify(ctx context.Context, tokenStr string) (*token.Claims, error) {
	claims, err := a.tokenx.VerifyAccessToken(tokenStr)
	if err != nil {
		return nil, err
	}
	return &token.Claims{Registered: claims.RegisteredClaims, Raw: map[string]any{
		"account_id":    claims.AccountID,
		"profile_id":    claims.ProfileID,
		"profile_scope": claims.ProfileScope,
	}}, nil
}
