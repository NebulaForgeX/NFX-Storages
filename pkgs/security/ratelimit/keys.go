package ratelimit

import (
	"fmt"
	"time"
)

// Redis key 规范：带 namespace 隔离环境/业务线
// count：当日已提交次数
// pending：并发预留中
// last：最近一次完成操作（用于冷却）
// resv：单个预留token

func KeyCount(ns, action, subject string, now time.Time, loc *time.Location) string {
	y, m, d := now.In(loc).Date()
	return fmt.Sprintf("rl:%s:count:%04d%02d%02d", makeHashTag(ns, action, subject), y, int(m), d)
}
func KeyPending(ns, action, subject string) string {
	return fmt.Sprintf("rl:%s:pending", makeHashTag(ns, action, subject))
}
func KeyLast(ns, action, subject string) string {
	return fmt.Sprintf("rl:%s:last", makeHashTag(ns, action, subject))
}
func KeyResv(ns, action, subject, token string) string {
	return fmt.Sprintf("rl:%s:resv:%s", makeHashTag(ns, action, subject), token)
}

func EndOfDayUnix(ts time.Time, loc *time.Location) int64 {
	y, m, d := ts.In(loc).Date()
	return time.Date(y, m, d, 23, 59, 59, 0, loc).Unix()
}

func makeHashTag(ns, action, subject string) string {
	return "{rl|" + ns + "|" + action + "|" + subject + "}"
}
