// src/backend/clients/file.client.ts
import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { env } from "../../config/env";
import { normalizeMessage } from "../../utils/functions/mormalize-message.function";
import { queueSnackbarForNextLoad, showSnackbar } from "../../signals/snackbar.signal";
import { triggerSessionExpired } from "../../signals/session.signal";

const POST_LOGIN_REDIRECT = "postLoginRedirect";

export const fileClient = axios.create({
  baseURL: env.API_URL,
  withCredentials: true,
  headers: {},
});

// Let the browser set the multipart boundary
fileClient.interceptors.request.use((config) => {
  const data = config.data as any;
  const isFD = typeof FormData !== "undefined" && data instanceof FormData;
  if (isFD) {
    try {
      delete (config.headers as any)?.common?.["Content-Type"];
      delete (config.headers as any)?.post?.["Content-Type"];
      delete (config.headers as any)?.["Content-Type"];
      delete (config.headers as any)?.["content-type"];
    } catch {}
  }
  return config;
});

let sessionNotified = false;

fileClient.interceptors.response.use(
  (res) => {
    sessionNotified = false;
    return res;
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
      if (!silent401 && !sessionNotified) {
        sessionNotified = true;
        const msg = "Tu sesión ha caducado. Vuelve a iniciar sesión para continuar.";
        const onLogin = window.location.pathname === "/login";
        if (!skipSnackbar) {
          if (onLogin) showSnackbar(msg, "warning");
          else queueSnackbarForNextLoad(msg, "warning");
        }
        if (!skipRedirect && !onLogin) {
          try {
            const intended = window.location.pathname + window.location.search;
            localStorage.setItem(POST_LOGIN_REDIRECT, intended);
          } catch {}
        }
        triggerSessionExpired();
      }
      if (import.meta.env.DEV) console.warn("[fileClient] 401", { url: cfg.url, internalMessage });
      return Promise.reject(error);
    }

    if (!skipSnackbar) {
      let ui = "Ha ocurrido un problema. Inténtalo de nuevo.";
      switch (status) {
        case 400: ui = "No pudimos procesar la solicitud. Revisa los datos e inténtalo otra vez."; break;
        case 404: ui = "No encontramos lo que buscabas. Verifica la información."; break;
        case 409: ui = "Ya existe un registro similar o hay un conflicto."; break;
        case 422: ui = "Algunos campos no son válidos."; break;
        case 500: ui = "Estamos teniendo un error interno. Inténtalo de nuevo en unos minutos."; break;
      }
      showSnackbar(ui, status && status >= 500 ? "error" : "warning");
    }
    if (import.meta.env.DEV) console.error("[fileClient] Error", { url: error.config?.url, status, data, internalMessage });
    return Promise.reject(error);
  }
);
