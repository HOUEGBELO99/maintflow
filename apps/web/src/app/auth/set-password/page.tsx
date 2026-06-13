'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase';

/**
 * Landing page for the Supabase invite / password-recovery email link. The
 * email redirects here with the session tokens in the URL; the invitee picks a
 * password, after which they can sign in normally. Auth-only — no API calls.
 */
export default function SetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Establish the session from the link (hash tokens are auto-detected; the
  // PKCE `?code=` variant is exchanged explicitly).
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exErr) {
          setError("Ce lien d'invitation est invalide ou a expiré. Demandez un nouvel envoi.");
          return;
        }
      }
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError("Ce lien d'invitation est invalide ou a expiré. Demandez un nouvel envoi.");
        return;
      }
      setReady(true);
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: upErr } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    await supabase.auth.signOut();
    setDone(true);
    setTimeout(() => router.replace('/login'), 1600);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-6">
      <div className="w-full max-w-[400px] rounded-xl border border-line bg-surface p-8 shadow-[var(--shadow-sm)]">
        <Image src="/logo-mark.png" alt="MaintFlow" width={62} height={48} priority className="mb-5 h-12 w-auto" />

        {done ? (
          <>
            <h1 className="text-[22px] font-bold tracking-tight">Mot de passe défini ✅</h1>
            <p className="mt-2 text-sm text-mute">Redirection vers la connexion…</p>
          </>
        ) : (
          <>
            <h1 className="text-[22px] font-bold tracking-tight">Définir votre mot de passe</h1>
            <p className="mt-2 text-sm text-mute">
              Bienvenue sur MaintFlow. Choisissez un mot de passe pour activer votre compte.
            </p>

            <form onSubmit={submit} className="mt-6 flex flex-col gap-3.5">
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!ready || loading}
                className="rounded-md border border-line bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:opacity-60"
              />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Confirmer le mot de passe"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={!ready || loading}
                className="rounded-md border border-line bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:opacity-60"
              />
              {error && <p className="text-sm font-medium text-critical">{error}</p>}
              <button
                type="submit"
                disabled={!ready || loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-brand bg-brand-bright px-[18px] py-3 text-sm font-bold text-brand-deep transition hover:bg-brand disabled:opacity-60"
              >
                {loading ? 'Enregistrement…' : 'Activer mon compte'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
