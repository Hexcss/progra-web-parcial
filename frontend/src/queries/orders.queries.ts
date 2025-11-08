// src/queries/orders.queries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { OrdersAPI, type OrderListParams } from "../backend/apis/orders.api"
import { unwrapApiCall } from "../utils/functions/unwrap-api-call.function"
import type { CreateOrderPayload, Order, PaginatedOrders, UpdateOrderPayload } from "../schemas/order.schemas"

export const ordersKey = {
    root: ["orders"] as const,
    mine: (p?: OrderListParams) => [...ordersKey.root, "mine", p ?? {}] as const,
    all: (p?: OrderListParams) => [...ordersKey.root, "all", p ?? {}] as const,
    byId: (id: string) => [...ordersKey.root, "id", id] as const,
}

export function useMyOrdersQuery(params: OrderListParams = {}) {
    return useQuery<PaginatedOrders>({
        queryKey: ordersKey.mine(params),
        queryFn: async () => unwrapApiCall(await OrdersAPI.listMine(params)),
    })
}

export function useAllOrdersQuery(params: OrderListParams = {}) {
    return useQuery<PaginatedOrders>({
        queryKey: ordersKey.all(params),
        queryFn: async () => unwrapApiCall(await OrdersAPI.listAll(params)),
    })
}

export function useOrderByIdQuery(id?: string) {
    return useQuery<Order>({
        queryKey: id ? ordersKey.byId(id) : ordersKey.byId(""),
        queryFn: async () => unwrapApiCall(await OrdersAPI.getById(id!)),
        enabled: !!id,
    })
}

export function useCreateOrderMutation() {
    const qc = useQueryClient()
    return useMutation<Order, Error, CreateOrderPayload>({
        mutationFn: async (input) => unwrapApiCall(await OrdersAPI.create(input)),
        onSuccess: (order) => {
            qc.invalidateQueries({ queryKey: ordersKey.mine({}) })
            qc.invalidateQueries({ queryKey: ordersKey.byId(order._id) })
        },
    })
}

export function useUpdateOrderStatusMutation(id: string) {
    const qc = useQueryClient()
    return useMutation<Order, Error, UpdateOrderPayload>({
        mutationFn: async (input) => unwrapApiCall(await OrdersAPI.updateStatus(id, input)),
        onSuccess: (order) => {
            qc.invalidateQueries({ queryKey: ordersKey.byId(id) })
            qc.invalidateQueries({ queryKey: ordersKey.all({}) })
            qc.invalidateQueries({ queryKey: ordersKey.mine({}) })
        },
    })
}
