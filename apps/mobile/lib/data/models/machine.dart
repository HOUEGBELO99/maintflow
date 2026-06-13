import 'package:freezed_annotation/freezed_annotation.dart';

import 'package:maintflow_mobile/data/models/enums.dart';

part 'machine.freezed.dart';
part 'machine.g.dart';

/// Mirrors `Machine` from `packages/shared`.
@freezed
class Machine with _$Machine {
  const factory Machine({
    required String id,
    required String code,
    required String name,
    required String type,
    required String workshop,
    required DateTime installedAt,
    required MachineState state,
    required int runtime,
    required Criticality criticality,
    required int hourlyCost,
    required int lifespanYears,
  }) = _Machine;

  factory Machine.fromJson(Map<String, dynamic> json) =>
      _$MachineFromJson(json);
}
