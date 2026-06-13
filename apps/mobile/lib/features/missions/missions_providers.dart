import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/data/repositories/missions_repository.dart';
import 'package:maintflow_mobile/features/auth/auth_controller.dart';

/// The signed-in technician's interventions, read from the offline cache
/// (soonest first) and refreshed from the API in the background. A failed
/// refresh (e.g. offline) is ignored so the cached data keeps showing.
final missionsProvider = StreamProvider.autoDispose<List<Intervention>>((ref) {
  final repo = ref.watch(missionsRepositoryProvider);
  final user = ref.watch(authControllerProvider).valueOrNull;
  if (user != null) {
    unawaited(repo.refreshMissions(user.id).catchError((Object _) {}));
  }
  return repo.watchMissions().map(
        (list) => list.toList()
          ..sort((a, b) => a.scheduledFor.compareTo(b.scheduledFor)),
      );
});

/// A single cached mission by id (derived from [missionsProvider]).
final missionByIdProvider =
    Provider.autoDispose.family<Intervention?, String>((ref, id) {
  final missions = ref.watch(missionsProvider).valueOrNull;
  if (missions == null) return null;
  for (final m in missions) {
    if (m.id == id) return m;
  }
  return null;
});

/// Machines indexed by id (offline cache + background refresh), for resolving
/// names/workshops on mission rows.
final machinesByIdProvider =
    StreamProvider.autoDispose<Map<String, Machine>>((ref) {
  final repo = ref.watch(missionsRepositoryProvider);
  unawaited(repo.refreshMachines().catchError((Object _) {}));
  return repo
      .watchMachines()
      .map((list) => <String, Machine>{for (final m in list) m.id: m});
});
