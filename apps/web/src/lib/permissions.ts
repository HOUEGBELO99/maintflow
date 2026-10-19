'use client';

import { roleHasPermission, type Permission } from '@maintflow/shared';

import { useAuth } from '@/lib/store/auth';

/**
 * `can(Permission.X)` for the signed-in user, from the same role matrix the
 * API enforces (@maintflow/shared). The UI only hides what the API would
 * refuse anyway — it is a convenience, never the security boundary.
 */
export function useCan(): (permission: Permission) => boolean {
  const role = useAuth((s) => s.user?.role);
  return (permission) => (role ? roleHasPermission(role, permission) : false);
}
