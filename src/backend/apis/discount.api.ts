import { z } from "zod"
import { baseClient } from "../clients/base.client"
import { safeApiCall, type SafeApiResult } from "../../utils/functions/safe-api-call.function"
import {
  ZDiscount,
  ZCreateDiscountPayload,
  ZUpdateDiscountPayload,
  type Discount,
  type CreateDiscountPayload,
  type UpdateDiscountPayload,
} from "../../schemas/market.schemas"

const ZListParams = z.object({
  productId: z.string().optional(),
  activeOnly: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  page: z.number().int().min(1).optional(),
})

export type DiscountListParams = z.infer<typeof ZListParams>

export type PaginatedDiscounts = {
  items: Discount[]
  total: number
  page: number
  limit: number
}

export const DiscountsAPI = {
  async list(params: DiscountListParams = {}): Promise<SafeApiResult<PaginatedDiscounts>> {
    const parsed = ZListParams.safeParse(params)
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Parámetros inválidos"
      return { success: false, message: m, status: null, data: null }
    }
    return safeApiCall(async () => {
      const res = await baseClient.get("/discounts", { params: parsed.data, withCredentials: true })
      const items = z.array(ZDiscount).parse(res.data.items)
      return { items, total: res.data.total, page: res.data.page, limit: res.data.limit }
    })
  },

  async getById(id: string): Promise<SafeApiResult<Discount>> {
    return safeApiCall(async () => {
      const res = await baseClient.get(`/discounts/${encodeURIComponent(id)}`, { withCredentials: true })
      return ZDiscount.parse(res.data)
    })
  },

  async create(input: CreateDiscountPayload): Promise<SafeApiResult<Discount>> {
    const parsed = ZCreateDiscountPayload.safeParse(input)
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos"
      return { success: false, message: m, status: null, data: null }
    }
    return safeApiCall(async () => {
      const res = await baseClient.post("/discounts", parsed.data, { withCredentials: true })
      return ZDiscount.parse(res.data)
    })
  },

  async update(id: string, input: UpdateDiscountPayload): Promise<SafeApiResult<Discount>> {
    const parsed = ZUpdateDiscountPayload.safeParse(input)
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos"
      return { success: false, message: m, status: null, data: null }
    }
    return safeApiCall(async () => {
      const res = await baseClient.put(`/discounts/${encodeURIComponent(id)}`, parsed.data, { withCredentials: true })
      return ZDiscount.parse(res.data)
    })
  },

  async remove(id: string): Promise<SafeApiResult<{ success: boolean }>> {
    return safeApiCall(async () => {
      const res = await baseClient.delete(`/discounts/${encodeURIComponent(id)}`, { withCredentials: true })
      return res.data
    })
  },
}
