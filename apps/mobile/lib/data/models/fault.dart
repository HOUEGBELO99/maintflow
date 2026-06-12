import 'package:freezed_annotation/freezed_annotation.dart';

import 'package:maintflow_mobile/data/models/enums.dart';

part 'fault.freezed.dart';
part 'fault.g.dart';

/// Mirrors `Fault` from `packages/shared`.
@freezed
class Fault with _$Fault {
  const factory Fault({
    required String id,
    required String machineId,
    required FaultType type,
    required String description,
    required DateTime reportedAt,
    required String reportedBy,
    required FaultSeverity severity,
    required FaultStatus status,
    required String? rootCause,
    required bool hasPhoto,
    required DateTime? takenAt,
  }) = _Fault;

  factory Fault.fromJson(Map<String, dynamic> json) => _$FaultFromJson(json);
}
