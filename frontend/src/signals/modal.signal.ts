import { signal } from "@preact/signals-react";
import type { ModalType, ModalPropsMap } from "../utils/types/modal.type";

export const currentModal = signal<ModalType | null>(null);

export function openModal<K extends keyof ModalPropsMap>(
  type: K,
  props: ModalPropsMap[K]
) {
  currentModal.value = { type, props } as ModalType;
}

export const closeModal = () => {
  currentModal.value = null;
};
