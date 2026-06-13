import type {
  DashboardKpis,
  Fault,
  FaultSeverity,
  FaultStatus,
  FaultType,
  Intervention,
  InterventionKind,
  InterventionStatus,
  Invitation,
  Machine,
  PlanRule,
  Reminder,
  Technician,
  UpcomingReminder,
  UserRole,
} from '@maintflow/shared';

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
  // A caller-supplied Authorization wins (e.g. hydrating /auth/me right after a
  // Supabase sign-in, before the token is in the store).
  if (init?.auth !== false && !headers.has('Authorization')) {
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

export interface MachineInput {
  code: string;
  name: string;
  type: string;
  workshop: string;
  installedAt: string;
  state: Machine['state'];
  criticality: Machine['criticality'];
}

export interface FaultInput {
  machineId: string;
  type: FaultType;
  description: string;
  severity: FaultSeverity;
}
export interface FaultUpdate {
  status?: FaultStatus;
  severity?: FaultSeverity;
  type?: FaultType;
  description?: string;
  rootCause?: string;
}

export interface PlanRuleInput {
  title: string;
  machineId: string;
  technicianId: string;
  everyWeeks: number;
  duration: number;
  nextDue: string;
  reminderLead: number;
}

export interface SiteUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  workshop: string;
  status: 'active' | 'inactive';
  initials: string | null;
  color: string | null;
  lastLogin: string | null;
}

export interface InvitationInput {
  email: string;
  role: UserRole;
  workshop: string;
}

export interface InterventionInput {
  machineId: string;
  technicianId: string;
  kind: InterventionKind;
  description: string;
  scheduledFor: string;
  duration: number;
}
export interface InterventionUpdate {
  status?: InterventionStatus;
  technicianId?: string;
  description?: string;
  scheduledFor?: string;
  duration?: number;
}

export const api = {
  auth: {
    devLogin: (email: string) =>
      request<DevLoginResult>('/auth/dev-login', {
        method: 'POST',
        body: JSON.stringify({ email }),
        auth: false,
      }),
    /** Hydrate the signed-in profile (role/siteId/name) after a Supabase login. */
    me: (token?: string) =>
      request<SessionUser>(
        '/auth/me',
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      ),
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
    create: (body: MachineInput) =>
      request<Machine>('/machines', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<MachineInput>) =>
      request<Machine>(`/machines/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id: string) =>
      request<{ id: string; deleted: boolean }>(`/machines/${id}`, { method: 'DELETE' }),
  },
  faults: {
    list: () => request<Fault[]>('/faults'),
    create: (body: FaultInput) =>
      request<Fault>('/faults', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: FaultUpdate) =>
      request<Fault>(`/faults/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id: string) =>
      request<{ id: string; deleted: boolean }>(`/faults/${id}`, { method: 'DELETE' }),
  },
  interventions: {
    list: () => request<Intervention[]>('/interventions'),
    create: (body: InterventionInput) =>
      request<Intervention>('/interventions', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: InterventionUpdate) =>
      request<Intervention>(`/interventions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id: string) =>
      request<{ id: string; deleted: boolean }>(`/interventions/${id}`, { method: 'DELETE' }),
  },
  technicians: {
    list: () => request<Technician[]>('/technicians'),
  },
  planning: {
    rules: () => request<PlanRule[]>('/planning/rules'),
    reminders: () => request<Reminder[]>('/planning/reminders'),
    upcoming: () => request<UpcomingReminder[]>('/planning/upcoming'),
    createRule: (body: PlanRuleInput) =>
      request<PlanRule>('/planning/rules', { method: 'POST', body: JSON.stringify(body) }),
    updateRule: (id: string, body: Partial<PlanRuleInput> & { active?: boolean }) =>
      request<PlanRule>(`/planning/rules/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    schedule: (id: string) =>
      request<PlanRule>(`/planning/rules/${id}/schedule`, { method: 'POST' }),
  },
  admin: {
    resetDemo: () => request<{ site: string }>('/admin/reset-demo', { method: 'POST' }),
  },
  users: {
    list: () => request<SiteUser[]>('/users'),
    update: (id: string, body: { role?: UserRole; status?: 'active' | 'inactive' }) =>
      request<SiteUser>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    invitations: {
      list: () => request<Invitation[]>('/users/invitations'),
      create: (body: InvitationInput) =>
        request<Invitation>('/users/invitations', { method: 'POST', body: JSON.stringify(body) }),
    },
  },
};
