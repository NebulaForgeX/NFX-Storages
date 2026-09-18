package render

import (
	"testing"

	"nfxstorages/databases/cmd/schemagen/introspect"
)

func TestGoType_EnumArray(t *testing.T) {
	schema := introspect.SchemaForTest("social",
		&introspect.Enum{Name: "direct_message_policy", Values: []string{"everyone", "friends"}},
		&introspect.Enum{Name: "friend_request_policy", Values: []string{"everyone", "friends"}},
	)

	got := GoType(schema, &introspect.Column{
		Name:     "direct_message_policy",
		BaseType: "direct_message_policy",
		IsEnum:   true,
		IsArray:  true,
		Nullable: false,
	})
	want := "enumx.Array[enums.SocialDirectMessagePolicy]"
	if got != want {
		t.Fatalf("GoType enum array: got %q want %q", got, want)
	}

	// Nullable enum arrays must stay non-pointer (enumx.Array nil == SQL NULL).
	gotNull := GoType(schema, &introspect.Column{
		Name:     "direct_message_policy",
		BaseType: "direct_message_policy",
		IsEnum:   true,
		IsArray:  true,
		Nullable: true,
	})
	if gotNull != want {
		t.Fatalf("GoType nullable enum array: got %q want %q", gotNull, want)
	}

	gotScalar := GoType(schema, &introspect.Column{
		Name:     "friend_request_policy",
		BaseType: "friend_request_policy",
		IsEnum:   true,
		IsArray:  false,
		Nullable: false,
	})
	if gotScalar != "enums.SocialFriendRequestPolicy" {
		t.Fatalf("GoType scalar enum: got %q", gotScalar)
	}
}

func TestTypeTag_EnumArraySchemaQualified(t *testing.T) {
	schema := &introspect.Schema{Name: "social"}
	got := TypeTag(schema, &introspect.Column{
		BaseType:   "direct_message_policy",
		BaseSchema: "social",
		IsEnum:     true,
		IsArray:    true,
	})
	want := "social.direct_message_policy[]"
	if got != want {
		t.Fatalf("TypeTag enum array: got %q want %q", got, want)
	}
}
