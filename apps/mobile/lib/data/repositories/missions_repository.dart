import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:maintflow_mobile/data/datasources/api_data_source.dart';
import 'package:maintflow_mobile/data/local/app_database.dart';
import 'package:maintflow_mobile/data/models/fault.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/models/machine.dart';

final missionsRepositoryProvider = Provider<MissionsRepository>(
  (ref) => MissionsRepository(
    ref.watch(appDatabaseProvider),
    ref.watch(apiDataSourceProvider),
  ),
);

/// Offline-first repository: the UI reads the local Drift cache (the source of
/// truth), and refreshes write through to it. Refresh failures are the caller's
/// to swallow so the cached data keeps showing when the device is offline.
class MissionsRepository {
  MissionsRepository(this._db, this._api);

  final AppDatabase _db;
  final ApiDataSource _api;

  Stream<List<Intervention>> watchMissions() => _db.watchInterventions();

  Stream<List<Machine>> watchMachines() => _db.watchMachines();

  Stream<List<Fault>> watchFaults() => _db.watchFaults();

  Future<void> refreshMissions(String technicianId) async {
    await _db.replaceInterventions(await _api.fetchMissions(technicianId));
  }

  Future<void> refreshMachines() async {
    await _db.replaceMachines(await _api.fetchMachines());
  }

  Future<void> refreshFaults() async {
    await _db.replaceFaults(await _api.fetchFaults());
  }
}
