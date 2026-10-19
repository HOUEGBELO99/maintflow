'use client';

import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { describeActionError, useToasts } from '@/lib/store/toasts';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
        // Every failed action is reported — no more silent no-ops (e.g. a 403
        // when a role is not allowed to change something).
        mutationCache: new MutationCache({
          onError: (error) => useToasts.getState().push('error', describeActionError(error)),
        }),
      }),
  );
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}

function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex w-[360px] max-w-[calc(100vw-40px)] flex-col gap-2" role="status" aria-live="polite">
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
