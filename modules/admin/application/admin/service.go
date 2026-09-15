package adminapp

import (
	"errors"

	authconn "nfxstorages/connections/auth"
	"nfxstorages/engine/sigv4"
	iamapp "nfxstorages/modules/iam/application/iam"
	objectapp "nfxstorages/modules/object/application/object"
	"nfxstorages/pkgs/security/token"
)

type Service struct {
	IAM       *iamapp.Service
	Objects   *objectapp.Service
	Identity  *authconn.Client
	UserToken token.Verifier
}

func New(iam *iamapp.Service, objects *objectapp.Service, identity *authconn.Client, userToken token.Verifier) *Service {
	return &Service{IAM: iam, Objects: objects, Identity: identity, UserToken: userToken}
}

type HeaderBag = sigv4.HeaderBag

func (s *Service) AuthorizeSigV4(h HeaderBag, body []byte, authorization, sessionToken string) (string, error) {
	ak, sig, signed, region, dateScope, ok := sigv4.ParseAuthorization(authorization)
	if !ok {
		return "", errors.New("AccessDenied")
	}
	row, err := s.IAM.Lookup(ak)
	if err != nil {
		return "", errors.New("InvalidAccessKeyId")
	}
	if !s.IAM.MatchSession(row, sessionToken) {
		return "", errors.New("InvalidToken")
	}
	if !sigv4.Verify(h, body, row.SecretKey, signed, dateScope, sig, region) {
		return "", errors.New("SignatureDoesNotMatch")
	}
	return ak, nil
}
