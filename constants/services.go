package constants

const (
	ServiceS3     = "s3"
	ServiceObject = "object"
	ServiceIAM    = "iam"
	ServiceAdmin  = "admin"
	ServiceNotify = "notify"
	ServiceSystem = "system"
)

func AllServices() []string {
	return []string{ServiceS3, ServiceObject, ServiceIAM, ServiceAdmin, ServiceNotify, ServiceSystem}
}
