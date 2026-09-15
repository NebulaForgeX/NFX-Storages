package auth

import (
	"context"

	authorityprofilepb "nfxstorages/protos/gen/auth/authority_profile"

	"github.com/google/uuid"
)

type AuthorityProfileClient struct {
	client authorityprofilepb.AuthorityProfileServiceClient
}

func newAuthorityProfileClient(client authorityprofilepb.AuthorityProfileServiceClient) *AuthorityProfileClient {
	return &AuthorityProfileClient{client: client}
}

func roleReq(accountID, profileID uuid.UUID, profileScope string) *authorityprofilepb.HasAuthorityRoleRequest {
	return &authorityprofilepb.HasAuthorityRoleRequest{
		AccountId:    accountID.String(),
		ProfileId:    profileID.String(),
		ProfileScope: profileScope,
	}
}

func (c *AuthorityProfileClient) IsAuditor(ctx context.Context, accountID, profileID uuid.UUID, profileScope string) (bool, error) {
	resp, err := c.client.IsAuditor(ctx, roleReq(accountID, profileID, profileScope))
	if err != nil {
		return false, err
	}
	return resp.GetAllowed(), nil
}

func (c *AuthorityProfileClient) IsAdministrator(ctx context.Context, accountID, profileID uuid.UUID, profileScope string) (bool, error) {
	resp, err := c.client.IsAdministrator(ctx, roleReq(accountID, profileID, profileScope))
	if err != nil {
		return false, err
	}
	return resp.GetAllowed(), nil
}

func (c *AuthorityProfileClient) IsOwner(ctx context.Context, accountID, profileID uuid.UUID, profileScope string) (bool, error) {
	resp, err := c.client.IsOwner(ctx, roleReq(accountID, profileID, profileScope))
	if err != nil {
		return false, err
	}
	return resp.GetAllowed(), nil
}

func (c *AuthorityProfileClient) HasAuthorityRole(ctx context.Context, accountID, profileID uuid.UUID, profileScope string) (bool, error) {
	resp, err := c.client.HasAuthorityRole(ctx, roleReq(accountID, profileID, profileScope))
	if err != nil {
		return false, err
	}
	return resp.GetAllowed(), nil
}

func (c *AuthorityProfileClient) BatchGetPublicProfileCards(ctx context.Context, profileIDs []string) ([]*authorityprofilepb.PublicProfileCard, error) {
	resp, err := c.client.BatchGetPublicProfileCards(ctx, &authorityprofilepb.BatchGetPublicProfileCardsRequest{ProfileIds: profileIDs})
	if err != nil {
		return nil, err
	}
	return resp.GetProfiles(), nil
}
