package errx

var (
	ErrInvalidParams   = InvalidArg("INVALID_PARAMS", "invalid request parameters")
	ErrInvalidQuery    = InvalidArg("INVALID_QUERY", "invalid request query")
	ErrInvalidBody     = InvalidArg("INVALID_BODY", "invalid request body")
	ErrUnauthorized    = Unauthorized("UNAUTHORIZED", "unauthorized")
	ErrTooManyRequests = TooManyRequests("TOO_MANY_REQUESTS", "too many requests")
	ErrInternal        = Internal("INTERNAL", "internal server error")
)
