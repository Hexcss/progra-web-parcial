// src/backend/apis/orders.api.ts
import { z } from "zod"
import { graphqlRequest } from "../clients/graphql.client"
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

const ORDER_FIELDS = `
  _id
  userId
  email
  items {
    productId
    name
    imageUrl
    unitPrice
    quantity
    discountPercent
    lineTotal
  }
  subtotal
  total
  currency
  status
  createdAt
  updatedAt
`

const CREATE_MUTATION = `
  mutation CreateOrder($input: CreateOrderDto!) {
    createOrder(input: $input) {
      ${ORDER_FIELDS}
    }
  }
`

const MY_ORDERS_QUERY = `
  query MyOrders($limit: Int, $page: Int) {
    myOrders(limit: $limit, page: $page) {
      items { ${ORDER_FIELDS} }
      total
      page
      limit
    }
  }
`

const ORDERS_QUERY = `
  query Orders($limit: Int, $page: Int) {
    orders(limit: $limit, page: $page) {
      items { ${ORDER_FIELDS} }
      total
      page
      limit
    }
  }
`

const GET_QUERY = `
  query Order($id: String!) {
    order(id: $id) {
      ${ORDER_FIELDS}
    }
  }
`

const UPDATE_MUTATION = `
  mutation UpdateOrderStatus($id: String!, $input: UpdateOrderDto!) {
    updateOrderStatus(id: $id, input: $input) {
      ${ORDER_FIELDS}
    }
  }
`

export const OrdersAPI = {
    async create(input: CreateOrderPayload): Promise<SafeApiResult<Order>> {
        const parsed = ZCreateOrderPayload.safeParse(input)
        if (!parsed.success) {
            const m = parsed.error.issues[0]?.message ?? "Datos inválidos"
            return { success: false, message: m, status: null, data: null }
        }
        return safeApiCall(async () => {
            const data = await graphqlRequest<{ createOrder: Order }>(CREATE_MUTATION, { input: parsed.data })
            return ZOrder.parse(data.createOrder)
        })
    },

    async listMine(params: OrderListParams = {}): Promise<SafeApiResult<PaginatedOrders>> {
        const parsed = ZListParams.safeParse(params)
        if (!parsed.success) {
            const m = parsed.error.issues[0]?.message ?? "Parámetros inválidos"
            return { success: false, message: m, status: null, data: null }
        }
        return safeApiCall(async () => {
            const data = await graphqlRequest<{ myOrders: PaginatedOrders }>(MY_ORDERS_QUERY, parsed.data)
            const items = normalizeItems(data.myOrders, ZOrder)
            const total = typeof data.myOrders?.total === "number" ? data.myOrders.total : items.length
            const page = typeof data.myOrders?.page === "number" ? data.myOrders.page : parsed.data.page ?? 1
            const limit = typeof data.myOrders?.limit === "number" ? data.myOrders.limit : parsed.data.limit ?? (items.length || 10)
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
            const data = await graphqlRequest<{ orders: PaginatedOrders }>(ORDERS_QUERY, parsed.data)
            const items = normalizeItems(data.orders, ZOrder)
            const total = typeof data.orders?.total === "number" ? data.orders.total : items.length
            const page = typeof data.orders?.page === "number" ? data.orders.page : parsed.data.page ?? 1
            const limit = typeof data.orders?.limit === "number" ? data.orders.limit : parsed.data.limit ?? (items.length || 10)
            return ZPaginatedOrders.parse({ items, total, page, limit })
        })
    },

    async getById(id: string): Promise<SafeApiResult<Order>> {
        return safeApiCall(async () => {
            const data = await graphqlRequest<{ order: Order }>(GET_QUERY, { id })
            return ZOrder.parse(data.order)
        })
    },

    async updateStatus(id: string, input: UpdateOrderPayload): Promise<SafeApiResult<Order>> {
        const parsed = ZUpdateOrderPayload.safeParse(input)
        if (!parsed.success) {
            const m = parsed.error.issues[0]?.message ?? "Datos inválidos"
            return { success: false, message: m, status: null, data: null }
        }
        return safeApiCall(async () => {
            const data = await graphqlRequest<{ updateOrderStatus: Order }>(UPDATE_MUTATION, { id, input: parsed.data })
            return ZOrder.parse(data.updateOrderStatus)
        })
    },
}
