import { signal } from "@preact/signals-react";

export const sessionExpired = signal(false);

export function triggerSessionExpired() {
  sessionExpired.value = true;
}
