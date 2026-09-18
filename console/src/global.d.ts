import type {
  Defined as _Defined,
  Emptyable as _Emptyable,
  KeyOf as _KeyOf,
  Maybe as _Maybe,
  Nilable as _Nilable,
  Nullable as _Nullable,
  Stringable as _Stringable,
  ValueOf as _ValueOf,
} from "nfx-ui/config";

export {};

declare global {
  type Nullable<T> = _Nullable<T>;
  type Maybe<T> = _Maybe<T>;
  type Nilable<T> = _Nilable<T>;
  type Emptyable<T> = _Emptyable<T>;
  type Stringable<T extends string> = _Stringable<T>;
  type ValueOf<T> = _ValueOf<T>;
  type KeyOf<T> = _KeyOf<T>;
  type Defined<T, Tag extends string> = _Defined<T, Tag>;
}
