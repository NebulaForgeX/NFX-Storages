package errx

type Kind int

const (
	KindInvalidArgument Kind = iota
	KindUnauthorized
	KindPermissionDenied
	KindNotFound
	KindAlreadyExists
	KindFailedPrecondition
	KindConflict
	KindExpired
	KindTooManyRequests
	KindInternal
)
