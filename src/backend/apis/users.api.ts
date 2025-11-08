// src/backend/apis/users.api.ts
import { z } from "zod";
import { baseClient } from "../clients/base.client";
import { safeApiCall, type SafeApiResult } from "../../utils/functions/safe-api-call.function";
import { ZUser, ZUserRole, type User } from "../../schemas/auth.schemas";

const ZUserListParams = z.object({
  q: z.string().optional(),
  role: ZUserRole.optional(),
  limit: z.number().int().positive().max(100).optional(),
  page: z.number().int().positive().optional(),
});
export type UserListParams = z.infer<typeof ZUserListParams>;

const ZPaginatedUsers = z.object({
  items: z.array(ZUser),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});
export type PaginatedUsers = z.infer<typeof ZPaginatedUsers>;

const ZUpdateProfilePayload = z.object({
  displayName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});
export type UpdateProfileInput = z.infer<typeof ZUpdateProfilePayload>;

const ZCreateUserPayload = z.object({
  email: z.string().email(),
  displayName: z.string().optional(),
  role: ZUserRole.optional(),
  avatarUrl: z.string().url().optional(),
  password: z.string(),
});
export type CreateUserInput = z.infer<typeof ZCreateUserPayload>;

const ZAdminUpdateUserPayload = z.object({
  displayName: z.string().optional(),
  role: ZUserRole.optional(),
  avatarUrl: z.string().url().optional(),
});
export type UpdateUserInput = z.infer<typeof ZAdminUpdateUserPayload>;

export const UsersAPI = {
  async getProfile(): Promise<SafeApiResult<User | null>> {
    return safeApiCall(async () => {
      const res = await baseClient.get("/users/me", { withCredentials: true });
      if (!res.data) return null;
      return ZUser.parse(res.data);
    });
  },

  async updateProfile(input: UpdateProfileInput): Promise<SafeApiResult<User>> {
    const parsed = ZUpdateProfilePayload.safeParse(input);
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos";
      return { success: false, message: m, status: null, data: null };
    }
    return safeApiCall(async () => {
      const res = await baseClient.patch("/users/me", parsed.data, { withCredentials: true });
      return ZUser.parse(res.data);
    });
  },

  async list(params: UserListParams = {}): Promise<SafeApiResult<PaginatedUsers>> {
    const parsed = ZUserListParams.safeParse(params);
    const finalParams = parsed.success ? parsed.data : {};
    return safeApiCall(async () => {
      const res = await baseClient.get("/users", { params: finalParams, withCredentials: true });
      return ZPaginatedUsers.parse(res.data);
    });
  },

  async getById(id: string): Promise<SafeApiResult<User | null>> {
    return safeApiCall(async () => {
      const res = await baseClient.get(`/users/${encodeURIComponent(id)}`, { withCredentials: true });
      if (!res.data) return null;
      return ZUser.parse(res.data);
    });
  },

  async create(input: CreateUserInput): Promise<SafeApiResult<User>> {
    const parsed = ZCreateUserPayload.safeParse(input);
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos";
      return { success: false, message: m, status: null, data: null };
    }
    return safeApiCall(async () => {
      const res = await baseClient.post("/users", parsed.data, { withCredentials: true });
      return ZUser.parse(res.data);
    });
  },

  async update(id: string, input: UpdateUserInput): Promise<SafeApiResult<User>> {
    const parsed = ZAdminUpdateUserPayload.safeParse(input);
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos";
      return { success: false, message: m, status: null, data: null };
    }
    return safeApiCall(async () => {
      const res = await baseClient.patch(`/users/${encodeURIComponent(id)}`, parsed.data, { withCredentials: true });
      return ZUser.parse(res.data);
    });
  },

  async remove(id: string): Promise<SafeApiResult<true>> {
    return safeApiCall(async () => {
      await baseClient.delete(`/users/${encodeURIComponent(id)}`, { withCredentials: true });
      return true as const;
    });
  },
};
