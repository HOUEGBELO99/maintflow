'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { UserRole } from '@maintflow/shared';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  siteId: string;
}

interface AuthState {
  accessToken: string | null;
  user: SessionUser | null;
  setSession: (accessToken: string, user: SessionUser) => void;
  logout: () => void;
}

/**
 * Client auth state — holds the access token used to authorize every API call.
 * Persisted so a reload keeps the session. In production the token comes from
 * Supabase Auth; in local dev from POST /auth/dev-login.
 */
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setSession: (accessToken, user) => set({ accessToken, user }),
      logout: () => set({ accessToken: null, user: null }),
    }),
    { name: 'maintflow.session' },
  ),
);

/** Non-reactive read for the API client. */
export function getAccessToken(): string | null {
  return useAuth.getState().accessToken;
}
