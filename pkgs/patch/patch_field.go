package patch

import "reflect"

type PatchField[T any] struct {
	set   bool
	null  bool
	value T
}

func (p PatchField[T]) isPatchField()  {}
func (p PatchField[T]) IsSet() bool    { return p.set }
func (p PatchField[T]) IsUnset() bool  { return !p.set }
func (p PatchField[T]) IsNull() bool   { return p.set && p.null }
func (p PatchField[T]) HasValue() bool { return p.set && !p.null }

// Has value === IsSet() && !IsNull()
func (p PatchField[T]) Value() (T, bool) { return p.value, p.set && !p.null }

func Unset[T any]() PatchField[T]   { return PatchField[T]{} }
func SetNull[T any]() PatchField[T] { return PatchField[T]{set: true, null: true} }
func Set[T any](v T) PatchField[T]  { return PatchField[T]{set: true, value: v} }

// =================== Pointer to PatchField ===================
// nil === Unset
func FromPtr[T any](p *T) PatchField[T] {
	if p == nil {
		return Unset[T]()
	}
	return Set(*p)
}

// =======================  Diff  =======================
func (in PatchField[T]) DiffVal(old T) PatchField[T] {
	return in.DiffValBy(
		old,
		func(a, b T) bool { return reflect.DeepEqual(a, b) },
		func(a T) bool { return reflect.ValueOf(a).IsZero() },
	)
}

func (in PatchField[T]) DiffPtr(old *T) PatchField[T] {
	return in.DiffPtrBy(
		old,
		func(a, b T) bool { return reflect.DeepEqual(a, b) },
	)
}

func (in PatchField[T]) DiffValBy(old T, eq func(a, b T) bool, isZero func(a T) bool) PatchField[T] {
	if in.IsUnset() {
		return Unset[T]()
	}
	if in.IsNull() {
		if !isZero(old) {
			return SetNull[T]()
		}
		return Unset[T]()
	}
	if v, ok := in.Value(); ok {
		if !eq(v, old) {
			return Set(v)
		}
	}
	return Unset[T]()
}

func (in PatchField[T]) DiffPtrBy(old *T, eq func(a, b T) bool) PatchField[T] {
	if in.IsUnset() {
		return Unset[T]()
	}
	if in.IsNull() {
		if old != nil {
			return SetNull[T]()
		}
		return Unset[T]()
	}
	if v, ok := in.Value(); ok {
		if old == nil || !eq(*old, v) {
			return Set(v)
		}
	}
	return Unset[T]()
}

func GenDiffPatch[T comparable](old, new T) PatchField[T] {
	return GenDiffPatchBy(old, new, func(a, b T) bool { return a == b })
}

func GenDiffPatchBy[T any](old, new T, eq func(a, b T) bool) PatchField[T] {
	if eq(old, new) {
		return Unset[T]()
	}
	return Set(new)
}

func GenDiffPatchPtr[T comparable](old, new *T) PatchField[T] {
	switch {
	case old == nil && new == nil:
		return Unset[T]()
	case old == nil && new != nil:
		return Set(*new)
	case old != nil && new == nil:
		return SetNull[T]()
	default:
		if *old != *new {
			return Set(*new)
		}
		return Unset[T]()
	}
}
