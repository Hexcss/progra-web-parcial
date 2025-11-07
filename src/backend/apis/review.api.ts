// src/backend/apis/review.api.ts
import { z } from "zod"
import { baseClient } from "../clients/base.client"
import { safeApiCall, type SafeApiResult } from "../../utils/functions/safe-api-call.function"
import {
  ZReview,
  ZCreateReviewPayload,
  ZUpdateReviewPayload,
  type Review,
  type CreateReviewPayload,
  type UpdateReviewPayload,
} from "../../schemas/market.schemas"

const ZPublicUser = z
  .object({
    _id: z.string().optional(),
    displayName: z.string().optional(),
    email: z.string().email().optional(),
    avatarUrl: z.string().url().optional(),
  })
  .partial()

export const ZReviewEnriched = ZReview.extend({
  user: ZPublicUser.nullable().optional(),
})

export type ReviewEnriched = z.infer<typeof ZReviewEnriched>

const ZListParams = z.object({
  productId: z.string().optional(),
  userId: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  page: z.number().int().min(1).optional(),
})

export type ReviewListParams = z.infer<typeof ZListParams>

export type PaginatedReviews = {
  items: ReviewEnriched[]
  total: number
  page: number
  limit: number
}

function normalizeItems(payload: any): ReviewEnriched[] {
  const candidate =
    payload?.items !== undefined ? payload.items :
    payload?.data !== undefined ? payload.data :
    payload

  if (Array.isArray(candidate)) {
    return z.array(ZReviewEnriched).parse(candidate)
  }

  if (candidate && typeof candidate === "object") {
    const vals = Object.values(candidate as Record<string, unknown>)
    return z.array(ZReviewEnriched).parse(vals)
  }

  return z.array(ZReviewEnriched).parse([] as Review[])
}

export const ReviewsAPI = {
  async list(params: ReviewListParams = {}): Promise<SafeApiResult<PaginatedReviews>> {
    const parsed = ZListParams.safeParse(params)
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Parámetros inválidos"
      return { success: false, message: m, status: null, data: null }
    }
    return safeApiCall(async () => {
      const res = await baseClient.get("/reviews", { params: parsed.data, withCredentials: true })
      const items = normalizeItems(res.data)
      const total =
        typeof res.data?.total === "number" ? res.data.total : items.length
      const page =
        typeof res.data?.page === "number" ? res.data.page : (parsed.data.page ?? 1)
      const limit =
        typeof res.data?.limit === "number" ? res.data.limit : (parsed.data.limit ?? (items.length || 10))
      return { items, total, page, limit }
    })
  },

  async getById(id: string): Promise<SafeApiResult<ReviewEnriched>> {
    return safeApiCall(async () => {
      const res = await baseClient.get(`/reviews/${encodeURIComponent(id)}`, { withCredentials: true })
      return ZReviewEnriched.parse(res.data)
    })
  },

  async create(input: CreateReviewPayload): Promise<SafeApiResult<ReviewEnriched>> {
    const parsed = ZCreateReviewPayload.safeParse(input)
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos"
      return { success: false, message: m, status: null, data: null }
    }
    return safeApiCall(async () => {
      const res = await baseClient.post("/reviews", parsed.data, { withCredentials: true })
      return ZReviewEnriched.parse(res.data)
    })
  },

  async update(id: string, input: UpdateReviewPayload): Promise<SafeApiResult<ReviewEnriched>> {
    const parsed = ZUpdateReviewPayload.safeParse(input)
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos"
      return { success: false, message: m, status: null, data: null }
    }
    return safeApiCall(async () => {
      const res = await baseClient.put(`/reviews/${encodeURIComponent(id)}`, parsed.data, { withCredentials: true })
      return ZReviewEnriched.parse(res.data)
    })
  },

  async remove(id: string): Promise<SafeApiResult<{ success: boolean }>> {
    return safeApiCall(async () => {
      const res = await baseClient.delete(`/reviews/${encodeURIComponent(id)}`, { withCredentials: true })
      return res.data
    })
  },
}
