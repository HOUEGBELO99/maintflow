import 'package:json_annotation/json_annotation.dart';

/// Domain enums — mirrored from `packages/shared/src/enums`. The wire values
/// (`@JsonValue`) MUST stay identical to the TS/Prisma string values.

enum UserRole {
  @JsonValue('admin')
  admin,
  @JsonValue('chef_maintenance')
  chefMaintenance,
  @JsonValue('chef_atelier')
  chefAtelier,
  @JsonValue('technicien')
  technicien,
  @JsonValue('operateur')
  operateur,
}

enum MachineState {
  @JsonValue('ok')
  ok,
  @JsonValue('fault')
  fault,
  @JsonValue('maintenance')
  maintenance,
}

enum Criticality {
  @JsonValue('high')
  high,
  @JsonValue('medium')
  medium,
  @JsonValue('low')
  low,
}

enum FaultType {
  @JsonValue('mecanique')
  mecanique,
  @JsonValue('electrique')
  electrique,
  @JsonValue('hydraulique')
  hydraulique,
  @JsonValue('logiciel')
  logiciel,
}

enum FaultSeverity {
  @JsonValue('critical')
  critical,
  @JsonValue('medium')
  medium,
  @JsonValue('low')
  low,
}

enum FaultStatus {
  @JsonValue('pending')
  pending,
  @JsonValue('in_progress')
  inProgress,
  @JsonValue('resolved')
  resolved,
}

enum InterventionKind {
  @JsonValue('corrective')
  corrective,
  @JsonValue('preventive')
  preventive,
}

enum InterventionStatus {
  @JsonValue('planned')
  planned,
  @JsonValue('in_progress')
  inProgress,
  @JsonValue('completed')
  completed,
  @JsonValue('cancelled')
  cancelled,
}
