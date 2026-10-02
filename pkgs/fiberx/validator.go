package fiberx

import (
	"nfxstorages/pkgs/errx"
	"nfxstorages/pkgs/validatorx"

	"github.com/go-playground/validator/v10"
)

type StructValidator struct {
	validate *validator.Validate
}

type StructValidatorOption func(v *validator.Validate)

func NewStructValidator(opts ...StructValidatorOption) *StructValidator {
	v := validator.New(validator.WithRequiredStructEnabled())
	validatorx.UseJSONTagAsFieldName(v)
	for _, opt := range opts {
		opt(v)
	}
	return &StructValidator{validate: v}
}

func (s *StructValidator) Validate(req any) error {
	if err := s.validate.Struct(req); err != nil {
		if verrs, ok := err.(validator.ValidationErrors); ok {
			return errx.NewValidationError(verrs)
		}
		return err
	}
	return nil
}
