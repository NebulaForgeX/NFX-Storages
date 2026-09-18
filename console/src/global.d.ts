import type { Maybe as _Maybe, Nilable as _Nilable, Nullable as _Nullable } from "nfx-ui/config";

export {};

declare global {
  type Nullable<T> = _Nullable<T>;
  type Maybe<T> = _Maybe<T>;
  type Nilable<T> = _Nilable<T>;
}
