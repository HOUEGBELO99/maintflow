import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:maintflow_mobile/core/network/api_client.dart';
import 'package:maintflow_mobile/data/models/attachment.dart';
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

  /// Attachments (with signed URLs) for a fault — `GET /files/faults/:id`.
  Future<List<Attachment>> fetchFaultAttachments(String faultId) =>
      _list('/files/faults/$faultId', Attachment.fromJson);

  /// Create a fault online and return its server id (needed to attach a photo).
  /// Used only for the photo path; the offline path goes through the sync queue.
  Future<String> createFault(Map<String, dynamic> body) async {
    final res = await _dio.post<Map<String, dynamic>>('/faults', data: body);
    return res.data!['id'] as String;
  }

  /// Upload a photo for a fault (multipart → `POST /files/faults/:id`).
  Future<void> uploadFaultPhoto(
    String faultId, {
    required List<int> bytes,
    required String filename,
    required String mimeType,
  }) async {
    final form = FormData.fromMap({
      'file': MultipartFile.fromBytes(
        bytes,
        filename: filename,
        contentType: DioMediaType.parse(mimeType),
      ),
    });
    await _dio.post<dynamic>('/files/faults/$faultId', data: form);
  }
}
