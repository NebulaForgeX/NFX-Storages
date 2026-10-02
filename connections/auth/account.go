package auth

import (
	"context"

	accountpb "nfxstorages/protos/gen/auth/account"

	"github.com/google/uuid"
)

type AccountClient struct {
	client accountpb.AccountServiceClient
}

func newAccountClient(client accountpb.AccountServiceClient) *AccountClient {
	return &AccountClient{client: client}
}

func (c *AccountClient) GetFullAccountInformation(ctx context.Context, accountID uuid.UUID) (*accountpb.FullAccountInformation, error) {
	resp, err := c.client.GetFullAccountInformation(ctx, &accountpb.GetFullAccountInformationRequest{AccountId: accountID.String()})
	if err != nil {
		return nil, err
	}
	return resp.GetFull(), nil
}

func (c *AccountClient) GetAccountByID(ctx context.Context, id uuid.UUID) (*accountpb.FullAccountInformation, error) {
	resp, err := c.client.GetAccountByID(ctx, &accountpb.GetAccountByIDRequest{Id: id.String()})
	if err != nil {
		return nil, err
	}
	items := resp.GetItems()
	if len(items) == 0 {
		return nil, nil
	}
	return items[0], nil
}

func (c *AccountClient) EnsureOwnedProfile(ctx context.Context, accountID, profileID uuid.UUID, profileScope string) (bool, error) {
	resp, err := c.client.EnsureOwnedProfile(ctx, &accountpb.EnsureOwnedProfileRequest{
		AccountId:    accountID.String(),
		ProfileId:    profileID.String(),
		ProfileScope: profileScope,
	})
	if err != nil {
		return false, err
	}
	return resp.GetAllowed(), nil
}

func (c *AccountClient) ListProfilesInTable(ctx context.Context, table, query string, limit, offset int) (*accountpb.ListProfilesInTableResponse, error) {
	return c.client.ListProfilesInTable(ctx, &accountpb.ListProfilesInTableRequest{
		Table:  table,
		Query:  query,
		Limit:  int32(limit),
		Offset: int32(offset),
	})
}
