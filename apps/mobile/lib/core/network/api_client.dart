import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:maintflow_mobile/core/config/env.dart';
import 'package:maintflow_mobile/data/auth/session_store.dart';

/// Dio configured against the NestJS API. An interceptor attaches the current
/// access token (held in [SessionStore]) to every request.
///
/// Token refresh is a no-op for now: local dev uses long-lived dev-login
/// tokens. Real Supabase session refresh on 401 lands with the auth wiring.
final apiClientProvider = Provider<Dio>((ref) {
  final session = ref.watch(sessionStoreProvider);

  final dio = Dio(
    BaseOptions(
      baseUrl: '${Env.apiUrl}/api/v1',
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 20),
      contentType: 'application/json',
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        final token = session.token;
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
    ),
  );

  return dio;
});
