package events

import "nfxstorages/pkgs/kafkax/eventbus"

const (
	TKS3        eventbus.TopicKey = "s3"
	TKS3DLQ     eventbus.TopicKey = "s3_poison"
	TKObject    eventbus.TopicKey = "object"
	TKObjectDLQ eventbus.TopicKey = "object_poison"
	TKIAM       eventbus.TopicKey = "iam"
	TKIAMDLQ    eventbus.TopicKey = "iam_poison"
	TKAdmin     eventbus.TopicKey = "admin"
	TKAdminDLQ  eventbus.TopicKey = "admin_poison"
	TKNotify    eventbus.TopicKey = "notify"
	TKNotifyDLQ eventbus.TopicKey = "notify_poison"
)

type S3Topic struct{}

func (S3Topic) TopicKey() eventbus.TopicKey { return TKS3 }

type ObjectTopic struct{}

func (ObjectTopic) TopicKey() eventbus.TopicKey { return TKObject }

type IAMTopic struct{}

func (IAMTopic) TopicKey() eventbus.TopicKey { return TKIAM }

type AdminTopic struct{}

func (AdminTopic) TopicKey() eventbus.TopicKey { return TKAdmin }

type NotifyTopic struct{}

func (NotifyTopic) TopicKey() eventbus.TopicKey { return TKNotify }
