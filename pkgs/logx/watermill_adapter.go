package logx

import (
	"sort"

	"github.com/ThreeDotsLabs/watermill"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type ZapWatermillLogger struct {
	l        *zap.SugaredLogger
	minLevel zapcore.Level
}

var _ watermill.LoggerAdapter = (*ZapWatermillLogger)(nil)

func NewZapWatermillLogger(base *zap.Logger) *ZapWatermillLogger {
	return NewZapWatermillLoggerWithLevel(base, zapcore.InfoLevel)
}

func NewZapWatermillLoggerWithLevel(base *zap.Logger, min zapcore.Level) *ZapWatermillLogger {
	if base == nil {
		base = zap.NewNop()
	}
	return &ZapWatermillLogger{
		l:        base.WithOptions(zap.AddCallerSkip(1)).Sugar(),
		minLevel: min,
	}
}

func (z *ZapWatermillLogger) Error(msg string, err error, fields watermill.LogFields) {
	kv := mapToKVs(fields)
	z.l.With(kv...).With("error", err).Errorw(msg)
}

func (z *ZapWatermillLogger) Info(msg string, fields watermill.LogFields) {
	if z.minLevel > zapcore.InfoLevel {
		return
	}
	kv := mapToKVs(fields)
	z.l.With(kv...).Infow(msg)
}

func (z *ZapWatermillLogger) Debug(msg string, fields watermill.LogFields) {
	if z.minLevel > zapcore.DebugLevel {
		return
	}
	kv := mapToKVs(fields)
	z.l.With(kv...).Debugw(msg)
}

func (z *ZapWatermillLogger) Trace(msg string, fields watermill.LogFields) {
	if z.minLevel > zapcore.DebugLevel {
		return
	}
	if fields == nil {
		fields = watermill.LogFields{}
	}
	fields["trace"] = true
	kv := mapToKVs(fields)
	z.l.With(kv...).Debugw(msg)
}

func (z *ZapWatermillLogger) With(fields watermill.LogFields) watermill.LoggerAdapter {
	kv := mapToKVs(fields)
	return &ZapWatermillLogger{l: z.l.With(kv...), minLevel: z.minLevel}
}

/********** helpers **********/

func mapToKVs(m map[string]any) []any {
	if len(m) == 0 {
		return nil
	}
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	kv := make([]any, 0, len(m)*2)
	for _, k := range keys {
		kv = append(kv, k, m[k])
	}
	return kv
}
