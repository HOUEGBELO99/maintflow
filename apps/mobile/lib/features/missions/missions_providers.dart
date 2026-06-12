import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:maintflow_mobile/data/datasources/api_data_source.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/features/auth/auth_controller.dart';

/// The signed-in technician's interventions, soonest first.
final missionsProvider =
    FutureProvider.autoDispose<List<Intervention>>((ref) async {
  final user = ref.watch(authControllerProvider).valueOrNull;
  if (user == null) return const <Intervention>[];
  final missions =
      await ref.watch(apiDataSourceProvider).fetchMissions(user.id);
  return missions.toList()
    ..sort((a, b) => a.scheduledFor.compareTo(b.scheduledFor));
});

/// Machines indexed by id, for resolving names/workshops on mission rows.
final machinesByIdProvider =
    FutureProvider.autoDispose<Map<String, Machine>>((ref) async {
  final machines = await ref.watch(apiDataSourceProvider).fetchMachines();
  return <String, Machine>{for (final m in machines) m.id: m};
});
