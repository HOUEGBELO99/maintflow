import 'package:freezed_annotation/freezed_annotation.dart';

import 'package:maintflow_mobile/data/models/enums.dart';

part 'intervention.freezed.dart';
part 'intervention.g.dart';

/// One step of an intervention's checklist. Mirrors `ChecklistItem`.
@freezed
class ChecklistItem with _$ChecklistItem {
  const factory ChecklistItem({
    required String label,
    required bool done,
  }) = _ChecklistItem;

  factory ChecklistItem.fromJson(Map<String, dynamic> json) =>
      _$ChecklistItemFromJson(json);
}

/// Mirrors `Intervention` from `packages/shared`. This is the technician's
/// "mission" / work order on the mobile app.
@freezed
class Intervention with _$Intervention {
  const factory Intervention({
    required String id,
    required String machineId,
    required String technicianId,
    required InterventionKind kind,
    required String description,
    required DateTime scheduledFor,
    required double duration,
    required InterventionStatus status,
    required String? linkedFaultId,
    required String? planRuleId,
    @Default(<ChecklistItem>[]) List<ChecklistItem> checklist,
    @Default(<String>[]) List<String> partsUsed,
    required double? actualDuration,
    required int? rating,
    required String? signedBy,
  }) = _Intervention;

  factory Intervention.fromJson(Map<String, dynamic> json) =>
      _$InterventionFromJson(json);
}
