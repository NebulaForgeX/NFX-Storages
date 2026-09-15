package grpcx

import (
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func IsAvailabilityError(err error) bool {
	if err == nil {
		return false
	}
	if st, ok := status.FromError(err); ok {
		switch st.Code() {
		case codes.DeadlineExceeded, codes.Unavailable, codes.ResourceExhausted:
			return true
		// case codes.Internal, codes.Unknown:
		// 	return true
		default:
			return false
		}
	}
	return true
}
