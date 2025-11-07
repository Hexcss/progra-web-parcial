// src/queries/categories.queries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CategoriesAPI, type CreateCategoryInput, type UpdateCategoryInput, type CategoryThumbnail } from "../backend/apis/category.api"
import { unwrapApiCall } from "../utils/functions/unwrap-api-call.function"
import type { Category, CategoryEnriched } from "../schemas/market.schemas"

export const categoriesKey = {
  root: ["categories"] as const,
  list: () => [...categoriesKey.root, "list"] as const,
  byId: (id: string) => [...categoriesKey.root, id] as const,
  thumbnail: (id: string) => [...categoriesKey.root, id, "thumbnail"] as const,
}

export const categoriesMutationKey = {
  refreshThumbnail: ["categories", "thumbnail", "refresh"] as const,
}

export function useCategoriesQuery() {
  return useQuery<CategoryEnriched[]>({
    queryKey: categoriesKey.list(),
    queryFn: async () => unwrapApiCall(await CategoriesAPI.list()),
  })
}

export function useCategoryQuery(id?: string) {
  return useQuery<CategoryEnriched>({
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

export function useRefreshCategoryThumbnail() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: categoriesMutationKey.refreshThumbnail,
    mutationFn: async (id: string) => unwrapApiCall(await CategoriesAPI.getNewThumbnail(id)),
    onSuccess: ({ categoryId, thumbnail }: CategoryThumbnail) => {
      qc.setQueryData<CategoryEnriched>(categoriesKey.byId(categoryId), (prev) =>
        prev ? { ...prev, thumbnail } : prev
      )
      qc.setQueryData<CategoryEnriched[]>(categoriesKey.list(), (prev) =>
        prev ? prev.map((c) => (c._id === categoryId ? { ...c, thumbnail } : c)) : prev
      )
    },
  })
}
