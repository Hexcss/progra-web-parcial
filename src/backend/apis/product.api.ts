// src/backend/apis/product.api.ts
import { z } from "zod"
import { graphqlRequest } from "../clients/graphql.client"
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

const PRODUCT_FIELDS = `
  _id
  name
  description
  price
  stock
  imageUrl
  category
  categoryId
  tags
  createdBy
  createdAt
  updatedAt
  avgRating
  reviewCount
  activeDiscount {
    discountPercent
    startDate
    endDate
  }
`

const LIST_QUERY = `
  query Products($q: String, $category: String, $categoryId: String, $limit: Int, $page: Int, $tags: [String!], $minPrice: Float, $maxPrice: Float, $sort: String) {
    products(q: $q, category: $category, categoryId: $categoryId, limit: $limit, page: $page, tags: $tags, minPrice: $minPrice, maxPrice: $maxPrice, sort: $sort) {
      total
      page
      limit
      items {
        ${PRODUCT_FIELDS}
      }
    }
  }
`

const GET_QUERY = `
  query Product($id: String!) {
    product(id: $id) {
      ${PRODUCT_FIELDS}
    }
  }
`

const TOP_QUERY = `
  query TopProducts($limit: Int) {
    topProducts(limit: $limit) {
      ${PRODUCT_FIELDS}
    }
  }
`

const CREATE_MUTATION = `
  mutation CreateProduct($input: CreateProductDto!) {
    createProduct(input: $input) {
      ${PRODUCT_FIELDS}
    }
  }
`

const UPDATE_MUTATION = `
  mutation UpdateProduct($id: String!, $input: UpdateProductDto!) {
    updateProduct(id: $id, input: $input) {
      ${PRODUCT_FIELDS}
    }
  }
`

const REMOVE_MUTATION = `
  mutation RemoveProduct($id: String!) {
    removeProduct(id: $id) {
      success
    }
  }
`

export const ProductsAPI = {
  async list(params: ProductListParams = {}): Promise<SafeApiResult<PaginatedProducts>> {
    const parsed = ZListParams.safeParse(params)
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Parámetros inválidos"
      return { success: false, message: m, status: null, data: null }
    }
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ products: PaginatedProducts }>(LIST_QUERY, parsed.data)
      return ZPaginatedProducts.parse(data.products)
    })
  },

  async getById(id: string): Promise<SafeApiResult<ProductDetail>> {
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ product: ProductDetail }>(GET_QUERY, { id })
      return ZProductDetail.parse(data.product)
    })
  },

  async top(limit = 10): Promise<SafeApiResult<ProductDetail[]>> {
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ topProducts: ProductDetail[] }>(TOP_QUERY, { limit })
      return z.array(ZProductDetail).parse(data.topProducts)
    })
  },

  async create(input: CreateProductPayload): Promise<SafeApiResult<ProductDetail>> {
    const parsed = ZCreateProductPayload.safeParse(input)
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos"
      return { success: false, message: m, status: null, data: null }
    }
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ createProduct: ProductDetail }>(CREATE_MUTATION, { input: parsed.data })
      return ZProductDetail.parse(data.createProduct)
    })
  },

  async update(id: string, input: UpdateProductPayload): Promise<SafeApiResult<ProductDetail>> {
    const parsed = ZUpdateProductPayload.safeParse(input)
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos"
      return { success: false, message: m, status: null, data: null }
    }
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ updateProduct: ProductDetail }>(UPDATE_MUTATION, { id, input: parsed.data })
      return ZProductDetail.parse(data.updateProduct)
    })
  },

  async remove(id: string): Promise<SafeApiResult<{ success: boolean }>> {
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ removeProduct: { success: boolean } }>(REMOVE_MUTATION, { id })
      return data.removeProduct
    })
  },
}
