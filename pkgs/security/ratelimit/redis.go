package ratelimit

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisLimiter struct {
	rdb    *redis.Client
	ps     PolicySet
	loc    *time.Location
	genTok func() (string, error)
}

func NewRedisLimiter(rdb *redis.Client, ps PolicySet, loc *time.Location) *RedisLimiter {
	return &RedisLimiter{
		rdb: rdb, ps: ps, loc: loc,
		genTok: func() (string, error) {
			var b [16]byte
			if _, err := rand.Read(b[:]); err != nil {
				return "", err
			}
			return hex.EncodeToString(b[:]), nil
		},
	}
}

var luaTry = redis.NewScript(`
-- KEYS: countKey, pendingKey, lastKey, resvKey
-- ARGV: dailyMax, cooldownSec, nowSec, eodSec, resvTTL
local countKey   = KEYS[1]
local pendingKey = KEYS[2]
local lastKey    = KEYS[3]
local resvKey    = KEYS[4]

local dailyMax   = tonumber(ARGV[1])
local cooldown   = tonumber(ARGV[2])
local nowSec     = tonumber(ARGV[3])
local eodSec     = tonumber(ARGV[4])
local resvTTL    = tonumber(ARGV[5])

if dailyMax <= 0 then
  redis.call('SET', resvKey, '1', 'EX', resvTTL)
  redis.call('INCR', pendingKey)
  return {1, 0}
end

-- cooldown
local last = redis.call('GET', lastKey)
if last then
  local lastSec = tonumber(last)
  if lastSec and (nowSec - lastSec) < cooldown then
    return {2, cooldown - (nowSec - lastSec)}
  end
end

local countToday = tonumber(redis.call('GET', countKey) or '0')
local pending    = tonumber(redis.call('GET', pendingKey) or '0')
if countToday + pending >= dailyMax then
  return {3, 0}
end

redis.call('INCR', pendingKey)
redis.call('SET', resvKey, '1', 'EX', resvTTL)
return {1, 0}
`)

var luaCommit = redis.NewScript(`
-- KEYS: countKey, pendingKey, lastKey, resvKey
-- ARGV: nowSec, eodSec, cooldownSec
local countKey   = KEYS[1]
local pendingKey = KEYS[2]
local lastKey    = KEYS[3]
local resvKey    = KEYS[4]

local nowSec     = tonumber(ARGV[1])
local eodSec     = tonumber(ARGV[2])
local cooldown   = tonumber(ARGV[3])

if redis.call('GET', resvKey) == false then
  return {0, 'reservation_missing'}
end
redis.call('DEL', resvKey)

local pend = tonumber(redis.call('GET', pendingKey) or '0')
if pend > 0 then redis.call('DECR', pendingKey) end

local cnt = tonumber(redis.call('INCR', countKey))
if cnt == 1 then redis.call('EXPIREAT', countKey, eodSec) end

redis.call('SET', lastKey, tostring(nowSec), 'EX', cooldown)
return {1, 'ok'}
`)

var luaCancel = redis.NewScript(`
-- KEYS: pendingKey, resvKey
if redis.call('GET', resvKey) then
  redis.call('DEL', resvKey)
  local pend = tonumber(redis.call('GET', pendingKey) or '0')
  if pend > 0 then redis.call('DECR', pendingKey) end
  return 1
end
return 0
`)

func (l *RedisLimiter) TryReserve(
	ctx context.Context,
	ns string,
	action Action,
	subject SubjectID,
	now time.Time,
) (Reservation, Decision, time.Duration, error) {
	p := l.ps.For(action)

	token, err := l.genTok()
	if err != nil {
		return Reservation{}, Allowed, 0, err
	}

	countKey := KeyCount(ns, string(action), subject, now, l.loc)
	pendingKey := KeyPending(ns, string(action), subject)
	lastKey := KeyLast(ns, string(action), subject)
	resvKey := KeyResv(ns, string(action), subject, token)

	nowSec := now.Unix()
	eodSec := EndOfDayUnix(now, l.loc)

	res, err := luaTry.Run(ctx, l.rdb,
		[]string{countKey, pendingKey, lastKey, resvKey},
		p.DailyMax, int(p.Cooldown.Seconds()), nowSec, eodSec, int(p.ReservationTTL.Seconds()),
	).Result()
	if err != nil {
		return Reservation{}, Allowed, 0, err
	}

	arr := res.([]any)
	code := arr[0].(int64)

	switch code {
	case 1:
		return Reservation{
			Token: token, SubjectID: subject, Action: action, Namespace: ns, ExpireIn: p.ReservationTTL,
		}, Allowed, 0, nil
	case 2:
		wait := time.Duration(arr[1].(int64)) * time.Second
		return Reservation{}, CooldownNotPassed, wait, nil
	case 3:
		return Reservation{}, DailyLimitExceeded, 0, nil
	default:
		return Reservation{}, DailyLimitExceeded, 0, fmt.Errorf("unknown decision code %d", code)
	}
}

func (l *RedisLimiter) Commit(ctx context.Context, r Reservation, now time.Time) error {
	p := l.ps.For(r.Action)
	countKey := KeyCount(r.Namespace, string(r.Action), r.SubjectID, now, l.loc)
	pendingKey := KeyPending(r.Namespace, string(r.Action), r.SubjectID)
	lastKey := KeyLast(r.Namespace, string(r.Action), r.SubjectID)
	// 注意：Commit 也要带 namespace；这里演示用 r.Action/Subject，ns 放到 Reservation 里也行
	// 为保持简单，这里把 ns 交给上层拼好 keys 再注入；生产里建议把 ns 也存进 Reservation。
	// ——可把 Key* 改成方法接收 ns 参数；示例从简。

	_ = p
	// 这里简化：以空 ns 生成；推荐你在项目中把 ns 一并随 Reservation 保存。
	resvKey := KeyResv(r.Namespace, string(r.Action), r.SubjectID, r.Token)

	nowSec := now.Unix()
	eodSec := EndOfDayUnix(now, l.loc)

	res, err := luaCommit.Run(ctx, l.rdb,
		[]string{countKey, pendingKey, lastKey, resvKey},
		nowSec, eodSec, int(p.Cooldown.Seconds()),
	).Result()
	if err != nil {
		return err
	}
	arr := res.([]any)
	if arr[0].(int64) != 1 {
		return ErrReservationMissing
	}
	return nil
}

func (l *RedisLimiter) Cancel(ctx context.Context, r Reservation) error {
	pendingKey := KeyPending(r.Namespace, string(r.Action), r.SubjectID)
	resvKey := KeyResv(r.Namespace, string(r.Action), r.SubjectID, r.Token)
	_, err := luaCancel.Run(ctx, l.rdb, []string{pendingKey, resvKey}).Result()
	return err
}
