package core

import (
	"context"
	"fmt"
	"strconv"

	"nfxstorages/pkgs/utils/id"

	"github.com/redis/go-redis/v9"
)

type counterCache[ID id.IDtype] struct {
	base      BaseCache
	kb        KeyBuilder
	converter id.IDConverter[ID]
}

func NewCounterCache[ID id.IDtype](base BaseCache, kb KeyBuilder) CounterCache[ID] {
	// ensure no version for counters
	return &counterCache[ID]{
		base:      base,
		kb:        kb,
		converter: id.NewIDConverter[ID](),
	}
}

func (c *counterCache[ID]) Base() BaseCache        { return c.base }
func (c *counterCache[ID]) KeyBuilder() KeyBuilder { return c.kb }

func (c *counterCache[ID]) Incr(ctx context.Context, name string, id ID) (int64, error) {
	key := c.kb.Counter(name, c.converter.ToString(id))
	fmt.Println("key", key)
	return c.base.Incr(ctx, key)
}

func (c *counterCache[ID]) IncrBy(ctx context.Context, name string, id ID, delta int64) (int64, error) {
	key := c.kb.Counter(name, c.converter.ToString(id))
	return c.base.IncrBy(ctx, key, delta)
}

func (c *counterCache[ID]) Get(ctx context.Context, name string, id ID) (int64, error) {
	key := c.kb.Counter(name, c.converter.ToString(id))
	return c.base.GetInt64(ctx, key)
}

func (c *counterCache[ID]) GetAndReset(ctx context.Context, name string, id ID) (int64, error) {
	key := c.kb.Counter(name, c.converter.ToString(id))
	// Use GETDEL via base client
	cmd := c.base.Client().GetDel(ctx, key)
	s, err := cmd.Result()
	if err != nil {
		if err == redis.Nil {
			return 0, nil
		}
		return 0, err
	}
	v, convErr := strconv.ParseInt(s, 10, 64)
	if convErr != nil {
		return 0, convErr
	}
	return v, nil
}

func (c *counterCache[ID]) Reset(ctx context.Context, name string, id ID) error {
	key := c.kb.Counter(name, c.converter.ToString(id))
	return c.base.Delete(ctx, key)
}

func (c *counterCache[ID]) Pattern(name string) string {
	return c.kb.CounterPattern(name)
}

func (c *counterCache[ID]) ScanAndConsume(
	ctx context.Context,
	name string,
	count int64,
	batchSize int,
	consume func(id ID, delta int64),
) error {
	if batchSize <= 0 {
		batchSize = 500
	}
	pattern := c.kb.CounterPattern(name)
	iter := c.base.Client().Scan(ctx, 0, pattern, count).Iterator()
	keys := make([]string, 0, batchSize)

	apply := func(chunk []string) error {
		if len(chunk) == 0 {
			return nil
		}
		pipe := c.base.Client().Pipeline()
		cmds := make([]*redis.StringCmd, 0, len(chunk))
		for _, k := range chunk {
			cmds = append(cmds, pipe.GetDel(ctx, k))
		}
		if _, err := pipe.Exec(ctx); err != nil {
			return err
		}
		for i, cmd := range cmds {
			s, err := cmd.Result()
			if err != nil || s == "" {
				continue
			}
			delta, convErr := strconv.ParseInt(s, 10, 64)
			if convErr != nil || delta == 0 {
				continue
			}
			// parse id from key: ...:{id}
			idStr, ok := c.kb.GetIDFromCounterKey(chunk[i], name)
			if ok {
				consume(c.converter.ToID(idStr), delta)
			}
		}
		return nil
	}

	for iter.Next(ctx) {
		keys = append(keys, iter.Val())
		if len(keys) >= batchSize {
			if err := apply(keys); err != nil {
				return err
			}
			keys = keys[:0]
		}
	}
	if err := iter.Err(); err != nil {
		return err
	}
	return apply(keys)
}
