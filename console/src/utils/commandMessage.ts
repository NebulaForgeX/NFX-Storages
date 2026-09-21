import { i18n } from "nfx-ui/languages";
import { ERRORS_NS_IDENTITY, MESSAGES_NS_IDENTITY } from "nfx-ui/utils";

function lookup(ns: string, key: string, vars?: Record<string, unknown>): string {
  const out = i18n.t(key, { ns, defaultValue: "", ...(vars ?? {}) });
  if (typeof out !== "string" || !out.trim()) return "";
  if (out === key || out === `${ns}:${key}`) return "";
  return out;
}

/** Resolve a backend command/error key via requested `messages` then `errors` bundles. */
export function getCommandMessage(code: string | undefined, fallback = "", vars?: Record<string, unknown>): string {
  if (!code?.trim()) return fallback;
  const key = code.trim();
  const body = lookup(MESSAGES_NS_IDENTITY, `${key}.body`, vars);
  if (body) return body;
  const title = lookup(MESSAGES_NS_IDENTITY, `${key}.title`, vars);
  if (title) return title;
  const err = lookup(ERRORS_NS_IDENTITY, key, vars);
  if (err) return err;
  return fallback;
}
