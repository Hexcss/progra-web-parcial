import { baseClient } from "../clients/base.client";
import { safeApiCall, type SafeApiResult } from "../../utils/functions/safe-api-call.function";
import { z } from "zod";
import type { Product } from "../../schemas/product.schema";

const ZCreateProduct = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  imageUrl: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const ZUpdateProduct = ZCreateProduct.partial();

export type CreateProductInput = z.infer<typeof ZCreateProduct>;
export type UpdateProductInput = z.infer<typeof ZUpdateProduct>;

export type ProductList = {
  items: Product[];
  total: number;
  page: number;
  limit: number;
};

export type ListParams = {
  q?: string;
  category?: string;
  limit?: number;
  page?: number;
};

export const ProductsAPI = {
  async list(params: ListParams = {}): Promise<SafeApiResult<ProductList>> {
    return safeApiCall(() =>
      baseClient.get("/products", { params, withCredentials: true })
    );
  },

  async getById(id: string): Promise<SafeApiResult<Product>> {
    return safeApiCall(() =>
      baseClient.get(`/products/${encodeURIComponent(id)}`, { withCredentials: true })
    );
  },

  async create(input: CreateProductInput): Promise<SafeApiResult<Product>> {
    const parsed = ZCreateProduct.safeParse(input);
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message || "Datos inválidos";
      return { success: false, message: m, status: null, data: null };
    }
    return safeApiCall(() =>
      baseClient.post("/products", parsed.data, { withCredentials: true })
    );
  },

  async update(id: string, input: UpdateProductInput): Promise<SafeApiResult<Product>> {
    const parsed = ZUpdateProduct.safeParse(input);
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message || "Datos inválidos";
      return { success: false, message: m, status: null, data: null };
    }
    return safeApiCall(() =>
      baseClient.put(`/products/${encodeURIComponent(id)}`, parsed.data, { withCredentials: true })
    );
  },

  async remove(id: string): Promise<SafeApiResult<{ success: boolean }>> {
    return safeApiCall(() =>
      baseClient.delete(`/products/${encodeURIComponent(id)}`, { withCredentials: true })
    );
  },
};
