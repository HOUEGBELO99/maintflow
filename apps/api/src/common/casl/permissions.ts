import { Permission, UserRole } from '@maintflow/shared';

/**
 * Role → permission matrix. Mirrors the prototype's PERMISSIONS table.
 * This is the single source of authorization truth for the API.
 * RLS in Postgres is the second line of defense (defense in depth).
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),

  [UserRole.CHEF_MAINTENANCE]: [
    Permission.WEB,
    Permission.VIEW_MACHINES,
    Permission.EDIT_MACHINES,
    Permission.REPORT_FAULTS,
    Permission.MANAGE_INTERVENTIONS,
    Permission.MANAGE_PARTS,
    Permission.VIEW_REPORTS,
  ],

  [UserRole.CHEF_ATELIER]: [
    Permission.WEB,
    Permission.VIEW_MACHINES,
    Permission.REPORT_FAULTS,
    Permission.MANAGE_INTERVENTIONS,
    Permission.VIEW_REPORTS,
  ],

  [UserRole.TECHNICIEN]: [
    Permission.MOBILE,
    Permission.VIEW_MACHINES,
    Permission.REPORT_FAULTS,
    Permission.MANAGE_INTERVENTIONS,
  ],

  [UserRole.OPERATEUR]: [Permission.MOBILE, Permission.VIEW_MACHINES, Permission.REPORT_FAULTS],
};

export function permissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return permissionsForRole(role).includes(permission);
}
