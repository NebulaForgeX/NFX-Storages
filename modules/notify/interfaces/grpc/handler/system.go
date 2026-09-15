package handler

import (
	"context"

	systemapp "nfxstorages/modules/notify/application/system"
	systemstatepb "nfxstorages/protos/gen/system/system_state"

	"google.golang.org/protobuf/types/known/timestamppb"
)

type SystemHandler struct {
	systemstatepb.UnimplementedSystemStateServiceServer
	svc *systemapp.Service
}

func NewSystemHandler(svc *systemapp.Service) *SystemHandler { return &SystemHandler{svc: svc} }

func toPB(row *systemapp.State) *systemstatepb.SystemState {
	if row == nil {
		return &systemstatepb.SystemState{}
	}
	st := &systemstatepb.SystemState{Id: row.ID.String(), Initialized: row.Initialized, ResetCount: int32(row.ResetCount)}
	if row.InitializedAt != nil {
		st.InitializedAt = timestamppb.New(*row.InitializedAt)
	}
	st.InitializationVersion = row.InitializationVersion
	return st
}

func (h *SystemHandler) GetLatestSystemState(ctx context.Context, req *systemstatepb.GetLatestSystemStateRequest) (*systemstatepb.GetLatestSystemStateResponse, error) {
	row, err := h.svc.Latest(ctx)
	if err != nil {
		return nil, err
	}
	return &systemstatepb.GetLatestSystemStateResponse{SystemState: toPB(row)}, nil
}

func (h *SystemHandler) InitializeSystem(ctx context.Context, req *systemstatepb.InitializeSystemRequest) (*systemstatepb.InitializeSystemResponse, error) {
	row, err := h.svc.Initialize(ctx, req.GetVersion())
	if err != nil {
		return nil, err
	}
	return &systemstatepb.InitializeSystemResponse{SystemState: toPB(row)}, nil
}
