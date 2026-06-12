import type { DashboardKpis, Fault, Intervention, Machine } from '@maintflow/shared';

import { getAccessToken, type SessionUser } from './store/auth';

/**
 * Typed fetch wrapper around the NestJS API. The Supabase access token (from the
 * auth store) is injected per request. Never call Supabase tables directly —
 * everything goes through the API.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const API = `${BASE_URL}/api/v1`;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit & { auth?: boolean }): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (init?.auth !== false) {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API}${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    throw new ApiError(res.status, msg ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export interface DevLoginResult {
  accessToken: string;
  user: SessionUser;
}

export const api = {
  auth: {
    devLogin: (email: string) =>
      request<DevLoginResult>('/auth/dev-login', {
        method: 'POST',
        body: JSON.stringify({ email }),
        auth: false,
      }),
  },
  dashboard: {
    kpis: () => request<DashboardKpis>('/dashboard/kpis'),
    faultsByType: () => request<{ type: string; count: number }[]>('/dashboard/faults-by-type'),
    topFaultMachines: () =>
      request<{ machineId: string; code: string; name: string; count: number }[]>(
        '/dashboard/top-fault-machines',
      ),
  },
  machines: {
    list: () => request<Machine[]>('/machines'),
  },
  faults: {
    list: () => request<Fault[]>('/faults'),
  },
  interventions: {
    list: () => request<Intervention[]>('/interventions'),
  },
};
