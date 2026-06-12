import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maintflow_mobile/data/datasources/api_data_source.dart';
import 'package:maintflow_mobile/data/local/app_database.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/repositories/missions_repository.dart';

class _FakeAdapter implements HttpClientAdapter {
  _FakeAdapter(this.handler);
  final ResponseBody Function(RequestOptions options) handler;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async =>
      handler(options);

  @override
  void close({bool force = false}) {}
}

ResponseBody _ok(Object body) => ResponseBody.fromString(
      jsonEncode(body),
      200,
      headers: <String, List<String>>{
        Headers.contentTypeHeader: <String>[Headers.jsonContentType],
      },
    );

Map<String, dynamic> _missionJson(String id, String status) =>
    <String, dynamic>{
      'id': id,
      'machineId': 'm1',
      'technicianId': 'u1',
      'kind': 'corrective',
      'description': 'Mission $id',
      'scheduledFor': '2026-05-21T00:00:00.000Z',
      'duration': 2,
      'status': status,
      'linkedFaultId': null,
      'planRuleId': null,
      'checklist': <dynamic>[],
      'partsUsed': <dynamic>[],
      'actualDuration': null,
      'rating': null,
      'signedBy': null,
    };

void main() {
  late AppDatabase db;

  setUp(() => db = AppDatabase.forTesting(NativeDatabase.memory()));
  tearDown(() => db.close());

  test('replace + watch caches interventions and propagates deletions',
      () async {
    await db.replaceInterventions([
      Intervention.fromJson(_missionJson('i1', 'planned')),
      Intervention.fromJson(_missionJson('i2', 'planned')),
    ]);
    expect(await db.watchInterventions().first, hasLength(2));

    // A later sync that drops i2 must remove it from the cache.
    await db.replaceInterventions(
      [Intervention.fromJson(_missionJson('i1', 'completed'))],
    );
    final after = await db.watchInterventions().first;
    expect(after, hasLength(1));
    expect(after.single.id, 'i1');
    expect(after.single.status, InterventionStatus.completed);
  });

  test('refreshMissions writes the API response through to the offline cache',
      () async {
    final dio = Dio(BaseOptions(baseUrl: 'http://localhost:4000/api/v1'));
    dio.httpClientAdapter =
        _FakeAdapter((_) => _ok([_missionJson('i9', 'in_progress')]));

    final repo = MissionsRepository(db, ApiDataSource(dio));
    await repo.refreshMissions('u1');

    final cached = await repo.watchMissions().first;
    expect(cached.single.id, 'i9');
    expect(cached.single.status, InterventionStatus.inProgress);
  });
}
