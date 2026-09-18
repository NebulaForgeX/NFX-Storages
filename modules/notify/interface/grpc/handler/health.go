package handler

import (
	"context"
	"time"

	"nfxstorages/modules/notify/application/resource"
	healthpb "nfxstorages/protos/gen/common/health"
)

type HealthHandler struct {
	healthpb.UnimplementedHealthServiceServer
	resourceSvc *resource.Service
	serviceName string
}

func NewHealthHandler(resourceSvc *resource.Service, serviceName string) *HealthHandler {
	return &HealthHandler{resourceSvc: resourceSvc, serviceName: serviceName}
}

func (h *HealthHandler) GetHealth(ctx context.Context, req *healthpb.GetHealthRequest) (*healthpb.GetHealthResponse, error) {
	infra := &healthpb.InfrastructureHealth{Others: map[string]*healthpb.ResourceHealth{}}
	allHealthy := true
	now := time.Now().Unix()

	postgresErr := h.resourceSvc.CheckPostgres(ctx)
	dbHealth := &healthpb.ResourceHealth{Healthy: postgresErr == nil, CheckedAt: now}
	if postgresErr != nil {
		errMsg := postgresErr.Error()
		dbHealth.ErrorMessage = &errMsg
		allHealthy = false
	}
	infra.Database = dbHealth

	redisErr := h.resourceSvc.CheckRedis(ctx)
	redisHealth := &healthpb.ResourceHealth{Healthy: redisErr == nil, CheckedAt: now}
	if redisErr != nil {
		errMsg := redisErr.Error()
		redisHealth.ErrorMessage = &errMsg
		allHealthy = false
	}
	infra.Redis = redisHealth

	kafkaErr := h.resourceSvc.CheckKafka(ctx)
	if kafkaErr != nil {
		errMsg := kafkaErr.Error()
		infra.Others["kafka"] = &healthpb.ResourceHealth{Healthy: false, ErrorMessage: &errMsg, CheckedAt: now}
		allHealthy = false
	} else {
		infra.Others["kafka"] = &healthpb.ResourceHealth{Healthy: true, CheckedAt: now}
	}

	return &healthpb.GetHealthResponse{
		Healthy: allHealthy, Infrastructure: infra, ServiceName: h.serviceName, CheckedAt: now,
	}, nil
}
