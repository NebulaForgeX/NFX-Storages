package errx

import "net/http"

func HTTPStatusFromKind(k Kind) int {
	switch k {
	case KindInvalidArgument:
		return http.StatusBadRequest
	case KindUnauthorized:
		return http.StatusUnauthorized
	case KindPermissionDenied:
		return http.StatusForbidden
	case KindNotFound:
		return http.StatusNotFound
	case KindAlreadyExists, KindConflict:
		return http.StatusConflict
	case KindFailedPrecondition:
		return http.StatusUnprocessableEntity
	case KindExpired:
		return http.StatusGone
	case KindTooManyRequests:
		return http.StatusTooManyRequests
	default:
		return http.StatusInternalServerError
	}
}

func HTTPStatus(err error) int {
	if e := AsError(err); e != nil {
		return HTTPStatusFromKind(e.Kind)
	}
	return http.StatusInternalServerError
}
