// src/queries/reviews.queries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ReviewsAPI, type ReviewListParams, type PaginatedReviews } from "../backend/apis/review.api"
import { unwrapApiCall } from "../utils/functions/unwrap-api-call.function"
import type { ReviewEnriched } from "../backend/apis/review.api"
import type { CreateReviewPayload, UpdateReviewPayload } from "../schemas/market.schemas"
import { productsKey } from "./products.queries"

export const reviewsKey = {
  root: ["reviews"] as const,
  list: (params: ReviewListParams = {}) => [...reviewsKey.root, "list", params] as const,
  byId: (id: string) => [...reviewsKey.root, id] as const,
  byProduct: (productId: string, page = 1, limit = 10) =>
    [...reviewsKey.root, "product", productId, { page, limit }] as const,
  byUser: (userId: string, page = 1, limit = 10) =>
    [...reviewsKey.root, "user", userId, { page, limit }] as const,
}

export function useReviewsQuery(params: ReviewListParams = {}) {
  return useQuery<PaginatedReviews>({
    queryKey: reviewsKey.list(params),
    queryFn: async () => unwrapApiCall(await ReviewsAPI.list(params)),
  })
}

export function useProductReviewsQuery(productId?: string, page = 1, limit = 10) {
  return useQuery<PaginatedReviews>({
    queryKey: productId ? reviewsKey.byProduct(productId, page, limit) : reviewsKey.byProduct("", page, limit),
    queryFn: async () => unwrapApiCall(await ReviewsAPI.list({ productId: productId!, page, limit })),
    enabled: !!productId,
    staleTime: 30000,
  })
}

export function useUserReviewsQuery(userId?: string, page = 1, limit = 10) {
  return useQuery<PaginatedReviews>({
    queryKey: userId ? reviewsKey.byUser(userId, page, limit) : reviewsKey.byUser("", page, limit),
    queryFn: async () => unwrapApiCall(await ReviewsAPI.list({ userId: userId!, page, limit })),
    enabled: !!userId,
    staleTime: 30000,
  })
}

export function useReviewQuery(id?: string) {
  return useQuery<ReviewEnriched>({
    queryKey: id ? reviewsKey.byId(id) : reviewsKey.byId(""),
    queryFn: async () => unwrapApiCall(await ReviewsAPI.getById(id!)),
    enabled: !!id,
  })
}

export function useCreateReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateReviewPayload) => unwrapApiCall(await ReviewsAPI.create(input)),
    onSuccess: (created: ReviewEnriched) => {
      qc.invalidateQueries({ queryKey: reviewsKey.root })
      if (created?.productId) qc.invalidateQueries({ queryKey: productsKey.byId(created.productId) })
    },
  })
}

export function useUpdateReview(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateReviewPayload) => unwrapApiCall(await ReviewsAPI.update(id, input)),
    onSuccess: (updated: ReviewEnriched) => {
      qc.invalidateQueries({ queryKey: reviewsKey.byId(id) })
      qc.invalidateQueries({ queryKey: reviewsKey.root })
      if (updated?.productId) qc.invalidateQueries({ queryKey: productsKey.byId(updated.productId) })
    },
  })
}

export function useDeleteReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { id: string; productId?: string }) => unwrapApiCall(await ReviewsAPI.remove(vars.id)),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: reviewsKey.root })
      if (vars.productId) qc.invalidateQueries({ queryKey: productsKey.byId(vars.productId) })
    },
  })
}
