'use client';

import { useIsMutating } from '@tanstack/react-query';

/** True while any save is in flight — disables submit buttons (no double submit). */
export function useBusy(): boolean {
  return useIsMutating() > 0;
}

export function Spinner() {
  return (
    <span
      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden
    />
  );
}
