import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/data/repositories/missions_repository.dart';
import 'package:maintflow_mobile/features/missions/missions_providers.dart';

/// All cached machines (offline-first), sorted by code, with a swallowed
/// background refresh. Backs the "Mon parc" home screen.
final machinesListProvider = StreamProvider.autoDispose<List<Machine>>((ref) {
  final repo = ref.watch(missionsRepositoryProvider);
  unawaited(repo.refreshMachines().catchError((Object _) {}));
  return repo.watchMachines().map(
        (list) => list.toList()..sort((a, b) => a.code.compareTo(b.code)),
      );
});

/// A single cached machine by id.
final machineByIdProvider = Provider.autoDispose.family<Machine?, String>(
  (ref, id) => ref.watch(machinesByIdProvider).valueOrNull?[id],
);

/// The signed-in technician's interventions on a given machine (soonest first),
/// from the offline cache. Backs the machine detail screen.
final machineInterventionsProvider =
    Provider.autoDispose.family<List<Intervention>, String>((ref, machineId) {
  final missions =
      ref.watch(missionsProvider).valueOrNull ?? const <Intervention>[];
  return missions.where((m) => m.machineId == machineId).toList();
});

/// Filters a machine list by state and a free-text query (code / name /
/// workshop, case-insensitive). Pure so it can be unit-tested.
List<Machine> filterMachines(
  Iterable<Machine> machines, {
  MachineState? state,
  String query = '',
}) {
  final q = query.trim().toLowerCase();
  return machines.where((m) {
    if (state != null && m.state != state) return false;
    if (q.isEmpty) return true;
    return '${m.code} ${m.name} ${m.workshop}'.toLowerCase().contains(q);
  }).toList();
}
