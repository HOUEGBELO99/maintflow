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
  InvitationStatus,
  MachineState,
  NotificationLevel,
  ReminderStatus,
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
  /** Technician check-in coordinates, captured when the work is started. */
  checkInLat: number | null;
  checkInLng: number | null;
}

export interface Technician {
  id: string;
  userId: string;
  /** Short display name, e.g. "L. Moreau". */
  name: string;
  /** Display title, e.g. "Technicien sénior". */
  title: string;
  color: string | null;
  specialties: string[];
  available: boolean;
  onTime: number;
  rating: number;
  doneThisMonth: number;
  /** Live workload: active (non-completed) interventions assigned to this technician. */
  activeCount: number;
  activeHours: number;
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
  /** Human-readable reference, e.g. "PM-01". */
  code: string;
  title: string;
  machineId: string;
  everyWeeks: number;
  technicianId: string | null;
  duration: number;
  nextDue: string;
  /** Days before `nextDue` the reminder fires. */
  reminderLead: number;
  active: boolean;
}

export interface Reminder {
  id: string;
  ruleId: string;
  title: string;
  machineId: string;
  technicianId: string | null;
  dueDate: string;
  firedAt: string;
  lead: number;
  channel: string;
  status: ReminderStatus;
}

/** Computed view of an active rule's next reminder window (GET /planning/upcoming). */
export interface UpcomingReminder {
  rule: PlanRule;
  /** ISO date the reminder will fire (nextDue − reminderLead days). */
  remindOn: string;
  /** Whole days from the reference date until the maintenance is due. */
  dueIn: number;
  /** Whole days from the reference date until the reminder fires (≤0 = send now). */
  remindIn: number;
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

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  workshop: string;
  /** Display name of the inviter, e.g. "L. Moreau". */
  invitedBy: string;
  sentAt: string;
  status: InvitationStatus;
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
  availableTechnicians: number;
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
