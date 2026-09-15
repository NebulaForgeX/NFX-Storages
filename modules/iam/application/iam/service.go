package iamapp

import iaminfra "nfxstorages/modules/iam/infrastructure/iam"

type Service = iaminfra.Service
type AccessKey = iaminfra.AccessKey
type Policy = iaminfra.Policy
type Group = iaminfra.Group
type EventTarget = iaminfra.EventTarget
type Tier = iaminfra.Tier
type KMSKey = iaminfra.KMSKey
type KMSState = iaminfra.KMSState
type RemoteTarget = iaminfra.RemoteTarget

func New(inner *iaminfra.Service) *Service { return inner }
