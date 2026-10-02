package ratelimit

import "errors"

var (
	ErrReservationMissing = errors.New("ratelimit: reservation missing or expired")
)
