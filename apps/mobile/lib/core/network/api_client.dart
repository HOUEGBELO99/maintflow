import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:maintflow_mobile/core/config/env.dart';
import 'package:maintflow_mobile/core/network/auth_interceptor.dart';
import 'package:maintflow_mobile/data/auth/session_store.dart';
import 'package:maintflow_mobile/data/auth/token_refresher.dart';

/// Dio configured against the NestJS API. [AuthInterceptor] attaches the current
/// access token (held in [SessionStore]) to every request and, on a 401,
/// refreshes the token once via [TokenRefresher] and replays the request.
final apiClientProvider = Provider<Dio>((ref) {
  final session = ref.watch(sessionStoreProvider);
  final refresher = ref.watch(tokenRefresherProvider);

  final dio = Dio(
    BaseOptions(
      baseUrl: '${Env.apiUrl}/api/v1',
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 20),
      contentType: 'application/json',
    ),
  );

  dio.interceptors.add(
    AuthInterceptor(dio: dio, tokens: session, refresher: refresher),
  );

  return dio;
});
