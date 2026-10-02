package fiberx

import (
	"context"

	"github.com/google/uuid"
)

type accountIDCtxKey struct{}
type profileIDCtxKey struct{}
type profileScopeCtxKey struct{}

func WithAccountID(ctx context.Context, accountID uuid.UUID) context.Context {
	return context.WithValue(ctx, accountIDCtxKey{}, accountID)
}

func AccountIDFromContext(ctx context.Context) (uuid.UUID, bool) {
	v := ctx.Value(accountIDCtxKey{})
	if v == nil {
		return uuid.UUID{}, false
	}
	id, ok := v.(uuid.UUID)
	return id, ok
}

func WithProfileID(ctx context.Context, profileID uuid.UUID) context.Context {
	return context.WithValue(ctx, profileIDCtxKey{}, profileID)
}

func ProfileIDFromContext(ctx context.Context) (uuid.UUID, bool) {
	v := ctx.Value(profileIDCtxKey{})
	if v == nil {
		return uuid.UUID{}, false
	}
	id, ok := v.(uuid.UUID)
	return id, ok
}

func WithProfileScope(ctx context.Context, scope string) context.Context {
	return context.WithValue(ctx, profileScopeCtxKey{}, scope)
}

func ProfileScopeFromContext(ctx context.Context) (string, bool) {
	v := ctx.Value(profileScopeCtxKey{})
	if v == nil {
		return "", false
	}
	s, ok := v.(string)
	return s, ok
}

// UserIDFromContext kept as alias of account id for any leftover callers during rewrite.
func WithUserID(ctx context.Context, userID uuid.UUID) context.Context {
	return WithAccountID(ctx, userID)
}

func UserIDFromContext(ctx context.Context) (uuid.UUID, bool) {
	return AccountIDFromContext(ctx)
}
