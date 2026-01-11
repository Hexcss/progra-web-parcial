// src/backend/apis/discount.api.ts
import { z } from "zod";
import { graphqlRequest } from "../clients/graphql.client";
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

const DISCOUNT_FIELDS = `
  _id
  productId
  discountPercent
  startDate
  endDate
  createdAt
  updatedAt
`;

const LIST_QUERY = `
  query Discounts($productId: String, $page: Int, $limit: Int) {
    discounts(productId: $productId, page: $page, limit: $limit) {
      ${DISCOUNT_FIELDS}
    }
  }
`;

const GET_QUERY = `
  query Discount($id: String!) {
    discount(id: $id) {
      ${DISCOUNT_FIELDS}
    }
  }
`;

const CREATE_MUTATION = `
  mutation CreateDiscount($input: CreateDiscountDto!) {
    createDiscount(input: $input) {
      ${DISCOUNT_FIELDS}
    }
  }
`;

const UPDATE_MUTATION = `
  mutation UpdateDiscount($id: String!, $input: UpdateDiscountDto!) {
    updateDiscount(id: $id, input: $input) {
      ${DISCOUNT_FIELDS}
    }
  }
`;

const REMOVE_MUTATION = `
  mutation RemoveDiscount($id: String!) {
    removeDiscount(id: $id) {
      success
    }
  }
`;

export const DiscountsAPI = {
  async list(params: DiscountListParams = {}): Promise<SafeApiResult<PaginatedDiscounts>> {
    const parsed = ZDiscountListParams.safeParse(params);
    const finalParams = parsed.success ? parsed.data : {};
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ discounts: Discount[] }>(LIST_QUERY, finalParams);
      return coerceToPaginated(data.discounts, finalParams);
    }, "discounts.list");
  },

  async getById(id: string): Promise<SafeApiResult<Discount>> {
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ discount: Discount }>(GET_QUERY, { id });
      return ZDiscount.parse(data.discount);
    }, "discounts.getById");
  },

  async create(input: CreateDiscountPayload): Promise<SafeApiResult<Discount>> {
    const parsed = ZCreateDiscountPayload.safeParse(input);
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos";
      return { success: false, message: m, status: null, data: null };
    }
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ createDiscount: Discount }>(CREATE_MUTATION, { input: parsed.data });
      return ZDiscount.parse(data.createDiscount);
    }, "discounts.create");
  },

  async update(id: string, input: UpdateDiscountPayload): Promise<SafeApiResult<Discount>> {
    const parsed = ZUpdateDiscountPayload.safeParse(input);
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos";
      return { success: false, message: m, status: null, data: null };
    }
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ updateDiscount: Discount }>(UPDATE_MUTATION, { id, input: parsed.data });
      return ZDiscount.parse(data.updateDiscount);
    }, "discounts.update");
  },

  async remove(id: string): Promise<SafeApiResult<true>> {
    return safeApiCall(async () => {
      await graphqlRequest<{ removeDiscount: { success: boolean } }>(REMOVE_MUTATION, { id });
      return true as const;
    }, "discounts.remove");
  },
};
