'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { api, ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/store/auth';

/** Seeded back-office users (dev login). Mirrors prisma/seed.ts. */
const DEV_USERS = [
  { email: 'l.moreau@usine.fr', name: 'Laurent Moreau', role: 'Admin général', initials: 'LM' },
  { email: 'm.roux@usine.fr', name: 'Marie Roux', role: 'Chef de maintenance', initials: 'MR' },
  { email: 'h.akkari@usine.fr', name: 'Hervé Akkari', role: "Chef d'atelier", initials: 'HA' },
];

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuth((s) => s.setSession);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(email: string) {
    setLoading(email);
    setError(null);
    try {
      const { accessToken, user } = await api.auth.devLogin(email);
      setSession(accessToken, user);
      router.replace('/dashboard');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Connexion impossible');
      setLoading(null);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-nav-bg px-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-8 shadow-md">
        <div className="mb-6 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-deep font-bold text-brand-bright">
            M
          </span>
          <span className="text-xl font-bold tracking-tight">
            Maint<span className="text-brand">Flow</span>
          </span>
        </div>
        <h1 className="text-lg font-semibold">Connexion</h1>
        <p className="mb-5 text-sm text-mute">Espace administration — GMAO</p>

        <div className="flex flex-col gap-2">
          {DEV_USERS.map((u) => (
            <button
              key={u.email}
              onClick={() => void signIn(u.email)}
              disabled={loading !== null}
              className="flex items-center gap-3 rounded-md border border-line p-3 text-left transition hover:border-brand hover:bg-brand-50 disabled:opacity-50"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-deep text-xs font-semibold text-white">
                {u.initials}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold">{u.name}</span>
                <span className="block text-xs text-mute">{u.role}</span>
              </span>
              {loading === u.email && <span className="text-xs text-mute">…</span>}
            </button>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-critical">{error}</p>}

        <p className="mt-6 text-xs text-faint">
          Mode développement — connexion via un compte de démo. En production, l’authentification
          passe par Supabase.
        </p>
      </div>
    </main>
  );
}
