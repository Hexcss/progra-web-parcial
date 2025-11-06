// src/queries/discounts.queries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { DiscountsAPI, type DiscountListParams } from "../backend/apis/discount.api"
import { unwrapApiCall } from "../utils/functions/unwrap-api-call.function"
import type { Discount, CreateDiscountPayload, UpdateDiscountPayload } from "../schemas/market.schemas"
import { productsKey } from "./products.queries"

export const discountsKey = {
    root: ["discounts"] as const,
    list: (params: DiscountListParams = {}) => [...discountsKey.root, "list", params] as const,
    byId: (id: string) => [...discountsKey.root, id] as const,
}

export type PaginatedDiscounts = {
    items: Discount[]
    total: number
    page: number
    limit: number
}

export function useDiscountsQuery(params: DiscountListParams = {}) {
    return useQuery<PaginatedDiscounts>({
        queryKey: discountsKey.list(params),
        queryFn: async () => unwrapApiCall(await DiscountsAPI.list(params)),
    })
}

export function useDiscountQuery(id?: string) {
    return useQuery<Discount>({
        queryKey: id ? discountsKey.byId(id) : discountsKey.byId(""),
        queryFn: async () => unwrapApiCall(await DiscountsAPI.getById(id!)),
        enabled: !!id,
    })
}

export function useCreateDiscount(productId?: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (input: CreateDiscountPayload) => unwrapApiCall(await DiscountsAPI.create(input)),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: discountsKey.root })
            if (productId) {
                qc.invalidateQueries({ queryKey: productsKey.byId(productId) })
            }
        },
    })
}

export function useUpdateDiscount(id: string, productId?: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (input: UpdateDiscountPayload) => unwrapApiCall(await DiscountsAPI.update(id, input)),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: discountsKey.byId(id) })
            qc.invalidateQueries({ queryKey: discountsKey.root })
            if (productId) {
                qc.invalidateQueries({ queryKey: productsKey.byId(productId) })
            }
        },
    })
}

export function useDeleteDiscount(productId?: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => unwrapApiCall(await DiscountsAPI.remove(id)),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: discountsKey.root })
            if (productId) {
                qc.invalidateQueries({ queryKey: productsKey.byId(productId) })
            }
        },
    })
}
