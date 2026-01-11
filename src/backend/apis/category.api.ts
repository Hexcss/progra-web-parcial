// src/backend/apis/category.api.ts
import { z } from "zod"
import { graphqlRequest } from "../clients/graphql.client"
import { safeApiCall, type SafeApiResult } from "../../utils/functions/safe-api-call.function"
import {
  ZCategory,
  ZCategoryEnriched,
  type Category,
  type CategoryEnriched,
} from "../../schemas/market.schemas"

const ZCreateCategory = z.object({
  name: z.string().min(1),
  icon: z.string().min(1),
})
const ZUpdateCategory = ZCreateCategory.partial()
const ZCategoryThumbnail = z.object({
  categoryId: z.string(),
  thumbnail: z.string().nullable(),
})

export type CreateCategoryInput = z.infer<typeof ZCreateCategory>
export type UpdateCategoryInput = z.infer<typeof ZUpdateCategory>
export type CategoryThumbnail = z.infer<typeof ZCategoryThumbnail>

const CATEGORY_FIELDS = `
  _id
  name
  icon
  createdAt
  updatedAt
  productCount
  thumbnail
`

const LIST_QUERY = `
  query Categories {
    categories {
      ${CATEGORY_FIELDS}
    }
  }
`

const GET_QUERY = `
  query Category($id: String!) {
    category(id: $id) {
      ${CATEGORY_FIELDS}
    }
  }
`

const THUMB_QUERY = `
  query CategoryThumbnail($id: String!) {
    categoryThumbnail(id: $id) {
      categoryId
      thumbnail
    }
  }
`

const CREATE_MUTATION = `
  mutation CreateCategory($input: CreateCategoryDto!) {
    createCategory(input: $input) {
      _id
      name
      icon
      createdAt
      updatedAt
    }
  }
`

const UPDATE_MUTATION = `
  mutation UpdateCategory($id: String!, $input: UpdateCategoryDto!) {
    updateCategory(id: $id, input: $input) {
      _id
      name
      icon
      createdAt
      updatedAt
    }
  }
`

const REMOVE_MUTATION = `
  mutation RemoveCategory($id: String!) {
    removeCategory(id: $id) {
      success
    }
  }
`

export const CategoriesAPI = {
  async list(): Promise<SafeApiResult<CategoryEnriched[]>> {
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ categories: CategoryEnriched[] }>(LIST_QUERY)
      return z.array(ZCategoryEnriched).parse(data.categories)
    })
  },

  async getById(id: string): Promise<SafeApiResult<CategoryEnriched>> {
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ category: CategoryEnriched }>(GET_QUERY, { id })
      return ZCategoryEnriched.parse(data.category)
    })
  },

  async getNewThumbnail(id: string): Promise<SafeApiResult<CategoryThumbnail>> {
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ categoryThumbnail: CategoryThumbnail }>(THUMB_QUERY, { id })
      return ZCategoryThumbnail.parse(data.categoryThumbnail)
    })
  },

  async create(input: CreateCategoryInput): Promise<SafeApiResult<Category>> {
    const parsed = ZCreateCategory.safeParse(input)
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos"
      return { success: false, message: m, status: null, data: null }
    }
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ createCategory: Category }>(CREATE_MUTATION, { input: parsed.data })
      return ZCategory.parse(data.createCategory)
    })
  },

  async update(id: string, input: UpdateCategoryInput): Promise<SafeApiResult<Category>> {
    const parsed = ZUpdateCategory.safeParse(input)
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos"
      return { success: false, message: m, status: null, data: null }
    }
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ updateCategory: Category }>(UPDATE_MUTATION, { id, input: parsed.data })
      return ZCategory.parse(data.updateCategory)
    })
  },

  async remove(id: string): Promise<SafeApiResult<{ success: boolean }>> {
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ removeCategory: { success: boolean } }>(REMOVE_MUTATION, { id })
      return data.removeCategory
    })
  },
}
