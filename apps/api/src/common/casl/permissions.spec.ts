import { Permission, UserRole } from '@maintflow/shared';

import { roleHasPermission } from './permissions';

/** The business matrix (prototype table + "techniciens" decision, Oct 2026). */
describe('role → permission matrix', () => {
  const can = (role: UserRole, p: Permission) => roleHasPermission(role, p);

  it('gives the admin everything', () => {
    for (const p of Object.values(Permission)) expect(can(UserRole.ADMIN, p)).toBe(true);
  });

  it('lets the chef de maintenance run maintenance but not users/settings', () => {
    const r = UserRole.CHEF_MAINTENANCE;
    expect(can(r, Permission.EDIT_MACHINES)).toBe(true);
    expect(can(r, Permission.PLAN_INTERVENTIONS)).toBe(true);
    expect(can(r, Permission.MANAGE_TECHNICIANS)).toBe(true);
    expect(can(r, Permission.MANAGE_USERS)).toBe(false);
    expect(can(r, Permission.MANAGE_SETTINGS)).toBe(false);
  });

  it('keeps the chef d’atelier to consultation', () => {
    const r = UserRole.CHEF_ATELIER;
    expect(can(r, Permission.VIEW_REPORTS)).toBe(true);
    expect(can(r, Permission.EXPORT_DATA)).toBe(true);
    for (const p of [
      Permission.EDIT_MACHINES,
      Permission.REPORT_FAULTS,
      Permission.MANAGE_INTERVENTIONS,
      Permission.PLAN_INTERVENTIONS,
      Permission.MANAGE_TECHNICIANS,
      Permission.MANAGE_USERS,
    ]) {
      expect(can(r, p)).toBe(false);
    }
  });

  it('lets technicians close work but not plan it', () => {
    expect(can(UserRole.TECHNICIEN, Permission.MANAGE_INTERVENTIONS)).toBe(true);
    expect(can(UserRole.TECHNICIEN, Permission.PLAN_INTERVENTIONS)).toBe(false);
    expect(can(UserRole.OPERATEUR, Permission.MANAGE_INTERVENTIONS)).toBe(false);
    expect(can(UserRole.OPERATEUR, Permission.REPORT_FAULTS)).toBe(true);
  });
});
