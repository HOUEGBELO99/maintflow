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

  /// Report a new fault offline-first: queue the POST and try to flush. The
  /// server assigns the id, so nothing is cached locally; if offline the op is
  /// retained and replayed on reconnect. [body] is the API request body.
  Future<void> reportFault(Map<String, dynamic> body) async {
    await _db.enqueueOp('POST', '/faults', jsonEncode(body));
    await drain();
  }

  /// Attach a file to an intervention offline-first (e.g. the technician's
  /// closure signature). Queued after any pending PATCH so it reaches the
  /// server once the intervention is up to date; replayed on reconnect.
  Future<void> uploadInterventionFile(
    String interventionId, {
    required List<int> bytes,
    required String filename,
    required String mimeType,
    String kind = 'photo',
  }) async {
    await _db.enqueueOp(
      uploadMethod,
      '/files/interventions/$interventionId?kind=$kind',
      jsonEncode({
        'filename': filename,
        'mimeType': mimeType,
        'data': base64Encode(bytes),
      }),
    );
    await drain();
  }

  /// Queue marker for multipart uploads (the body holds the file in base64).
  static const uploadMethod = 'UPLOAD';

  /// Replay queued ops in order. Stops at the first network failure (kept for a
  /// later retry); drops ops the server rejects (4xx/5xx) to avoid poisoning.
  Future<void> drain() async {
    for (final op in await _db.pendingOps()) {
      try {
        if (op.method == uploadMethod) {
          final file = jsonDecode(op.body) as Map<String, dynamic>;
          await _dio.post<dynamic>(
            op.path,
            data: FormData.fromMap({
              'file': MultipartFile.fromBytes(
                base64Decode(file['data'] as String),
                filename: file['filename'] as String,
                contentType: DioMediaType.parse(file['mimeType'] as String),
              ),
            }),
          );
          await _db.deleteOp(op.id);
          continue;
        }
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
