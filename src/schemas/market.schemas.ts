// src/schemas/market.schemas.ts
import { z } from "zod"

export const ZActiveDiscount = z.object({
  discountPercent: z.number().min(0).max(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
})
export type ActiveDiscount = z.infer<typeof ZActiveDiscount>

export const ZProductBase = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  imageUrl: z.string().url().optional(),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  createdBy: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type ProductBase = z.infer<typeof ZProductBase>

export const ZProductEnriched = ZProductBase.extend({
  avgRating: z.number().min(0).max(5).nullable().optional(),
  reviewCount: z.number().int().nonnegative().optional(),
  activeDiscount: ZActiveDiscount.nullable().optional(),
})
export type ProductEnriched = z.infer<typeof ZProductEnriched>

export const ZCreateProductPayload = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  imageUrl: z.string().url().optional(),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
})
export type CreateProductPayload = z.infer<typeof ZCreateProductPayload>

export const ZUpdateProductPayload = ZCreateProductPayload.partial()
export type UpdateProductPayload = z.infer<typeof ZUpdateProductPayload>

export const ZCategory = z.object({
  _id: z.string(),
  name: z.string(),
  icon: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type Category = z.infer<typeof ZCategory>

export const ZCategoryWithCount = ZCategory.extend({
  productCount: z.number().int().nonnegative(),
})
export type CategoryWithCount = z.infer<typeof ZCategoryWithCount>

export const ZReview = z.object({
  _id: z.string(),
  productId: z.string(),
  userId: z.string(),
  score: z.number().min(1).max(5),
  comment: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type Review = z.infer<typeof ZReview>

export const ZCreateReviewPayload = z.object({
  productId: z.string(),
  score: z.number().min(1).max(5),
  comment: z.string().optional(),
})
export type CreateReviewPayload = z.infer<typeof ZCreateReviewPayload>

export const ZUpdateReviewPayload = ZCreateReviewPayload.partial()
export type UpdateReviewPayload = z.infer<typeof ZUpdateReviewPayload>

export const ZDiscount = z.object({
  _id: z.string(),
  productId: z.string(),
  discountPercent: z.number().min(0).max(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type Discount = z.infer<typeof ZDiscount>

export const ZCreateDiscountPayload = z.object({
  productId: z.string(),
  discountPercent: z.number().min(0).max(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
})
export type CreateDiscountPayload = z.infer<typeof ZCreateDiscountPayload>

export const ZUpdateDiscountPayload = ZCreateDiscountPayload.partial()
export type UpdateDiscountPayload = z.infer<typeof ZUpdateDiscountPayload>

export const ZPaginatedProducts = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  items: z.array(ZProductEnriched),
})
export type PaginatedProducts = z.infer<typeof ZPaginatedProducts>

export const ZProductDetail = ZProductEnriched
export type ProductDetail = z.infer<typeof ZProductDetail>

export const ZSearchParams = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
})
export type SearchParams = z.infer<typeof ZSearchParams>
