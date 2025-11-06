// src/utils/functions/safe-api-call.function.ts
import type { AxiosResponse } from "axios"
import { normalizeMessage } from "./mormalize-message.function"

export interface SafeApiResult<T = any> {
  success: boolean
  status: number | null
  data: T | null
  message: string
  error?: any
}

function isAxiosResponse<T>(res: any): res is AxiosResponse<T> {
  return res && typeof res === "object" && "data" in res && "status" in res
}

function isSafeApiResult<T>(res: any): res is SafeApiResult<T> {
  return res && typeof res === "object" && "success" in res && ("data" in res || "message" in res)
}

export async function safeApiCall<T>(
  fn: () => Promise<AxiosResponse<T> | T | SafeApiResult<T>>,
  context?: string
): Promise<SafeApiResult<T>> {
  try {
    const res = await fn()

    if (isSafeApiResult<T>(res)) {
      return res
    }

    if (isAxiosResponse<T>(res)) {
      return {
        success: true,
        status: res.status ?? 200,
        data: res.data ?? null,
        message: "ok",
      }
    }

    return {
      success: true,
      status: 200,
      data: (res ?? null) as T | null,
      message: "ok",
    }
  } catch (error: any) {
    const status = error?.response?.status ?? (error?.request ? 0 : null)
    const raw =
      error?.response?.data?.message ??
      error?.response?.data?.error ??
      error?.response?.data ??
      error?.message ??
      "Unknown error occurred"
    const message =
      status === 0
        ? "Network error or CORS issue — check your connection."
        : normalizeMessage(raw, "Unknown error occurred")

    if (import.meta.env.DEV) {
      console.error("[safeApiCall] Caught error:", { context, status, message, error })
    }

    return {
      success: false,
      status,
      data: null,
      message,
      error,
    }
  }
}
