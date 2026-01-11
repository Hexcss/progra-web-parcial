import { z } from "zod";
import { baseClient } from "../clients/base.client";
import { graphqlRequest } from "../clients/graphql.client";
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

export type OAuthIntent = "login" | "signup";

function buildApiUrl(path: string, params?: Record<string, string | undefined>) {
  const base = (baseClient.defaults?.baseURL as string | undefined) ?? "";
  const qs = params ? new URLSearchParams(Object.entries(params).filter(([, v]) => v != null) as [string, string][]) : null;
  return `${base.replace(/\/$/, "")}${path}${qs && Array.from(qs.keys()).length ? `?${qs.toString()}` : ""}`;
}

function defaultRedirect() {
  if (typeof window === "undefined") return "/";
  const url = window.location.pathname + window.location.search + window.location.hash;
  return url || "/";
}

const USER_FIELDS = `
  _id
  email
  displayName
  role
  createdAt
  updatedAt
  avatarUrl
  emailVerified
`;

const REGISTER_MUTATION = `
  mutation Register($input: RegisterDto!) {
    register(input: $input) {
      user { ${USER_FIELDS} }
      verificationEmail { attempted sent id error }
    }
  }
`;

const LOGIN_MUTATION = `
  mutation Login($input: LoginDto!) {
    login(input: $input) {
      user { ${USER_FIELDS} }
    }
  }
`;

const LOGOUT_MUTATION = `
  mutation Logout {
    logout { success }
  }
`;

const SESSION_QUERY = `
  query Session {
    session {
      sub
      email
      role
    }
  }
`;

const WS_TICKET_QUERY = `
  query WsTicket {
    wsTicket
  }
`;

export const AuthAPI = {
  async register(input: RegisterInput): Promise<SafeApiResult<AuthResponse>> {
    const parsed = ZRegisterPayload.safeParse(input);
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos";
      return { success: false, message: m, status: null, data: null };
    }
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ register: AuthResponse }>(REGISTER_MUTATION, { input: parsed.data });
      return ZAuthResponse.parse(data.register);
    });
  },

  async login(input: LoginInput): Promise<SafeApiResult<AuthResponse>> {
    const parsed = ZLoginPayload.safeParse(input);
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos";
      return { success: false, message: m, status: null, data: null };
    }
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ login: AuthResponse }>(LOGIN_MUTATION, { input: parsed.data });
      return ZAuthResponse.parse(data.login);
    });
  },

  async logout(): Promise<SafeApiResult<{ success: boolean }>> {
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ logout: { success: boolean } }>(LOGOUT_MUTATION);
      return data.logout;
    });
  },

  async getSession(): Promise<SafeApiResult<Session>> {
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ session: Session }>(SESSION_QUERY, undefined, {
        silent401: true,
        skipSnackbar: true,
        skipRedirect: true,
      });
      return ZSession.parse(data.session);
    });
  },

  async fetchWsTicket(): Promise<SafeApiResult<string>> {
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ wsTicket: string }>(WS_TICKET_QUERY);
      return data.wsTicket;
    });
  },

  startGoogleOAuth(intent: OAuthIntent = "login", redirect?: string) {
    const url = buildApiUrl("/auth/oauth/google/start", {
      intent,
      redirect: redirect ?? defaultRedirect(),
    });
    if (typeof window !== "undefined") window.location.href = url;
  },

  startGithubOAuth(intent: OAuthIntent = "login", redirect?: string) {
    const url = buildApiUrl("/auth/oauth/github/start", {
      intent,
      redirect: redirect ?? defaultRedirect(),
    });
    if (typeof window !== "undefined") window.location.href = url;
  },
};
