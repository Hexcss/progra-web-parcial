// src/backend/apis/orders.api.ts
import { z } from "zod"
import { baseClient } from "../clients/base.client"
import { safeApiCall, type SafeApiResult } from "../../utils/functions/safe-api-call.function"
import {
    ZOrder,
    ZCreateOrderPayload,
    ZUpdateOrderPayload,
    ZPaginatedOrders,
    type Order,
    type CreateOrderPayload,
    type UpdateOrderPayload,
    type PaginatedOrders,
} from "../../schemas/order.schemas"

const ZListParams = z.object({
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
})
export type OrderListParams = z.infer<typeof ZListParams>

function normalizeItems<T extends z.ZodTypeAny>(payload: any, itemSchema: T) {
    const candidate = payload?.items ?? payload?.data ?? payload
    if (Array.isArray(candidate)) return z.array(itemSchema).parse(candidate)
    if (candidate && typeof candidate === "object") return z.array(itemSchema).parse(Object.values(candidate))
    return z.array(itemSchema).parse([])
}

export const OrdersAPI = {
    async create(input: CreateOrderPayload): Promise<SafeApiResult<Order>> {
        const parsed = ZCreateOrderPayload.safeParse(input)
        if (!parsed.success) {
            const m = parsed.error.issues[0]?.message ?? "Datos inválidos"
            return { success: false, message: m, status: null, data: null }
        }
        return safeApiCall(async () => {
            const res = await baseClient.post("/orders", parsed.data, { withCredentials: true })
            return ZOrder.parse(res.data)
        })
    },

    async listMine(params: OrderListParams = {}): Promise<SafeApiResult<PaginatedOrders>> {
        const parsed = ZListParams.safeParse(params)
        if (!parsed.success) {
            const m = parsed.error.issues[0]?.message ?? "Parámetros inválidos"
            return { success: false, message: m, status: null, data: null }
        }
        return safeApiCall(async () => {
            const res = await baseClient.get("/orders/my", { params: parsed.data, withCredentials: true })
            const items = normalizeItems(res.data, ZOrder)
            const total = typeof res.data?.total === "number" ? res.data.total : items.length
            const page = typeof res.data?.page === "number" ? res.data.page : parsed.data.page ?? 1
            const limit = typeof res.data?.limit === "number" ? res.data.limit : parsed.data.limit ?? (items.length || 10)
            return ZPaginatedOrders.parse({ items, total, page, limit })
        })
    },

    async listAll(params: OrderListParams = {}): Promise<SafeApiResult<PaginatedOrders>> {
        const parsed = ZListParams.safeParse(params)
        if (!parsed.success) {
            const m = parsed.error.issues[0]?.message ?? "Parámetros inválidos"
            return { success: false, message: m, status: null, data: null }
        }
        return safeApiCall(async () => {
            const res = await baseClient.get("/orders", { params: parsed.data, withCredentials: true })
            const items = normalizeItems(res.data, ZOrder)
            const total = typeof res.data?.total === "number" ? res.data.total : items.length
            const page = typeof res.data?.page === "number" ? res.data.page : parsed.data.page ?? 1
            const limit = typeof res.data?.limit === "number" ? res.data.limit : parsed.data.limit ?? (items.length || 10)
            return ZPaginatedOrders.parse({ items, total, page, limit })
        })
    },

    async getById(id: string): Promise<SafeApiResult<Order>> {
        return safeApiCall(async () => {
            const res = await baseClient.get(`/orders/${encodeURIComponent(id)}`, { withCredentials: true })
            return ZOrder.parse(res.data)
        })
    },

    async updateStatus(id: string, input: UpdateOrderPayload): Promise<SafeApiResult<Order>> {
        const parsed = ZUpdateOrderPayload.safeParse(input)
        if (!parsed.success) {
            const m = parsed.error.issues[0]?.message ?? "Datos inválidos"
            return { success: false, message: m, status: null, data: null }
        }
        return safeApiCall(async () => {
            const res = await baseClient.put(`/orders/${encodeURIComponent(id)}`, parsed.data, { withCredentials: true })
            return ZOrder.parse(res.data)
        })
    },
}
