import 'package:dio/dio.dart';

import 'package:maintflow_mobile/data/auth/session_store.dart';
import 'package:maintflow_mobile/data/auth/token_refresher.dart';

/// Attaches the bearer token to every request, and on a 401 tries to refresh
/// the access token once and replay the request. Concurrent 401s share a single
/// refresh (single-flight), and a request is retried at most once to avoid loops.
class AuthInterceptor extends Interceptor {
  AuthInterceptor({
    required this.dio,
    required this.tokens,
    required this.refresher,
  });

  /// The same client this interceptor is attached to, used to replay requests.
  final Dio dio;
  final AccessTokenStore tokens;
  final TokenRefresher refresher;

  static const _retriedKey = '__authRetried';

  Future<String?>? _inflight;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final token = tokens.token;
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final alreadyRetried = err.requestOptions.extra[_retriedKey] == true;
    if (err.response?.statusCode != 401 || alreadyRetried) {
      return handler.next(err);
    }

    final newToken = await (_inflight ??= _refresh());
    if (newToken == null) return handler.next(err);

    await tokens.updateAccessToken(newToken);

    final options = err.requestOptions
      ..extra[_retriedKey] = true
      ..headers['Authorization'] = 'Bearer $newToken';
    try {
      final response = await dio.fetch<dynamic>(options);
      return handler.resolve(response);
    } on DioException catch (e) {
      return handler.next(e);
    }
  }

  Future<String?> _refresh() async {
    try {
      return await refresher.refresh();
    } finally {
      _inflight = null;
    }
  }
}
