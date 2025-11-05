import type { AxiosResponse } from "axios";
import { normalizeMessage } from "./mormalize-message.function";

export interface SafeApiResult<T = any> {
  success: boolean;
  status: number | null;
  data: T | null;
  message: string;
  error?: any;
}

export async function safeApiCall<T>(
  fn: () => Promise<AxiosResponse<T> | any>,
  context?: string
): Promise<SafeApiResult<T>> {
  try {
    const res = await fn();
    if (res && typeof res === "object" && res.success === false) {
      return res;
    }
    return {
      success: true,
      status: res?.status ?? 200,
      data: res?.data ?? null,
      message: "ok",
    };
  } catch (error: any) {
    const status = error?.response?.status ?? (error?.request ? 0 : null);
    const raw =
      error?.response?.data?.message ??
      error?.response?.data?.error ??
      error?.response?.data ??
      error?.message ??
      "Unknown error occurred";
    const message = status === 0 ? "Network error or CORS issue — check your connection." : normalizeMessage(raw, "Unknown error occurred");
    if (import.meta.env.DEV) {
      console.error("[safeApiCall] Caught error:", { context, status, message, error });
    }
    return {
      success: false,
      status,
      data: null,
      message,
      error,
    };
  }
}
