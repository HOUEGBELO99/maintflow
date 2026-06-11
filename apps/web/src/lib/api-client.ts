import type { DashboardKpis, Machine, Paginated } from '@maintflow/shared';

/**
 * Typed fetch wrapper around the NestJS API.
 * The access token is injected per-request (from the Supabase session).
 * Never call Supabase tables directly from the web app — go through the API.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}/api/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new ApiError(res.status, body.message ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  machines: {
    list: (token: string) => request<Machine[]>('/machines', token),
    get: (token: string, id: string) => request<Machine>(`/machines/${id}`, token),
  },
  dashboard: {
    kpis: (token: string) => request<DashboardKpis>('/dashboard/kpis', token),
  },
};

export type { Paginated };
export { ApiError };
