// src/schemas/order.schemas.ts
import { z } from "zod"

export const ZOrderItem = z.object({
  productId: z.string(),
  name: z.string(),
  imageUrl: z.string().nullable().optional(),
  unitPrice: z.number(),
  quantity: z.number().int().positive(),
  discountPercent: z.number().min(0).max(100).nullable().optional(),
  lineTotal: z.number(),
})
export type OrderItem = z.infer<typeof ZOrderItem>

export const ZOrder = z.object({
  _id: z.string(),
  userId: z.string().optional(),
  email: z.string().email().nullable().optional(),
  items: z.array(ZOrderItem),
  subtotal: z.number(),
  total: z.number(),
  currency: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  createdAt: z.string().datetime().nullable().optional(),
  updatedAt: z.string().datetime().nullable().optional(),
})
export type Order = z.infer<typeof ZOrder>

export const ZCreateOrderPayload = z.object({
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).min(1),
  currency: z.string().nullable().optional(),
})
export type CreateOrderPayload = z.infer<typeof ZCreateOrderPayload>

export const ZUpdateOrderPayload = z.object({
  status: z.string(),
})
export type UpdateOrderPayload = z.infer<typeof ZUpdateOrderPayload>

export const ZPaginatedOrders = z.object({
  items: z.array(ZOrder),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(100),
})
export type PaginatedOrders = z.infer<typeof ZPaginatedOrders>
