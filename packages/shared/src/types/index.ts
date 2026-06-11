/**
 * Domain DTO/entity types shared between API responses and web client.
 * These mirror the Prisma models but are transport-safe (dates as ISO strings).
 */
import type {
  Criticality,
  FaultSeverity,
  FaultStatus,
  FaultType,
  InterventionKind,
  InterventionStatus,
  MachineState,
  NotificationLevel,
  UserRole,
} from '../enums/index.js';

export interface Machine {
  id: string;
  code: string;
  name: string;
  type: string;
  workshop: string;
  installedAt: string;
  state: MachineState;
  runtime: number;
  criticality: Criticality;
  hourlyCost: number;
  lifespanYears: number;
}

export interface Fault {
  id: string;
  machineId: string;
  type: FaultType;
  description: string;
  reportedAt: string;
  reportedBy: string;
  severity: FaultSeverity;
  status: FaultStatus;
  rootCause: string | null;
  hasPhoto: boolean;
  takenAt: string | null;
}

export interface ChecklistItem {
  label: string;
  done: boolean;
}

export interface Intervention {
  id: string;
  machineId: string;
  technicianId: string;
  kind: InterventionKind;
  description: string;
  scheduledFor: string;
  duration: number;
  status: InterventionStatus;
  linkedFaultId: string | null;
  planRuleId: string | null;
  checklist: ChecklistItem[];
  partsUsed: string[];
  actualDuration: number | null;
  rating: number | null;
  signedBy: string | null;
}

export interface Technician {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  available: boolean;
  onTime: number;
  rating: number;
  doneThisMonth: number;
}

export interface Part {
  id: string;
  name: string;
  ref: string;
  stock: number;
  min: number;
  location: string;
  unitCost: number;
  forTypes: string[];
}

export interface PlanRule {
  id: string;
  title: string;
  machineId: string;
  everyWeeks: number;
  technicianId: string;
  duration: number;
  nextDue: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  workshop: string;
  status: 'active' | 'inactive';
  lastLogin: string | null;
}

export interface Notification {
  id: string;
  level: NotificationLevel;
  text: string;
  read: boolean;
  createdAt: string;
}

/** Aggregated KPIs returned by GET /dashboard/kpis. */
export interface DashboardKpis {
  totalMachines: number;
  ok: number;
  fault: number;
  maintenance: number;
  activeFaults: number;
  criticalFaults: number;
  inProgressInterventions: number;
  plannedInterventions: number;
  lowStock: number;
  healthScore: number;
  mttr: number | null;
}

/** Standard paginated envelope. */
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
