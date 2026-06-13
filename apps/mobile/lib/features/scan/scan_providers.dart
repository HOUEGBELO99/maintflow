import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/features/missions/missions_providers.dart';

/// Pulls a machine code out of a scanned QR payload. Accepts a bare code
/// (`MCH-002`), or a URL/deeplink carrying the code as a `code`/`machine`
/// query param or as its last path segment (e.g. `maintflow://m/MCH-002` or
/// `https://app.maintflow.io/machines/MCH-002`). Returns the upper-cased,
/// trimmed code, or null when the payload is empty.
String? extractMachineCode(String raw) {
  final trimmed = raw.trim();
  if (trimmed.isEmpty) return null;

  final uri = Uri.tryParse(trimmed);
  if (uri != null && (uri.hasScheme || uri.host.isNotEmpty)) {
    final query = uri.queryParameters['code'] ?? uri.queryParameters['machine'];
    if (query != null && query.trim().isNotEmpty) {
      return query.trim().toUpperCase();
    }
    final segments =
        uri.pathSegments.where((s) => s.trim().isNotEmpty).toList();
    if (segments.isNotEmpty) return segments.last.trim().toUpperCase();
  }
  return trimmed.toUpperCase();
}

/// Resolves a scanned payload against the cached machines (keyed by code).
/// Returns null when the code can't be parsed or isn't in the cache.
Machine? resolveScannedMachine(String raw, Map<String, Machine> byCode) {
  final code = extractMachineCode(raw);
  if (code == null) return null;
  return byCode[code];
}

/// Cached machines indexed by their (upper-cased) code, for QR resolution.
final machinesByCodeProvider =
    Provider.autoDispose<Map<String, Machine>>((ref) {
  final byId =
      ref.watch(machinesByIdProvider).valueOrNull ?? const <String, Machine>{};
  return {for (final m in byId.values) m.code.toUpperCase(): m};
});

bool _isActive(InterventionStatus s) =>
    s != InterventionStatus.completed && s != InterventionStatus.cancelled;

/// The most relevant cached intervention for a machine: the soonest active one
/// if any, otherwise the soonest overall. Null when the technician has none for
/// that machine. Used to jump straight to work after a scan.
final interventionForMachineProvider =
    Provider.autoDispose.family<Intervention?, String>((ref, machineId) {
  final missions = ref.watch(missionsProvider).valueOrNull;
  if (missions == null) return null;
  // [missionsProvider] is already sorted soonest-first.
  final mine = missions.where((m) => m.machineId == machineId).toList();
  if (mine.isEmpty) return null;
  final active = mine.where((m) => _isActive(m.status));
  return active.isNotEmpty ? active.first : mine.first;
});
