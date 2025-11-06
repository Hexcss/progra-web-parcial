// src/backend/apis/category.api.ts
import { z } from "zod"
import { baseClient } from "../clients/base.client"
import { safeApiCall, type SafeApiResult } from "../../utils/functions/safe-api-call.function"
import {
    ZCategory,
    ZCategoryWithCount,
    type Category,
    type CategoryWithCount,
} from "../../schemas/market.schemas"

const ZCreateCategory = z.object({
    name: z.string().min(1),
    icon: z.string().min(1),
})
const ZUpdateCategory = ZCreateCategory.partial()

export type CreateCategoryInput = z.infer<typeof ZCreateCategory>
export type UpdateCategoryInput = z.infer<typeof ZUpdateCategory>

export const CategoriesAPI = {
    async list(): Promise<SafeApiResult<CategoryWithCount[]>> {
        return safeApiCall(async () => {
            const res = await baseClient.get("/categories", { withCredentials: true })
            return z.array(ZCategoryWithCount).parse(res.data)
        })
    },

    async getById(id: string): Promise<SafeApiResult<CategoryWithCount>> {
        return safeApiCall(async () => {
            const res = await baseClient.get(`/categories/${encodeURIComponent(id)}`, { withCredentials: true })
            return ZCategoryWithCount.parse(res.data)
        })
    },

    async create(input: CreateCategoryInput): Promise<SafeApiResult<Category>> {
        const parsed = ZCreateCategory.safeParse(input)
        if (!parsed.success) {
            const m = parsed.error.issues[0]?.message ?? "Datos inválidos"
            return { success: false, message: m, status: null, data: null }
        }
        return safeApiCall(async () => {
            const res = await baseClient.post("/categories", parsed.data, { withCredentials: true })
            return ZCategory.parse(res.data)
        })
    },

    async update(id: string, input: UpdateCategoryInput): Promise<SafeApiResult<Category>> {
        const parsed = ZUpdateCategory.safeParse(input)
        if (!parsed.success) {
            const m = parsed.error.issues[0]?.message ?? "Datos inválidos"
            return { success: false, message: m, status: null, data: null }
        }
        return safeApiCall(async () => {
            const res = await baseClient.put(`/categories/${encodeURIComponent(id)}`, parsed.data, { withCredentials: true })
            return ZCategory.parse(res.data)
        })
    },

    async remove(id: string): Promise<SafeApiResult<{ success: boolean }>> {
        return safeApiCall(async () => {
            const res = await baseClient.delete(`/categories/${encodeURIComponent(id)}`, { withCredentials: true })
            return res.data
        })
    },
}
