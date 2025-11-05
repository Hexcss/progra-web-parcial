export function normalizeMessage(input: unknown, fallback = "Unknown error"): string {
  if (input == null) return fallback;
  if (typeof input === "string") return input;
  if (typeof input === "number" || typeof input === "boolean") return String(input);
  if (typeof input === "object") {
    const any = input as any;
    if (typeof any.message === "string") return any.message;
    if (Array.isArray(any)) return any.map((v) => normalizeMessage(v, fallback)).filter(Boolean).join(" • ");
    try { return JSON.stringify(any); } catch { return fallback; }
  }
  try { return String(input); } catch { return fallback; }
}
