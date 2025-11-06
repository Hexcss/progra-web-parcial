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

const ZListParams = z.object({
    productId: z.string().optional(),
    userId: z.string().optional(),
    limit: z.number().int().min(1).max(100).optional(),
    page: z.number().int().min(1).optional(),
})

export type ReviewListParams = z.infer<typeof ZListParams>

export type PaginatedReviews = {
    items: Review[]
    total: number
    page: number
    limit: number
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
            const items = z.array(ZReview).parse(res.data.items)
            return { items, total: res.data.total, page: res.data.page, limit: res.data.limit }
        })
    },

    async getById(id: string): Promise<SafeApiResult<Review>> {
        return safeApiCall(async () => {
            const res = await baseClient.get(`/reviews/${encodeURIComponent(id)}`, { withCredentials: true })
            return ZReview.parse(res.data)
        })
    },

    async create(input: CreateReviewPayload): Promise<SafeApiResult<Review>> {
        const parsed = ZCreateReviewPayload.safeParse(input)
        if (!parsed.success) {
            const m = parsed.error.issues[0]?.message ?? "Datos inválidos"
            return { success: false, message: m, status: null, data: null }
        }
        return safeApiCall(async () => {
            const res = await baseClient.post("/reviews", parsed.data, { withCredentials: true })
            return ZReview.parse(res.data)
        })
    },

    async update(id: string, input: UpdateReviewPayload): Promise<SafeApiResult<Review>> {
        const parsed = ZUpdateReviewPayload.safeParse(input)
        if (!parsed.success) {
            const m = parsed.error.issues[0]?.message ?? "Datos inválidos"
            return { success: false, message: m, status: null, data: null }
        }
        return safeApiCall(async () => {
            const res = await baseClient.put(`/reviews/${encodeURIComponent(id)}`, parsed.data, { withCredentials: true })
            return ZReview.parse(res.data)
        })
    },

    async remove(id: string): Promise<SafeApiResult<{ success: boolean }>> {
        return safeApiCall(async () => {
            const res = await baseClient.delete(`/reviews/${encodeURIComponent(id)}`, { withCredentials: true })
            return res.data
        })
    },
}
