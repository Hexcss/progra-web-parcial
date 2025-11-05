import axios, { AxiosError } from "axios";
import { queueSnackbarForNextLoad, showSnackbar } from "../../signals/snackbar.signal";
import { triggerSessionExpired } from "../../signals/session.signal";
import cleanDeep from "clean-deep";
import { env } from "../../config/env";
import { normalizeMessage } from "../../utils/functions/mormalize-message.function";

const POST_LOGIN_REDIRECT = "postLoginRedirect";

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

baseClient.interceptors.request.use(
  (config) => {
    const method = (config.method ?? "").toLowerCase();
    const isWrite = ["post", "put", "patch"].includes(method);
    if (isWrite) {
      const ct = String(config.headers?.["Content-Type"] ?? config.headers?.["content-type"] ?? "");
      const isMultipart = ct.toLowerCase().includes("multipart/form-data");
      if (!isMultipart) {
        if (config.data) config.data = sanitize(config.data);
        if (config.params) config.params = sanitize(config.params);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

baseClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    try {
      const status = error?.response?.status ?? null;
      const data = error?.response?.data as { message?: unknown; error?: unknown } | undefined;

      const raw =
        data?.message ??
        data?.error ??
        error?.message ??
        "Error desconocido";

      const internalMessage = normalizeMessage(raw, "Error desconocido");

      if (status === 401) {
        const uiMsg = "Tu sesión ha caducado. Vuelve a iniciar sesión para continuar.";
        const isOnLogin = window.location.pathname === "/login";
        if (!isOnLogin) {
          const intended = window.location.pathname + window.location.search;
          localStorage.setItem(POST_LOGIN_REDIRECT, intended);
          queueSnackbarForNextLoad(uiMsg, "warning");
        } else {
          showSnackbar(uiMsg, "warning");
        }
        triggerSessionExpired();
      }

      let uiMessage = "Ha ocurrido un problema. Inténtalo de nuevo.";
      switch (status) {
        case 400:
          uiMessage = "No pudimos procesar la solicitud. Revisa los datos e inténtalo otra vez.";
          break;
        case 403:
          uiMessage = "No tienes permisos para esta acción. Redirigiendo…";
          if (window.location.pathname !== "/unauthorized") {
            queueSnackbarForNextLoad(uiMessage, "warning");
            window.location.replace("/unauthorized");
          }
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
          if (!status) {
            uiMessage = "No hay conexión con el servidor. Verifica tu red e inténtalo nuevamente.";
          }
      }

      if (status !== 401 && status !== 403) {
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

      return Promise.resolve({
        success: false,
        status,
        message: uiMessage,
        data: data ?? null,
        error,
      });
    } catch (err) {
      console.error("[axios] Fatal interceptor error", err);
      const uiMessage = "Error inesperado en la aplicación. Inténtalo de nuevo.";
      showSnackbar(uiMessage, "error");
      return Promise.resolve({
        success: false,
        status: null,
        message: uiMessage,
        data: null,
        error: err,
      });
    }
  }
);
