'use client';

import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
  useIsFetching,
  useIsMutating,
} from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { describeActionError, useToasts } from '@/lib/store/toasts';

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      /** Toast shown on success (default: a generic confirmation). */
      successMessage?: string;
      /** No success toast (the screen already shows the result). */
      silent?: boolean;
    };
  }
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => {
    const qc: QueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          // Data changes elsewhere too (mobile app, other users): keep it live.
          staleTime: 5_000,
          refetchOnWindowFocus: true,
          refetchInterval: 30_000,
          retry: 1,
        },
      },
      mutationCache: new MutationCache({
        onSuccess: (_data, _vars, _ctx, mutation) => {
          // One action can change several resources server-side (closing an
          // intervention resolves its fault and frees the machine): refresh
          // everything rather than only the page's own list.
          void qc.invalidateQueries();
          const meta = mutation.meta;
          if (!meta?.silent) {
            useToasts.getState().push('success', meta?.successMessage ?? 'Modifications enregistrées.');
          }
        },
        // Every failed action is reported — no more silent no-ops.
        onError: (error) => useToasts.getState().push('error', describeActionError(error)),
      }),
    });
    return qc;
  });

  return (
    <QueryClientProvider client={client}>
      <ActivityBar />
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}

/** Thin top bar while anything loads or saves — feedback for every click. */
function ActivityBar() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  if (!fetching && !mutating) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[120] h-[3px] overflow-hidden bg-brand-50" role="progressbar" aria-label="Chargement">
      <div className="h-full w-1/3 animate-[mf-progress_1.1s_ease-in-out_infinite] rounded-full bg-brand" />
      <style>{`@keyframes mf-progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }`}</style>
    </div>
  );
}

function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  if (toasts.length === 0) return null;
  return (
    <div
      className="fixed inset-x-4 bottom-4 z-[100] flex flex-col gap-2 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[360px]"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`rounded-lg border px-4 py-3 text-left text-[13px] font-medium shadow-lg ${
            t.tone === 'error' ? 'border-[#FECACA] bg-critBg text-critFg' : 'border-brand-100 bg-brand-50 text-brand-deep'
          }`}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
