// src/backend/apis/product.api.ts
import { z } from "zod"
import { baseClient } from "../clients/base.client"
import { safeApiCall, type SafeApiResult } from "../../utils/functions/safe-api-call.function"
import {
  ZCreateProductPayload,
  ZUpdateProductPayload,
  ZPaginatedProducts,
  ZProductDetail,
  type CreateProductPayload,
  type UpdateProductPayload,
  type PaginatedProducts,
  type ProductDetail,
} from "../../schemas/market.schemas"

export type ProductListParams = {
  q?: string
  category?: string
  categoryId?: string
  limit?: number
  page?: number
  tags?: string[]
  minPrice?: number
  maxPrice?: number
  sort?: "new" | "priceAsc" | "priceDesc" | "rating"
}

const ZListParams = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  page: z.number().int().min(1).optional(),
  tags: z.array(z.string()).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  sort: z.enum(["new", "priceAsc", "priceDesc", "rating"]).optional(),
})

export const ProductsAPI = {
  async list(params: ProductListParams = {}): Promise<SafeApiResult<PaginatedProducts>> {
    const parsed = ZListParams.safeParse(params)
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Parámetros inválidos"
      return { success: false, message: m, status: null, data: null }
    }
    return safeApiCall(async () => {
      const res = await baseClient.get("/products", { params: parsed.data, withCredentials: true })
      return ZPaginatedProducts.parse(res.data)
    })
  },

  async getById(id: string): Promise<SafeApiResult<ProductDetail>> {
    return safeApiCall(async () => {
      const res = await baseClient.get(`/products/${encodeURIComponent(id)}`, { withCredentials: true })
      return ZProductDetail.parse(res.data)
    })
  },

  async top(limit = 10): Promise<SafeApiResult<ProductDetail[]>> {
    return safeApiCall(async () => {
      const res = await baseClient.get("/products/top", { params: { limit }, withCredentials: true })
      return z.array(ZProductDetail).parse(res.data)
    })
  },

  async create(input: CreateProductPayload): Promise<SafeApiResult<ProductDetail>> {
    const parsed = ZCreateProductPayload.safeParse(input)
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos"
      return { success: false, message: m, status: null, data: null }
    }
    return safeApiCall(async () => {
      const res = await baseClient.post("/products", parsed.data, { withCredentials: true })
      return ZProductDetail.parse(res.data)
    })
  },

  async update(id: string, input: UpdateProductPayload): Promise<SafeApiResult<ProductDetail>> {
    const parsed = ZUpdateProductPayload.safeParse(input)
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos"
      return { success: false, message: m, status: null, data: null }
    }
    return safeApiCall(async () => {
      const res = await baseClient.put(`/products/${encodeURIComponent(id)}`, parsed.data, { withCredentials: true })
      return ZProductDetail.parse(res.data)
    })
  },

  async remove(id: string): Promise<SafeApiResult<{ success: boolean }>> {
    return safeApiCall(async () => {
      const res = await baseClient.delete(`/products/${encodeURIComponent(id)}`, { withCredentials: true })
      return res.data
    })
  },
}
