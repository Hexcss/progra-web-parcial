import { z } from "zod"
import { baseClient } from "../clients/base.client"
import { safeApiCall, type SafeApiResult } from "../../utils/functions/safe-api-call.function"
import {
  ZReview,
  ZCreateReviewPayload,
  ZUpdateReviewPayload,
  type CreateReviewPayload,
  type UpdateReviewPayload,
} from "../../schemas/market.schemas"

const ZPublicUser = z
  .object({
    _id: z.string().optional(),
    displayName: z.string().optional(),
    email: z.string().email().optional(),
    avatarUrl: z.string().optional(),
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

function extractListPayload(
  body: any,
  fallbackPage?: number,
  fallbackLimit?: number
): PaginatedReviews {
  const root = body && typeof body === "object" && "data" in body ? body.data : body
  const itemsRaw =
    Array.isArray(root?.items) ? root.items :
    Array.isArray(root?.data) ? root.data :
    Array.isArray(root) ? root :
    []

  const items = z.array(ZReviewEnriched).parse(itemsRaw)

  const total =
    typeof root?.total === "number" ? root.total :
    typeof body?.total === "number" ? body.total :
    items.length

  const page =
    typeof root?.page === "number" ? root.page :
    typeof body?.page === "number" ? body.page :
    (fallbackPage ?? 1)

  const limit =
    typeof root?.limit === "number" ? root.limit :
    typeof body?.limit === "number" ? body.limit :
    (fallbackLimit ?? (items.length || 10))

  return { items, total, page, limit }
}

function extractEntity<T extends z.ZodTypeAny>(body: any, schema: T): z.infer<T> {
  const payload = body && typeof body === "object" && "data" in body ? body.data : body
  return schema.parse(payload)
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
      return extractListPayload(res.data, parsed.data.page, parsed.data.limit)
    })
  },

  async getById(id: string): Promise<SafeApiResult<ReviewEnriched>> {
    return safeApiCall(async () => {
      const res = await baseClient.get(`/reviews/${encodeURIComponent(id)}`, { withCredentials: true })
      return extractEntity(res.data, ZReviewEnriched)
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
      return extractEntity(res.data, ZReviewEnriched)
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
      return extractEntity(res.data, ZReviewEnriched)
    })
  },

  async remove(id: string): Promise<SafeApiResult<{ success: boolean }>> {
    return safeApiCall(async () => {
      const res = await baseClient.delete(`/reviews/${encodeURIComponent(id)}`, { withCredentials: true })
      const payload = res.data && typeof res.data === "object" && "data" in res.data ? res.data.data : res.data
      return payload
    })
  },
}
