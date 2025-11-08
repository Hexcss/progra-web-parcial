// src/backend/apis/discount.api.ts
import { z } from "zod";
import { baseClient } from "../clients/base.client";
import { safeApiCall, type SafeApiResult } from "../../utils/functions/safe-api-call.function";
import { ZDiscount, type Discount, ZCreateDiscountPayload, type CreateDiscountPayload, ZUpdateDiscountPayload, type UpdateDiscountPayload } from "../../schemas/market.schemas";

const ZDiscountListParams = z.object({
  productId: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
});
export type DiscountListParams = z.infer<typeof ZDiscountListParams>;

const ZPaginatedDiscounts = z.object({
  items: z.array(ZDiscount),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});
export type PaginatedDiscounts = z.infer<typeof ZPaginatedDiscounts>;

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  Object.prototype.toString.call(v) === "[object Object]";

const isNumericKey = (k: string) => /^\d+$/.test(k);

const coerceToArray = (data: unknown): unknown[] => {
  if (Array.isArray(data)) return data;
  if (isPlainObject(data)) {
    const keys = Object.keys(data);
    if (keys.length && keys.every(isNumericKey)) {
      return keys.sort((a, b) => Number(a) - Number(b)).map((k) => (data as any)[k]);
    }
  }
  return [];
};

const coerceToPaginated = (raw: any, params: DiscountListParams): PaginatedDiscounts => {
  if (isPlainObject(raw) && Array.isArray(raw.items)) {
    const parsed = ZPaginatedDiscounts.safeParse({
      items: raw.items,
      total: raw.total ?? raw.items.length ?? 0,
      page: raw.page ?? params.page ?? 1,
      limit: raw.limit ?? params.limit ?? (Array.isArray(raw.items) ? raw.items.length || 1 : 10),
    });
    if (parsed.success) return parsed.data;
  }
  const items = coerceToArray(raw);
  const itemsParsed = z.array(ZDiscount).parse(items);
  return {
    items: itemsParsed,
    total: itemsParsed.length,
    page: params.page ?? 1,
    limit: params.limit ?? (itemsParsed.length || 10),
  };
};

export const DiscountsAPI = {
  async list(params: DiscountListParams = {}): Promise<SafeApiResult<PaginatedDiscounts>> {
    const parsed = ZDiscountListParams.safeParse(params);
    const finalParams = parsed.success ? parsed.data : {};
    return safeApiCall(async () => {
      const res = await baseClient.get("/discounts", { params: finalParams, withCredentials: true });
      return coerceToPaginated(res.data, finalParams);
    }, "discounts.list");
  },

  async getById(id: string): Promise<SafeApiResult<Discount>> {
    return safeApiCall(async () => {
      const res = await baseClient.get(`/discounts/${encodeURIComponent(id)}`, { withCredentials: true });
      return ZDiscount.parse(res.data);
    }, "discounts.getById");
  },

  async create(input: CreateDiscountPayload): Promise<SafeApiResult<Discount>> {
    const parsed = ZCreateDiscountPayload.safeParse(input);
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos";
      return { success: false, message: m, status: null, data: null };
    }
    return safeApiCall(async () => {
      const res = await baseClient.post("/discounts", parsed.data, { withCredentials: true });
      return ZDiscount.parse(res.data);
    }, "discounts.create");
  },

  async update(id: string, input: UpdateDiscountPayload): Promise<SafeApiResult<Discount>> {
    const parsed = ZUpdateDiscountPayload.safeParse(input);
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos";
      return { success: false, message: m, status: null, data: null };
    }
    return safeApiCall(async () => {
      const res = await baseClient.put(`/discounts/${encodeURIComponent(id)}`, parsed.data, { withCredentials: true });
      return ZDiscount.parse(res.data);
    }, "discounts.update");
  },

  async remove(id: string): Promise<SafeApiResult<true>> {
    return safeApiCall(async () => {
      await baseClient.delete(`/discounts/${encodeURIComponent(id)}`, { withCredentials: true });
      return true as const;
    }, "discounts.remove");
  },
};
