// src/backend/apis/auth.api.ts
import { z } from "zod";
import { baseClient } from "../clients/base.client";
import { safeApiCall, type SafeApiResult } from "../../utils/functions/safe-api-call.function";
import { ZUser, ZSession, type Session } from "../../schemas/auth.schemas";

const ZRegisterPayload = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  displayName: z.string().min(1, { message: "El nombre no puede estar vacío" }),
});
export type RegisterInput = z.infer<typeof ZRegisterPayload>;

const ZLoginPayload = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(1, { message: "La contraseña no puede estar vacía" }),
});
export type LoginInput = z.infer<typeof ZLoginPayload>;

const ZAuthResponse = z.object({ user: ZUser });
export type AuthResponse = z.infer<typeof ZAuthResponse>;

export const AuthAPI = {
  async register(input: RegisterInput): Promise<SafeApiResult<AuthResponse>> {
    const parsed = ZRegisterPayload.safeParse(input);
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos";
      return { success: false, message: m, status: null, data: null };
    }
    return safeApiCall(async () => {
      const res = await baseClient.post("/auth/register", parsed.data, { withCredentials: true });
      return ZAuthResponse.parse(res.data);
    });
  },

  async login(input: LoginInput): Promise<SafeApiResult<AuthResponse>> {
    const parsed = ZLoginPayload.safeParse(input);
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos";
      return { success: false, message: m, status: null, data: null };
    }
    return safeApiCall(async () => {
      const res = await baseClient.post("/auth/login", parsed.data, { withCredentials: true });
      return ZAuthResponse.parse(res.data);
    });
  },

  async logout(): Promise<SafeApiResult<{ success: boolean }>> {
    return safeApiCall(async () => {
      const res = await baseClient.post("/auth/logout", {}, { withCredentials: true });
      return res.data;
    });
  },

  async getSession(): Promise<SafeApiResult<Session>> {
    return safeApiCall(async () => {
      const res = await baseClient.get("/auth/me", {
        withCredentials: true,
        silent401: true,
        skipSnackbar: true,
        skipRedirect: true,
      });
      return ZSession.parse(res.data);
    });
  },

  async fetchWsTicket(): Promise<SafeApiResult<string>> {
    return safeApiCall(async () => {
      const res = await baseClient.get("/auth/ws-ticket", {
        withCredentials: true,
      });
      return res.data;
    });
  },
};
