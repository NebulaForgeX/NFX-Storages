package errx

import "google.golang.org/grpc/codes"

// GRPCCodeFromKind maps errx.Kind to gRPC codes.Code.
func GRPCCodeFromKind(k Kind) codes.Code {
	switch k {
	case KindInvalidArgument:
		return codes.InvalidArgument
	case KindUnauthorized:
		return codes.Unauthenticated
	case KindPermissionDenied:
		return codes.PermissionDenied
	case KindNotFound:
		return codes.NotFound
	case KindAlreadyExists:
		return codes.AlreadyExists
	case KindFailedPrecondition:
		return codes.FailedPrecondition
	case KindConflict:
		return codes.Aborted
	case KindExpired:
		return codes.DeadlineExceeded
	case KindTooManyRequests:
		return codes.ResourceExhausted
	default:
		return codes.Internal
	}
}

// GRPCCode returns the gRPC status code for the error.
func GRPCCode(err error) codes.Code {
	if e := AsError(err); e != nil {
		return GRPCCodeFromKind(e.Kind)
	}
	return codes.Internal
}
