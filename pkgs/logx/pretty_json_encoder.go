package logx

import (
	"encoding/json"

	"go.uber.org/zap/buffer"
	"go.uber.org/zap/zapcore"
)

type prettyJSONEncoder struct {
	zapcore.Encoder
}

func newPrettyJSONEncoder(cfg zapcore.EncoderConfig) zapcore.Encoder {
	return &prettyJSONEncoder{Encoder: zapcore.NewJSONEncoder(cfg)}
}

func PrettyJSON(v any) string {
	b, _ := json.MarshalIndent(v, "", "  ")
	return string(b)
}

func PrettyJSONBytes(data []byte) string {
	if len(data) == 0 {
		return ""
	}
	var v any
	if err := json.Unmarshal(data, &v); err != nil {
		return string(data)
	}
	return PrettyJSON(v)
}

func (e *prettyJSONEncoder) EncodeEntry(ent zapcore.Entry, fields []zapcore.Field) (*buffer.Buffer, error) {
	buf, err := e.Encoder.EncodeEntry(ent, fields)
	if err != nil {
		return buf, err
	}
	pretty := PrettyJSONBytes(buf.Bytes())
	buf.Reset()
	buf.AppendString(pretty)
	buf.AppendString("\n")
	return buf, nil
}

func (e *prettyJSONEncoder) Clone() zapcore.Encoder {
	return &prettyJSONEncoder{Encoder: e.Encoder.Clone()}
}
