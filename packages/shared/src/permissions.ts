import { Permission, UserRole } from './enums/index.js';

/**
 * Role → permission matrix: the single source of truth, enforced by the API
 * (PermissionsGuard) and mirrored by the web UI (buttons shown or hidden).
 * Business reference: the prototype's permission table, with
 * "manage technicians" granted to admin + chef de maintenance.
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),

  [UserRole.CHEF_MAINTENANCE]: [
    Permission.WEB,
    Permission.VIEW_MACHINES,
    Permission.EDIT_MACHINES,
    Permission.REPORT_FAULTS,
    Permission.MANAGE_INTERVENTIONS,
    Permission.PLAN_INTERVENTIONS,
    Permission.MANAGE_TECHNICIANS,
    Permission.MANAGE_PARTS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA,
  ],

  // Supervision role: consults the fleet and the reports, does not act on them.
  [UserRole.CHEF_ATELIER]: [
    Permission.WEB,
    Permission.VIEW_MACHINES,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA,
  ],

  [UserRole.TECHNICIEN]: [
    Permission.MOBILE,
    Permission.VIEW_MACHINES,
    Permission.REPORT_FAULTS,
    Permission.MANAGE_INTERVENTIONS,
  ],

  [UserRole.OPERATEUR]: [Permission.MOBILE, Permission.VIEW_MACHINES, Permission.REPORT_FAULTS],
};

export function permissionsForRole(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return permissionsForRole(role).includes(permission);
}

/** Rows of the permission matrix shown to admins (labels in French). */
export const PERMISSION_MATRIX: readonly { permission: Permission; label: string }[] = [
  { permission: Permission.WEB, label: 'Tableau de bord web (desktop)' },
  { permission: Permission.MOBILE, label: 'Application mobile terrain' },
  { permission: Permission.VIEW_MACHINES, label: 'Consulter machines, pannes et interventions' },
  { permission: Permission.EDIT_MACHINES, label: 'Ajouter / modifier des machines' },
  { permission: Permission.REPORT_FAULTS, label: 'Déclarer une panne' },
  { permission: Permission.MANAGE_INTERVENTIONS, label: 'Clôturer panne / intervention' },
  { permission: Permission.PLAN_INTERVENTIONS, label: 'Planifier les interventions' },
  { permission: Permission.MANAGE_TECHNICIANS, label: 'Gérer les techniciens (disponibilité, spécialités)' },
  { permission: Permission.MANAGE_PARTS, label: 'Gérer les pièces de rechange' },
  { permission: Permission.VIEW_REPORTS, label: 'Voir KPI & rapports' },
  { permission: Permission.EXPORT_DATA, label: 'Exporter les données' },
  { permission: Permission.MANAGE_USERS, label: 'Gérer utilisateurs & rôles' },
  { permission: Permission.MANAGE_SETTINGS, label: 'Modifier les paramètres' },
];
