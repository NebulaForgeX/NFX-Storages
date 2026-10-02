package s3app

import (
	"time"

	"nfxstorages/engine/sigv4"
	"nfxstorages/engine/store"
	storageserr "nfxstorages/errors/src/storages"
	iamapp "nfxstorages/modules/iam/application/iam"
	objectapp "nfxstorages/modules/object/application/object"
)

type Service struct {
	IAM     *iamapp.Service
	Objects *objectapp.Service
}

func New(iam *iamapp.Service, objects *objectapp.Service) *Service {
	return &Service{IAM: iam, Objects: objects}
}

type HeaderBag = sigv4.HeaderBag
type BucketInfo = objectapp.BucketInfo
type ObjectInfo = objectapp.ObjectInfo
type AccessKey = iamapp.AccessKey

func (s *Service) AuthorizeSigV4(h HeaderBag, body []byte, authorization, sessionToken string) (string, error) {
	ak, sig, signed, region, dateScope, ok := sigv4.ParseAuthorization(authorization)
	if !ok {
		return "", storageserr.ErrAccessDenied
	}
	row, err := s.IAM.Lookup(ak)
	if err != nil {
		return "", storageserr.ErrInvalidAccessKey
	}
	if !sigv4.Verify(h, body, row.SecretKey, signed, dateScope, sig, region) {
		return "", storageserr.ErrSignatureMismatch
	}
	if !s.IAM.MatchSession(row, sessionToken) {
		return "", storageserr.ErrInvalidToken
	}
	return ak, nil
}

func (s *Service) Lookup(accessKey string) (AccessKey, error) {
	return s.IAM.Lookup(accessKey)
}

func (s *Service) IssueSession(row AccessKey, ttl time.Duration) (AccessKey, error) {
	return s.IAM.IssueSession(row, ttl)
}

func (s *Service) VerifySig(h HeaderBag, body []byte, secret, signed, dateScope, sig, region string) bool {
	return sigv4.Verify(h, body, secret, signed, dateScope, sig, region)
}

func (s *Service) ParseAuthorization(header string) (accessKey, signature, signedHeaders, region, dateScope string, ok bool) {
	return sigv4.ParseAuthorization(header)
}

func FormatETag(etag string) string { return store.FormatETag(etag) }

func HashSHA256(data []byte) string { return sigv4.HashSHA256(data) }
