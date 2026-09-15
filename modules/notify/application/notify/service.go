package notifyapp

import iamapp "nfxstorages/modules/iam/application/iam"

type Service struct{ IAM *iamapp.Service }

func New(iam *iamapp.Service) *Service { return &Service{IAM: iam} }

func (s *Service) Endpoints() map[string]any {
	if s.IAM == nil {
		return map[string]any{"notification_endpoints": []any{}}
	}
	return s.IAM.NotificationEndpoints()
}
