export function toTextInputValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(item => String(item)).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function toNumberInputValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "1" : "0";
  if (Array.isArray(value) && value.length > 0) return String(value[0]);
  return "";
}



