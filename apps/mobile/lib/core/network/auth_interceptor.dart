import 'package:dio/dio.dart';

import 'package:maintflow_mobile/data/auth/session_store.dart';
import 'package:maintflow_mobile/data/auth/token_refresher.dart';

/// Attaches the bearer token to every request, and on a 401 tries to refresh
/// the access token once and replay the request. Concurrent 401s share a single
/// refresh (single-flight), and a request is retried at most once to avoid loops.
///
/// When a 401 can't be recovered (no refresh possible, or still 401 after the
/// refresh) the stored session is dead — e.g. the account was recreated, or a
/// session from another environment was restored — and [onSessionExpired]
/// fires so the app signs out instead of showing empty screens.
class AuthInterceptor extends Interceptor {
  AuthInterceptor({
    required this.dio,
    required this.tokens,
    required this.refresher,
    this.onSessionExpired,
  });

  /// The same client this interceptor is attached to, used to replay requests.
  final Dio dio;
  final AccessTokenStore tokens;
  final TokenRefresher refresher;
  final void Function()? onSessionExpired;

  static const _retriedKey = '__authRetried';

  /// Sign-in calls report their own 401s (wrong account / missing profile).
  static bool _isAuthCall(RequestOptions o) =>
      o.path.endsWith('/auth/me') || o.path.endsWith('/auth/dev-login');

  void _expire(RequestOptions o) {
    if (!_isAuthCall(o)) onSessionExpired?.call();
  }

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
    if (err.response?.statusCode != 401) return handler.next(err);
    if (alreadyRetried) {
      _expire(err.requestOptions);
      return handler.next(err);
    }

    final newToken = await (_inflight ??= _refresh());
    if (newToken == null) {
      _expire(err.requestOptions);
      return handler.next(err);
    }

    await tokens.updateAccessToken(newToken);

    final options = err.requestOptions
      ..extra[_retriedKey] = true
      ..headers['Authorization'] = 'Bearer $newToken';
    try {
      final response = await dio.fetch<dynamic>(options);
      return handler.resolve(response);
    } on DioException catch (e) {
      // A replayed request that 401s again already went through onError
      // (alreadyRetried) and reported the expiry there.
      return handler.next(e);
    }
  }

  Future<String?> _refresh() async {
    try {
      return await refresher.refresh();
    } on Object {
      return null; // A failed refresh means the session is gone.
    } finally {
      _inflight = null;
    }
  }
}
