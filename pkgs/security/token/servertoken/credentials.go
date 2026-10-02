package servertoken

import "context"

type PerRPCCreds struct {
	Provider   TokenProvider
	InsecureOK bool
}

func NewPerRPCCreds(provider TokenProvider, insecureOK bool) PerRPCCreds {
	return PerRPCCreds{
		Provider:   provider,
		InsecureOK: insecureOK,
	}
}

func (c PerRPCCreds) GetRequestMetadata(ctx context.Context, _ ...string) (map[string]string, error) {
	tok, err := c.Provider.GetToken(ctx)
	if err != nil {
		return nil, err
	}
	return map[string]string{"authorization": "Bearer " + tok}, nil
}
func (c PerRPCCreds) RequireTransportSecurity() bool { return !c.InsecureOK }
