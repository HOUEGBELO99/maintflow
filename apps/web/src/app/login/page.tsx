'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Icon } from '@/components/icon';
import { api, ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/store/auth';

/** Seeded back-office accounts for quick dev switching. Mirrors prisma/seed.ts. */
const DEMO = [
  { email: 'l.moreau@usine.fr', label: 'Admin' },
  { email: 'm.roux@usine.fr', label: 'Chef maintenance' },
  { email: 'h.akkari@usine.fr', label: "Chef d'atelier" },
];

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState('l.moreau@usine.fr');
  const [password, setPassword] = useState('••••••••');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { accessToken, user } = await api.auth.devLogin(email);
      setSession(accessToken, user);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion impossible');
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-surface lg:grid-cols-2">
      {/* Aside (hidden below lg) — dark hero */}
      <aside
        className="relative hidden items-stretch overflow-hidden text-white lg:flex"
        style={{ background: 'linear-gradient(180deg, #0E1410 0%, #050907 100%)' }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,255,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,0,0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            backgroundPosition: '-1px -1px',
            WebkitMaskImage: 'radial-gradient(circle at 30% 50%, rgba(0,0,0,1) 0%, transparent 70%)',
            maskImage: 'radial-gradient(circle at 30% 50%, rgba(0,0,0,1) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(circle at 26% 42%, rgba(0,255,0,0.12), transparent 55%)' }}
        />
        <div className="relative z-10 flex w-full flex-col px-14 py-12">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-brand-deep text-base font-bold text-brand-bright">
              M
            </span>
            <span className="text-[22px] font-bold tracking-tight">
              Maint<span className="text-brand-bright">Flow</span>
            </span>
          </div>

          <div className="mb-10 mt-auto max-w-[460px]">
            <div className="mb-3.5 font-mono text-xs uppercase tracking-[0.1em] text-brand-bright">
              — Industrie 4.0
            </div>
            <h2 className="mb-3.5 text-[38px] font-bold leading-[1.1] tracking-tight">
              Toutes vos machines. Tous vos techniciens. Un seul flux.
            </h2>
            <p className="max-w-[420px] text-[15px] leading-relaxed text-white/70">
              Gestion de maintenance industrielle. Centralisez pannes, interventions et historique de
              votre atelier en temps réel.
            </p>
          </div>

          <div className="flex gap-8 border-t border-white/10 pt-7">
            {[
              { v: '128', l: 'Machines' },
              { v: '99.4%', l: 'Disponibilité' },
              { v: '12 min', l: 'MTTR moyen' },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-[26px] font-bold tracking-tight text-brand-bright">{s.v}</div>
                <div className="mt-0.5 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-white/60">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Form column */}
      <div className="flex flex-col px-8 py-6">
        <div className="flex justify-end">
          <div className="inline-flex items-center gap-0.5 rounded-md bg-surface-muted p-0.5 text-[11.5px] font-semibold">
            <button className="rounded-[7px] bg-surface px-2.5 py-[5px] text-ink shadow-[var(--shadow-sm)]">FR</button>
            <button className="px-2.5 py-[5px] text-mute">EN</button>
          </div>
        </div>

        <form onSubmit={submit} className="m-auto flex w-full max-w-[380px] flex-col gap-3.5">
          <div className="mb-2.5">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand-deep text-xl font-bold text-brand-bright">
              M
            </span>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight">Bienvenue sur MaintFlow</h1>
          <p className="text-sm text-mute">Gestion de maintenance industrielle, centralisée.</p>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-mute">Adresse e-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@entreprise.fr"
              autoFocus
              className="rounded-md border border-line bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="flex justify-between text-xs font-semibold text-mute">
              Mot de passe
              <a className="cursor-pointer font-medium text-brand-deep">Mot de passe oublié ?</a>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-line bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-brand bg-brand-bright px-[18px] py-3 text-sm font-bold text-brand-deep transition hover:bg-brand disabled:opacity-60"
          >
            {loading ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-deep/30 border-t-brand-deep" />
            ) : (
              <Icon name="logout" size={14} />
            )}
            Se connecter
          </button>

          <div className="my-1.5 flex items-center gap-3 text-[11.5px] font-semibold text-faint">
            <span className="h-px flex-1 bg-line" />
            ou
            <span className="h-px flex-1 bg-line" />
          </div>

          <button
            type="button"
            disabled
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-transparent bg-surface-muted px-[18px] py-[11px] text-sm font-semibold text-body disabled:opacity-70"
          >
            <Icon name="shield" size={14} /> Continuer avec SSO entreprise
          </button>

          <div className="mt-1 flex items-center gap-1.5 text-xs text-mute">
            <span className="text-brand">
              <Icon name="shield" size={12} />
            </span>
            Connexion chiffrée · SSO compatible
          </div>

          {error && <p className="text-sm text-critical">{error}</p>}

          {/* Dev affordance — quick account switch (replaces real Supabase auth locally) */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-line pt-3 text-xs text-faint">
            <span>Démo :</span>
            {DEMO.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => setEmail(d.email)}
                className={`rounded-pill px-2 py-0.5 font-medium transition ${
                  email === d.email ? 'bg-brand-50 text-brand-deep' : 'bg-surface-muted text-mute hover:text-ink'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </form>
      </div>
    </main>
  );
}
