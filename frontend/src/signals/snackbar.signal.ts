import { signal } from "@preact/signals-react";

export type SnackbarType = "success" | "error" | "info" | "warning";

export interface SnackbarState {
  open: boolean;
  message: string;
  type: SnackbarType;
}

const STORAGE_KEY = "queued_snackbar";

export const snackbarState = signal<SnackbarState>({
  open: false,
  message: "",
  type: "info",
});

export function showSnackbar(message: string, type: SnackbarType = "info") {
  snackbarState.value = { open: true, message, type };
}

export function hideSnackbar() {
  snackbarState.value = { ...snackbarState.value, open: false };
}

export function queueSnackbarForNextLoad(
  message: string,
  type: SnackbarType = "info"
) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ message, type, ts: Date.now() })
    );
  } catch {}
}

export function popQueuedSnackbar():
  | { message: string; type: SnackbarType }
  | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    localStorage.removeItem(STORAGE_KEY);
    const parsed = JSON.parse(raw);
    if (parsed?.message && parsed?.type) {
      return { message: parsed.message, type: parsed.type as SnackbarType };
    }
  } catch {}
  return null;
}
