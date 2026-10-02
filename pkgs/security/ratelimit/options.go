package ratelimit

import "time"

type Policy struct {
	// 每日上限（<=0 表示不限）
	DailyMax int
	// 冷却期（两次操作最小间隔）
	Cooldown time.Duration
	// 预留有效期（事务超时保护）
	ReservationTTL time.Duration
}

// 针对 action 维度的策略，可设置默认与覆盖
type PolicySet struct {
	Default Policy
	// 按 action 覆盖：例如 "order_cancel" 有特殊限额
	Overrides map[Action]Policy
}

func (ps PolicySet) For(action Action) Policy {
	if p, ok := ps.Overrides[action]; ok {
		return p
	}
	return ps.Default
}
