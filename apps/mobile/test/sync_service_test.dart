import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maintflow_mobile/data/local/app_database.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/repositories/sync_service.dart';

class _OkAdapter implements HttpClientAdapter {
  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async =>
      ResponseBody.fromString(jsonEncode(<String, dynamic>{}), 200);

  @override
  void close({bool force = false}) {}
}

class _OfflineAdapter implements HttpClientAdapter {
  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async =>
      throw Exception('offline');

  @override
  void close({bool force = false}) {}
}

Intervention _mission(InterventionStatus status) =>
    Intervention.fromJson(<String, dynamic>{
      'id': 'i1',
      'machineId': 'm1',
      'technicianId': 'u1',
      'kind': 'corrective',
      'description': 'Mission',
      'scheduledFor': '2026-05-21T00:00:00.000Z',
      'duration': 2,
      'status': status.name == 'inProgress' ? 'in_progress' : status.name,
      'linkedFaultId': null,
      'planRuleId': null,
      'checklist': <dynamic>[],
      'partsUsed': <dynamic>[],
      'actualDuration': null,
      'rating': null,
      'signedBy': null,
    });

Dio _dio(HttpClientAdapter adapter) {
  final dio = Dio(BaseOptions(baseUrl: 'http://localhost:4000/api/v1'));
  dio.httpClientAdapter = adapter;
  return dio;
}

void main() {
  late AppDatabase db;

  setUp(() async {
    db = AppDatabase.forTesting(NativeDatabase.memory());
    await db.replaceInterventions([_mission(InterventionStatus.planned)]);
  });
  tearDown(() => db.close());

  test('mutation updates the cache instantly and clears the queue on success',
      () async {
    final sync = SyncService(db, _dio(_OkAdapter()));

    await sync.mutateIntervention(
      _mission(InterventionStatus.inProgress),
      <String, dynamic>{'status': 'in_progress'},
    );

    final cached = await db.watchInterventions().first;
    expect(cached.single.status, InterventionStatus.inProgress);
    expect(await db.pendingOps(), isEmpty); // flushed
  });

  test('mutation keeps the op queued while offline, then flushes when online',
      () async {
    final offline = SyncService(db, _dio(_OfflineAdapter()));

    await offline.mutateIntervention(
      _mission(InterventionStatus.inProgress),
      <String, dynamic>{'status': 'in_progress'},
    );

    // Cache reflects the change immediately; the op is retained for retry.
    final cached = await db.watchInterventions().first;
    expect(cached.single.status, InterventionStatus.inProgress);
    expect(await db.pendingOps(), hasLength(1));

    // Connectivity returns → draining flushes the queue.
    await SyncService(db, _dio(_OkAdapter())).drain();
    expect(await db.pendingOps(), isEmpty);
  });
}
