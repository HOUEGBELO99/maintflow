'use client';

import { api, ApiError, type DevLoginResult } from '@/lib/api-client';
import { createClient } from '@/lib/supabase';

/** True when a real Supabase project is configured (prod); false locally. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Sign in and return the access token + hydrated profile. In production this
 * goes through Supabase Auth and hydrates the profile from `GET /auth/me`;
 * locally (Supabase unconfigured) it falls back to the API dev-login route
 * (password ignored). Mirrors the mobile `AuthRepository.signIn`.
 */
export async function signIn(email: string, password: string): Promise<DevLoginResult> {
  if (!isSupabaseConfigured()) {
    return api.auth.devLogin(email);
  }
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new ApiError(401, error?.message ?? 'Connexion impossible');
  }
  const accessToken = data.session.access_token;
  const user = await api.auth.me(accessToken);
  return { accessToken, user };
}

/** Sign out of Supabase (when configured); the caller clears the local store. */
export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await createClient().auth.signOut();
}
