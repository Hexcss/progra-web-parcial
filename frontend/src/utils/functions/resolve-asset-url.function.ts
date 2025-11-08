import { env } from "../../config/env";

export function resolveAssetUrl(src?: string | null): string {
  if (!src) return "";
  if (/^(data:|blob:|https?:\/\/)/i.test(src)) return src;
  const base = (env.API_URL || "").replace(/\/+$/, "");
  const path = String(src).replace(/^\/+/, "");
  return base ? `${base}/${path}` : `/${path}`;
}
