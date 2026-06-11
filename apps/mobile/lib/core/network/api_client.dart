import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:maintflow_mobile/core/config/env.dart';

/// Dio configured against the NestJS API.
/// An interceptor attaches the current Supabase access token to every request,
/// and triggers a session refresh on 401.
final apiClientProvider = Provider<Dio>((ref) {
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
        final token = Supabase.instance.client.auth.currentSession?.accessToken;
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Attempt a one-shot refresh; the auth layer will redirect on failure.
          await Supabase.instance.client.auth.refreshSession();
        }
        handler.next(error);
      },
    ),
  );

  return dio;
});
