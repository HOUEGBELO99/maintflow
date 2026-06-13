import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:maintflow_mobile/core/config/env.dart';
import 'package:maintflow_mobile/core/network/api_client.dart';
import 'package:maintflow_mobile/data/auth/remote_auth.dart';
import 'package:maintflow_mobile/data/auth/session_store.dart';
import 'package:maintflow_mobile/data/auth/supabase_remote_auth.dart';
import 'package:maintflow_mobile/data/models/session_user.dart';

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(
    ref.watch(apiClientProvider),
    ref.watch(sessionStoreProvider),
    // Real Supabase Auth in prod; null locally → API dev-login fallback.
    remote: Env.isConfigured ? const SupabaseRemoteAuth() : null,
  ),
);

/// Authentication. In production, sign-in goes through Supabase Auth and the
/// app profile (role/siteId/name) is hydrated from `GET /auth/me`. Locally
/// (Supabase unconfigured) it falls back to the API `dev-login` route.
class AuthRepository {
  AuthRepository(this._dio, this._session, {RemoteAuth? remote})
      : _remote = remote;

  final Dio _dio;
  final SessionStore _session;
  final RemoteAuth? _remote;

  /// Sign in with email/password. Returns the authenticated profile.
  Future<SessionUser> signIn(String email, String password) async {
    final remote = _remote;
    if (remote == null) {
      // Local dev: dev-login (password is ignored by the seeded-user route).
      return devLogin(email);
    }
    final token = await remote.signInWithPassword(email, password);
    // Make the token available to the interceptor before hydrating the profile.
    await _session.updateAccessToken(token);
    final res = await _dio.get<Map<String, dynamic>>('/auth/me');
    final user = SessionUser.fromJson(res.data!);
    await _session.save(token, user, refreshToken: remote.refreshToken);
    return user;
  }

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

  Future<void> logout() async {
    await _remote?.signOut();
    await _session.clear();
  }
}
