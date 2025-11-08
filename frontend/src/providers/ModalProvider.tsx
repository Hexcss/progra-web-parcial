import { Suspense } from "react";
import { modalRegistry } from "../registries/modal.registry";
import { currentModal } from "../signals/modal.signal";
import type { ModalType } from "../utils/types/modal.type";
import { useSignals } from "@preact/signals-react/runtime";

export function ModalProvider() {
  useSignals();
  const modal = currentModal.value;
  if (!modal) return null;

  const Component = modalRegistry[modal.type] as React.LazyExoticComponent<
    React.ComponentType<Extract<ModalType, { type: typeof modal.type }>["props"]>
  >;

  return (
    <Suspense fallback={null}>
      <Component {...modal.props} />
    </Suspense>
  );
}
