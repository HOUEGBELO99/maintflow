import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:maintflow_mobile/core/network/api_client.dart';
import 'package:maintflow_mobile/data/auth/session_store.dart';
import 'package:maintflow_mobile/data/models/session_user.dart';

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(
    ref.watch(apiClientProvider),
    ref.watch(sessionStoreProvider),
  ),
);

/// Authentication against the API. Local dev uses the non-prod `dev-login`
/// route (same as the web); production will swap in Supabase Auth.
class AuthRepository {
  AuthRepository(this._dio, this._session);

  final Dio _dio;
  final SessionStore _session;

  Future<SessionUser> devLogin(String email) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/auth/dev-login',
      data: <String, String>{'email': email},
    );
    final body = res.data!;
    final user = SessionUser.fromJson(body['user'] as Map<String, dynamic>);
    await _session.save(body['accessToken'] as String, user);
    return user;
  }

  Future<void> logout() => _session.clear();
}
