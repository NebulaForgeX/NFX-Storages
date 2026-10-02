package usertoken

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type OpenIDConfig struct {
	Issuer                string   `json:"issuer"`
	JWKsURI               string   `json:"jwks_uri"`
	TokenEndpoint         string   `json:"token_endpoint"`
	RevocationEndpoint    string   `json:"revocation_endpoint"`
	AuthorizationEndpoint string   `json:"authorization_endpoint"`
	EndSessionEndpoint    string   `json:"end_session_endpoint"`
	UserInfoEndpoint      string   `json:"userinfo_endpoint"`
	IDTokenSigningAlgs    []string `json:"id_token_signing_alg_values_supported"`
}

func FetchOpenIDConfiguration(issuerEndpoint string) (*OpenIDConfig, error) {
	url := fmt.Sprintf("%s/.well-known/openid-configuration", issuerEndpoint)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var config OpenIDConfig
	if err := json.NewDecoder(resp.Body).Decode(&config); err != nil {
		return nil, err
	}
	return &config, nil
}
