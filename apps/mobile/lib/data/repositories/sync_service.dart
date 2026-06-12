import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:maintflow_mobile/core/network/api_client.dart';
import 'package:maintflow_mobile/data/local/app_database.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';

final syncServiceProvider = Provider<SyncService>(
  (ref) =>
      SyncService(ref.watch(appDatabaseProvider), ref.watch(apiClientProvider)),
);

/// Offline write path. Mutations update the local cache immediately (so the UI
/// reacts at once) and enqueue the API call to be replayed when online.
class SyncService {
  SyncService(this._db, this._dio);

  final AppDatabase _db;
  final Dio _dio;

  /// Apply an intervention edit offline-first: write the new state to the cache,
  /// queue the PATCH, and try to flush. [patch] is the API request body.
  Future<void> mutateIntervention(
    Intervention updated,
    Map<String, dynamic> patch,
  ) async {
    await _db.upsertIntervention(updated);
    await _db.enqueueOp(
      'PATCH',
      '/interventions/${updated.id}',
      jsonEncode(patch),
    );
    await drain();
  }

  /// Replay queued ops in order. Stops at the first network failure (kept for a
  /// later retry); drops ops the server rejects (4xx/5xx) to avoid poisoning.
  Future<void> drain() async {
    for (final op in await _db.pendingOps()) {
      try {
        await _dio.request<dynamic>(
          op.path,
          data: jsonDecode(op.body),
          options: Options(method: op.method),
        );
        await _db.deleteOp(op.id);
      } on DioException catch (e) {
        if (e.response != null) {
          await _db.deleteOp(op.id);
        } else {
          break;
        }
      }
    }
  }

  Stream<int> watchPending() => _db.watchPendingCount();
}
