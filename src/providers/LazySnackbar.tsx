import { lazy, Suspense, useEffect, useState } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { snackbarState, popQueuedSnackbar, showSnackbar } from "../signals/snackbar.signal";

const SnackbarProviderLazy = lazy(() => import("./SnackbarProvider"));

export default function LazySnackbar() {
  useSignals();
  const { open } = snackbarState.value;
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    const queued = popQueuedSnackbar();
    if (queued) showSnackbar(queued.message, queued.type);
  }, []);

  useEffect(() => {
    if (open && !shouldMount) setShouldMount(true);
  }, [open, shouldMount]);

  useEffect(() => {
    const idle =
      "requestIdleCallback" in window
        ? (cb: any) => (window as any).requestIdleCallback(cb)
        : (cb: any) => setTimeout(cb, 1200);
    const cancel =
      "cancelIdleCallback" in window
        ? (id: any) => (window as any).cancelIdleCallback(id)
        : (id: any) => clearTimeout(id);

    const id = idle(() => {
      import("./SnackbarProvider");
    });
    return () => cancel(id);
  }, []);

  if (!shouldMount) return null;

  return (
    <Suspense fallback={null}>
      <SnackbarProviderLazy />
    </Suspense>
  );
}
