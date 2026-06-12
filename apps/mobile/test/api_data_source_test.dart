import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maintflow_mobile/data/datasources/api_data_source.dart';
import 'package:maintflow_mobile/data/models/enums.dart';

/// Minimal Dio adapter that returns canned JSON and captures the request,
/// so the data source can be tested without a live API or a mock library.
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

void main() {
  test('fetchMissions filters by technicianId and maps the payload', () async {
    late RequestOptions captured;
    final dio = Dio(BaseOptions(baseUrl: 'http://localhost:4000/api/v1'));
    dio.httpClientAdapter = _FakeAdapter((options) {
      captured = options;
      return _ok(<Map<String, dynamic>>[
        <String, dynamic>{
          'id': 'i1',
          'machineId': 'm1',
          'technicianId': 'u1',
          'kind': 'corrective',
          'description': 'Remplacement roulement',
          'scheduledFor': '2026-05-21T00:00:00.000Z',
          'duration': 4,
          'status': 'in_progress',
          'linkedFaultId': 'f1',
          'planRuleId': null,
          'checklist': <dynamic>[],
          'partsUsed': <dynamic>[],
          'actualDuration': null,
          'rating': null,
          'signedBy': null,
        },
      ]);
    });

    final missions = await ApiDataSource(dio).fetchMissions('u1');

    expect(captured.path, '/interventions');
    expect(captured.queryParameters['technicianId'], 'u1');
    expect(missions, hasLength(1));
    expect(missions.single.status, InterventionStatus.inProgress);
    expect(missions.single.kind, InterventionKind.corrective);
  });
}
