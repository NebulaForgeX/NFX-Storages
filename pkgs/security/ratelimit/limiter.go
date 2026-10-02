package ratelimit

import (
	"context"
	"time"
)

// 主体ID用 string，兼容 uuid/用户ID/租户ID
type SubjectID = string

// 任意动作名：如 "order_cancel" / "login" / "pwd_reset"
type Action = string

type Decision int

const (
	Allowed Decision = iota
	CooldownNotPassed
	DailyLimitExceeded
)

type Reservation struct {
	Token     string
	SubjectID SubjectID
	Action    Action
	Namespace string
	ExpireIn  time.Duration
}

type Limiter interface {
	// TryReserve：尝试为 (namespace, action, subject) 预留一个配额。
	// 返回：Reservation（需 Commit/Cancel），或决策&等待时长。
	TryReserve(ctx context.Context, namespace string, action Action, subject SubjectID, now time.Time) (Reservation, Decision, time.Duration, error)
	Commit(ctx context.Context, r Reservation, now time.Time) error
	Cancel(ctx context.Context, r Reservation) error
}
