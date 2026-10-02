package auth

import (
	"context"

	forgerprofilepb "nfxstorages/protos/gen/auth/forger_profile"

	"github.com/google/uuid"
)

type ForgerProfileClient struct {
	client forgerprofilepb.ForgerProfileServiceClient
}

func newForgerProfileClient(client forgerprofilepb.ForgerProfileServiceClient) *ForgerProfileClient {
	return &ForgerProfileClient{client: client}
}

func (c *ForgerProfileClient) HasForgerRole(ctx context.Context, accountID, profileID uuid.UUID, profileScope string) (bool, error) {
	resp, err := c.client.HasForgerRole(ctx, &forgerprofilepb.HasForgerRoleRequest{
		AccountId:    accountID.String(),
		ProfileId:    profileID.String(),
		ProfileScope: profileScope,
	})
	if err != nil {
		return false, err
	}
	return resp.GetAllowed(), nil
}

func (c *ForgerProfileClient) IsForger(ctx context.Context, accountID, profileID uuid.UUID, profileScope string) (bool, error) {
	resp, err := c.client.IsForger(ctx, &forgerprofilepb.HasForgerRoleRequest{
		AccountId:    accountID.String(),
		ProfileId:    profileID.String(),
		ProfileScope: profileScope,
	})
	if err != nil {
		return false, err
	}
	return resp.GetAllowed(), nil
}

func (c *ForgerProfileClient) BatchGetPublicProfileCards(ctx context.Context, profileIDs []string) ([]*forgerprofilepb.PublicProfileCard, error) {
	resp, err := c.client.BatchGetPublicProfileCards(ctx, &forgerprofilepb.BatchGetPublicProfileCardsRequest{ProfileIds: profileIDs})
	if err != nil {
		return nil, err
	}
	return resp.GetProfiles(), nil
}
