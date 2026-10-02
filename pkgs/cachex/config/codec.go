package config

import (
	"encoding/json"

	"github.com/vmihailenco/msgpack/v5"
)

type Codec interface {
	Encode(v any) ([]byte, error)
	Decode(data []byte, v any) error
	Name() string
}

// JSONCodec implements JSON serialization
type JSONCodec struct{}

func (c *JSONCodec) Encode(v any) ([]byte, error) {
	return json.Marshal(v)
}

func (c *JSONCodec) Decode(data []byte, v any) error {
	return json.Unmarshal(data, v)
}

func (c *JSONCodec) Name() string {
	return "JSON"
}

// MessagePackCodec implements MessagePack serialization
type MessagePackCodec struct{}

func (c *MessagePackCodec) Encode(v any) ([]byte, error) {
	return msgpack.Marshal(v)
}

func (c *MessagePackCodec) Decode(data []byte, v any) error {
	return msgpack.Unmarshal(data, v)
}

func (c *MessagePackCodec) Name() string {
	return "MessagePack"
}
