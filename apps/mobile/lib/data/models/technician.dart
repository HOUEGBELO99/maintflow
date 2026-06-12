import 'package:freezed_annotation/freezed_annotation.dart';

part 'technician.freezed.dart';
part 'technician.g.dart';

/// Mirrors `Technician` from `packages/shared`.
@freezed
class Technician with _$Technician {
  const factory Technician({
    required String id,
    required String userId,
    required String name,
    required String title,
    required String? color,
    @Default(<String>[]) List<String> specialties,
    required bool available,
    required int onTime,
    required double rating,
    required int doneThisMonth,
    required int activeCount,
    required double activeHours,
  }) = _Technician;

  factory Technician.fromJson(Map<String, dynamic> json) =>
      _$TechnicianFromJson(json);
}
