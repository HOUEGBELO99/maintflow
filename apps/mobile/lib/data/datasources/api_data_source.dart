import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:maintflow_mobile/core/network/api_client.dart';
import 'package:maintflow_mobile/data/models/fault.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/models/machine.dart';

final apiDataSourceProvider = Provider<ApiDataSource>(
  (ref) => ApiDataSource(ref.watch(apiClientProvider)),
);

/// Thin typed wrapper over the REST API. The offline-first repository layer
/// reads the local Drift cache first and refreshes through this source.
class ApiDataSource {
  ApiDataSource(this._dio);

  final Dio _dio;

  Future<List<T>> _list<T>(
    String path,
    T Function(Map<String, dynamic>) parse, {
    Map<String, dynamic>? query,
  }) async {
    final res = await _dio.get<List<dynamic>>(path, queryParameters: query);
    return res.data!.map((e) => parse(e as Map<String, dynamic>)).toList();
  }

  /// Interventions assigned to the given technician (the mobile user).
  Future<List<Intervention>> fetchMissions(String technicianId) => _list(
        '/interventions',
        Intervention.fromJson,
        query: {'technicianId': technicianId},
      );

  Future<List<Machine>> fetchMachines() => _list('/machines', Machine.fromJson);

  Future<List<Fault>> fetchFaults() => _list('/faults', Fault.fromJson);
}
