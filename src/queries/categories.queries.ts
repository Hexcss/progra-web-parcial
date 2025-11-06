// src/queries/categories.queries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CategoriesAPI, type CreateCategoryInput, type UpdateCategoryInput } from "../backend/apis/category.api"
import { unwrapApiCall } from "../utils/functions/unwrap-api-call.function"
import type { Category, CategoryWithCount } from "../schemas/market.schemas"

export const categoriesKey = {
  root: ["categories"] as const,
  list: () => [...categoriesKey.root, "list"] as const,
  byId: (id: string) => [...categoriesKey.root, id] as const,
}

export function useCategoriesQuery() {
  return useQuery<CategoryWithCount[]>({
    queryKey: categoriesKey.list(),
    queryFn: async () => unwrapApiCall(await CategoriesAPI.list()),
  })
}

export function useCategoryQuery(id?: string) {
  return useQuery<CategoryWithCount>({
    queryKey: id ? categoriesKey.byId(id) : categoriesKey.byId(""),
    queryFn: async () => unwrapApiCall(await CategoriesAPI.getById(id!)),
    enabled: !!id,
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => unwrapApiCall(await CategoriesAPI.create(input)),
    onSuccess: (created: Category) => {
      qc.invalidateQueries({ queryKey: categoriesKey.list() })
      qc.invalidateQueries({ queryKey: categoriesKey.byId(created._id) })
    },
  })
}

export function useUpdateCategory(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateCategoryInput) => unwrapApiCall(await CategoriesAPI.update(id, input)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoriesKey.byId(id) })
      qc.invalidateQueries({ queryKey: categoriesKey.list() })
    },
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => unwrapApiCall(await CategoriesAPI.remove(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoriesKey.list() })
    },
  })
}
