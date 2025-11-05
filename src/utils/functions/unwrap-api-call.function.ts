import type { SafeApiResult } from "./safe-api-call.function";

/**
 * Unwraps a SafeApiResult, throwing an Error if !success.
 * Lets React Query properly handle error states.
 */
export function unwrapApiCall<T>(res: SafeApiResult<T>): T {
  if (!res.success) {
    const err = new Error(res.message || "Unknown API error");
    (err as any).status = res.status;
    throw err;
  }
  return res.data as T;
}
