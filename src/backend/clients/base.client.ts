// src/backend/clients/base.client.ts
import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import cleanDeep from "clean-deep";
import { env } from "../../config/env";
import { normalizeMessage } from "../../utils/functions/mormalize-message.function";
import { queueSnackbarForNextLoad, showSnackbar } from "../../signals/snackbar.signal";
import { triggerSessionExpired } from "../../signals/session.signal";

const POST_LOGIN_REDIRECT = "postLoginRedirect";

declare module "axios" {
  interface AxiosRequestConfig {
    silent?: boolean;
    silent401?: boolean;
    skipSnackbar?: boolean;
    skipRedirect?: boolean;
  }
}

export const baseClient = axios.create({
  baseURL: env.API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

const isBypassValue = (v: unknown) =>
  (typeof FormData !== "undefined" && v instanceof FormData) ||
  (typeof Blob !== "undefined" && v instanceof Blob) ||
  (typeof File !== "undefined" && v instanceof File) ||
  (typeof ArrayBuffer !== "undefined" && v instanceof ArrayBuffer) ||
  (typeof URLSearchParams !== "undefined" && v instanceof URLSearchParams);

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  Object.prototype.toString.call(v) === "[object Object]";

const sanitize = <T>(obj: T): T => {
  if (!obj) return obj;
  if (isBypassValue(obj)) return obj;
  if (!isPlainObject(obj) && !Array.isArray(obj)) return obj;
  try {
    return cleanDeep(obj as any, {
      emptyArrays: false,
      emptyObjects: false,
      emptyStrings: false,
      nullValues: false,
      NaNValues: false,
      undefinedValues: true,
    }) as T;
  } catch {
    return obj;
  }
};

const isNumericKey = (k: string) => /^\d+$/.test(k);
const isObjectArray = (v: unknown): v is Record<string, unknown> => {
  if (!isPlainObject(v)) return false;
  const keys = Object.keys(v);
  if (keys.length === 0) return false;
  return keys.every(isNumericKey);
};
const objectArrayToArray = (o: Record<string, unknown>) =>
  Object.keys(o)
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => o[k]);

const normalizeObjectArrays = (v: any): any => {
  if (Array.isArray(v)) return v.map(normalizeObjectArrays);
  if (isObjectArray(v)) return objectArrayToArray(v).map(normalizeObjectArrays);
  if (isPlainObject(v)) {
    const out: Record<string, any> = {};
    for (const [k, val] of Object.entries(v)) out[k] = normalizeObjectArrays(val);
    return out;
  }
  return v;
};

let sessionNotified = false;

baseClient.interceptors.request.use(
  (config) => {
    const method = (config.method ?? "").toLowerCase();
    if (config.params) config.params = sanitize(config.params);
    if (["post", "put", "patch"].includes(method)) {
      const ct = String(config.headers?.["Content-Type"] ?? config.headers?.["content-type"] ?? "");
      const isMultipart = ct.toLowerCase().includes("multipart/form-data");
      if (!isMultipart && config.data) config.data = sanitize(config.data);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

baseClient.interceptors.response.use(
  (response) => {
    sessionNotified = false;
    try {
      response.data = normalizeObjectArrays(response.data);
    } catch {}
    return response;
  },
  (error: AxiosError<any>) => {
    const cfg = (error.config ?? {}) as AxiosRequestConfig;
    const silentAll = !!cfg.silent;
    const silent401 = !!cfg.silent401 || String(cfg.url ?? "").endsWith("/auth/me");
    const skipSnackbar = !!cfg.skipSnackbar || silentAll;
    const skipRedirect = !!cfg.skipRedirect || silentAll;

    const status = error?.response?.status ?? null;
    const data = error?.response?.data as { message?: unknown; error?: unknown } | undefined;

    const raw = data?.message ?? data?.error ?? error?.message ?? "Error desconocido";
    const internalMessage = normalizeMessage(raw, "Error desconocido");

    if (status === 401) {
      if (!silent401) {
        if (!sessionNotified) {
          sessionNotified = true;
          const uiMsg = "Tu sesión ha caducado. Vuelve a iniciar sesión para continuar.";
          const onLogin = window.location.pathname === "/login";
          if (!skipSnackbar) {
            if (onLogin) showSnackbar(uiMsg, "warning");
            else queueSnackbarForNextLoad(uiMsg, "warning");
          }
          if (!skipRedirect && !onLogin) {
            try {
              const intended = window.location.pathname + window.location.search;
              localStorage.setItem(POST_LOGIN_REDIRECT, intended);
            } catch {}
          }
          triggerSessionExpired();
        }
      }
      if (import.meta.env.DEV) {
        console.warn("[axios] 401 handled", { url: cfg.url, silent401, internalMessage });
      }
      return Promise.reject(error);
    }

    if (status === 403) {
      if (!skipSnackbar) showSnackbar("No tienes permisos para esta acción. Redirigiendo…", "warning");
      if (!skipRedirect && window.location.pathname !== "/unauthorized") {
        queueSnackbarForNextLoad("No tienes permisos para esta acción.", "warning");
        window.location.replace("/unauthorized");
      }
      return Promise.reject(error);
    }

    if (!skipSnackbar) {
      let uiMessage = "Ha ocurrido un problema. Inténtalo de nuevo.";
      switch (status) {
        case 400:
          uiMessage = "No pudimos procesar la solicitud. Revisa los datos e inténtalo otra vez.";
          break;
        case 404:
          uiMessage = "No encontramos lo que buscabas. Verifica la información.";
          break;
        case 409:
          uiMessage = "Ya existe un registro similar o hay un conflicto. Revisa y vuelve a intentar.";
          break;
        case 422:
          uiMessage = "Algunos campos no son válidos. Corrige los errores y vuelve a intentar.";
          break;
        case 429:
          uiMessage = "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.";
          break;
        case 500:
          uiMessage = "Estamos teniendo un error interno. Inténtalo de nuevo en unos minutos.";
          break;
        case 502:
        case 503:
        case 504:
          uiMessage = "El servicio no está disponible temporalmente. Por favor, inténtalo más tarde.";
          break;
        default:
          if (!status) uiMessage = "No hay conexión con el servidor. Verifica tu red e inténtalo nuevamente.";
      }
      const variant = status && status >= 500 ? "error" : "warning";
      showSnackbar(uiMessage, variant);
    }

    if (import.meta.env.DEV) {
      console.error("[axios] Error response:", {
        url: error.config?.url,
        status,
        data,
        internalMessage,
      });
    }

    return Promise.reject(error);
  }
);
