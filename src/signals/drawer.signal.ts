import { signal, effect } from "@preact/signals-react";

const STORAGE_KEY = "ui:drawer-open";

const initial = (() => {
  if (typeof window === "undefined") return true;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === "1") return true;
  if (raw === "0") return false;
  return true;
})();

export const openDrawer = signal<boolean>(initial);

effect(() => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, openDrawer.value ? "1" : "0");
});
