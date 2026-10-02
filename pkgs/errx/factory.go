package errx

func InvalidArg(code, msg string) *Error {
	return New(KindInvalidArgument, code, msg)
}

func Unauthorized(code, msg string) *Error {
	return New(KindUnauthorized, code, msg)
}

func Forbidden(code, msg string) *Error {
	return New(KindPermissionDenied, code, msg)
}

func NotFound(code, msg string) *Error {
	return New(KindNotFound, code, msg)
}

func Conflict(code, msg string) *Error {
	return New(KindConflict, code, msg)
}

func FailedPrecond(code, msg string) *Error {
	return New(KindFailedPrecondition, code, msg)
}

func Expired(code, msg string) *Error {
	return New(KindExpired, code, msg)
}

func TooManyRequests(code, msg string) *Error {
	return New(KindTooManyRequests, code, msg)
}

func Internal(code, msg string) *Error {
	return New(KindInternal, code, msg)
}
