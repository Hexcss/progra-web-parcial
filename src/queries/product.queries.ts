import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductsAPI, type CreateProductInput, type UpdateProductInput, type ListParams, type ProductList } from "../backend/apis/product.api";
import { unwrapApiCall } from "../utils/functions/unwrap-api-call.function";
import type { Product } from "../schemas/product.schema";

export const productsKey = {
  root: ["products"] as const,
  list: (params: ListParams = {}) => [...productsKey.root, "list", params] as const,
  byId: (id: string) => [...productsKey.root, id] as const,
};

export function useProductsQuery(params: ListParams = {}) {
  return useQuery<ProductList>({
    queryKey: productsKey.list(params),
    queryFn: async () => unwrapApiCall(await ProductsAPI.list(params)),
  });
}

export function useProductQuery(id?: string) {
  return useQuery<Product>({
    queryKey: id ? productsKey.byId(id) : productsKey.byId(""),
    queryFn: async () => unwrapApiCall(await ProductsAPI.getById(id!)),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProductInput) => unwrapApiCall(await ProductsAPI.create(input)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productsKey.root });
    },
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateProductInput) => unwrapApiCall(await ProductsAPI.update(id, input)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productsKey.byId(id) });
      qc.invalidateQueries({ queryKey: productsKey.root });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => unwrapApiCall(await ProductsAPI.remove(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productsKey.root });
    },
  });
}
