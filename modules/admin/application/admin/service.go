package adminapp

import (
	authconn "nfxstorages/connections/auth"
	"nfxstorages/engine/sigv4"
	storageserr "nfxstorages/errors/src/storages"
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
		return "", storageserr.ErrAccessDenied
	}
	row, err := s.IAM.Lookup(ak)
	if err != nil {
		return "", storageserr.ErrInvalidAccessKey
	}
	if !s.IAM.MatchSession(row, sessionToken) {
		return "", storageserr.ErrInvalidToken
	}
	if !sigv4.Verify(h, body, row.SecretKey, signed, dateScope, sig, region) {
		return "", storageserr.ErrSignatureMismatch
	}
	return ak, nil
}
