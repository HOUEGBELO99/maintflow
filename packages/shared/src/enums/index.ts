/**
 * Domain enums — the single source of truth shared by the API (Zod/DTO),
 * the web app, and (mirrored manually) the Flutter app.
 * Keep these in sync with prisma/schema.prisma.
 */

export const UserRole = {
  ADMIN: 'admin',
  CHEF_MAINTENANCE: 'chef_maintenance',
  CHEF_ATELIER: 'chef_atelier',
  TECHNICIEN: 'technicien',
  OPERATEUR: 'operateur',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const MachineState = {
  OK: 'ok',
  FAULT: 'fault',
  MAINTENANCE: 'maintenance',
} as const;
export type MachineState = (typeof MachineState)[keyof typeof MachineState];

export const Criticality = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;
export type Criticality = (typeof Criticality)[keyof typeof Criticality];

export const FaultSeverity = {
  CRITICAL: 'critical',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;
export type FaultSeverity = (typeof FaultSeverity)[keyof typeof FaultSeverity];

export const FaultStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
} as const;
export type FaultStatus = (typeof FaultStatus)[keyof typeof FaultStatus];

export const FaultType = {
  MECANIQUE: 'mecanique',
  ELECTRIQUE: 'electrique',
  HYDRAULIQUE: 'hydraulique',
  LOGICIEL: 'logiciel',
} as const;
export type FaultType = (typeof FaultType)[keyof typeof FaultType];

export const InterventionKind = {
  CORRECTIVE: 'corrective',
  PREVENTIVE: 'preventive',
} as const;
export type InterventionKind = (typeof InterventionKind)[keyof typeof InterventionKind];

export const InterventionStatus = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;
export type InterventionStatus = (typeof InterventionStatus)[keyof typeof InterventionStatus];

export const NotificationLevel = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info',
} as const;
export type NotificationLevel = (typeof NotificationLevel)[keyof typeof NotificationLevel];

/** Granular permissions — mapped to roles in the CASL ability factory (API). */
export const Permission = {
  WEB: 'web',
  MOBILE: 'mobile',
  VIEW_MACHINES: 'view_machines',
  EDIT_MACHINES: 'edit_machines',
  REPORT_FAULTS: 'report_faults',
  MANAGE_INTERVENTIONS: 'manage_interventions',
  MANAGE_PARTS: 'manage_parts',
  MANAGE_USERS: 'manage_users',
  VIEW_REPORTS: 'view_reports',
} as const;
export type Permission = (typeof Permission)[keyof typeof Permission];
