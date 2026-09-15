package auth

import (
	"nfxstorages/pkgs/security/token/servertoken"
	accountpb "nfxstorages/protos/gen/auth/account"
	authorityprofilepb "nfxstorages/protos/gen/auth/authority_profile"
	forgerprofilepb "nfxstorages/protos/gen/auth/forger_profile"

	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type GRPCConfig struct {
	Addr           string
	TokenSecretKey string
	TokenIssuer    string
	CallerService  string
}

type Client struct {
	Account          *AccountClient
	ForgerProfile    *ForgerProfileClient
	AuthorityProfile *AuthorityProfileClient
	conn             *grpc.ClientConn
}

func Dial(cfg GRPCConfig) (*Client, error) {
	tokenProvider := servertoken.NewProvider(
		&servertoken.HMACSigner{Key: []byte(cfg.TokenSecretKey)},
		cfg.TokenIssuer,
		cfg.CallerService,
	)
	conn, err := grpc.NewClient(cfg.Addr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithPerRPCCredentials(servertoken.NewPerRPCCreds(tokenProvider, true)),
		grpc.WithStatsHandler(otelgrpc.NewClientHandler()),
	)
	if err != nil {
		return nil, err
	}
	return &Client{
		Account:          newAccountClient(accountpb.NewAccountServiceClient(conn)),
		ForgerProfile:    newForgerProfileClient(forgerprofilepb.NewForgerProfileServiceClient(conn)),
		AuthorityProfile: newAuthorityProfileClient(authorityprofilepb.NewAuthorityProfileServiceClient(conn)),
		conn:             conn,
	}, nil
}

func (c *Client) Close() error {
	if c == nil || c.conn == nil {
		return nil
	}
	return c.conn.Close()
}
