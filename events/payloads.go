package events

type ObjectWrittenEvent struct {
	ObjectTopic
	Bucket string `json:"bucket"`
	Key    string `json:"key"`
	Size   int64  `json:"size"`
}

type BucketNotificationEvent struct {
	NotifyTopic
	Bucket string `json:"bucket"`
	Event  string `json:"event"`
	Key    string `json:"key,omitempty"`
}
