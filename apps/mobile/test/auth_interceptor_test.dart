import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maintflow_mobile/core/network/auth_interceptor.dart';
import 'package:maintflow_mobile/data/auth/session_store.dart';
import 'package:maintflow_mobile/data/auth/token_refresher.dart';

class _Store implements AccessTokenStore {
  _Store(this._token);
  String? _token;
  final updates = <String>[];

  @override
  String? get token => _token;

  @override
  Future<void> updateAccessToken(String token) async {
    _token = token;
    updates.add(token);
  }
}

class _Refresher implements TokenRefresher {
  _Refresher(this._next);
  final String? _next;
  int calls = 0;

  @override
  Future<String?> refresh() async {
    calls++;
    return _next;
  }
}

/// Adapter that replies based on the request's Authorization header / a fixed
/// status, counting how many times it was hit.
class _Adapter implements HttpClientAdapter {
  _Adapter(this.reply);
  final ResponseBody Function(RequestOptions options) reply;
  int calls = 0;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    calls++;
    return reply(options);
  }

  @override
  void close({bool force = false}) {}
}

ResponseBody _status(int code, [Object body = '']) => ResponseBody.fromString(
      jsonEncode(body),
      code,
      headers: <String, List<String>>{
        Headers.contentTypeHeader: <String>[Headers.jsonContentType],
      },
    );

Dio _dio(_Adapter adapter, _Store store, _Refresher refresher) {
  final dio = Dio(BaseOptions(baseUrl: 'http://localhost:4000/api/v1'));
  dio.httpClientAdapter = adapter;
  dio.interceptors.add(
    AuthInterceptor(dio: dio, tokens: store, refresher: refresher),
  );
  return dio;
}

void main() {
  test('attaches the bearer token to requests', () async {
    String? seen;
    final adapter = _Adapter((o) {
      seen = o.headers['Authorization'] as String?;
      return _status(200, {'ok': true});
    });
    await _dio(adapter, _Store('tok'), _Refresher(null)).get<dynamic>('/x');
    expect(seen, 'Bearer tok');
  });

  test('refreshes and retries once on 401, then succeeds', () async {
    final store = _Store('old');
    final refresher = _Refresher('new-token');
    final adapter = _Adapter(
      (o) => o.headers['Authorization'] == 'Bearer new-token'
          ? _status(200, {'ok': true})
          : _status(401),
    );

    final res = await _dio(adapter, store, refresher).get<dynamic>('/x');

    expect(res.statusCode, 200);
    expect(refresher.calls, 1);
    expect(store.updates, ['new-token']);
    expect(adapter.calls, 2); // initial 401 + retried 200
  });

  test('propagates the 401 when refresh is unavailable', () async {
    final store = _Store('old');
    final refresher = _Refresher(null);
    final adapter = _Adapter((_) => _status(401));

    await expectLater(
      _dio(adapter, store, refresher).get<dynamic>('/x'),
      throwsA(
        isA<DioException>().having(
          (e) => e.response?.statusCode,
          'status',
          401,
        ),
      ),
    );
    expect(refresher.calls, 1);
    expect(store.updates, isEmpty);
  });

  test('does not refresh on non-401 errors', () async {
    final refresher = _Refresher('new-token');
    final adapter = _Adapter((_) => _status(500));

    await expectLater(
      _dio(adapter, _Store('old'), refresher).get<dynamic>('/x'),
      throwsA(isA<DioException>()),
    );
    expect(refresher.calls, 0);
  });

  test('retries at most once (no refresh loop) when 401 persists', () async {
    final refresher = _Refresher('new-token');
    final adapter = _Adapter((_) => _status(401));

    await expectLater(
      _dio(adapter, _Store('old'), refresher).get<dynamic>('/x'),
      throwsA(isA<DioException>()),
    );
    expect(refresher.calls, 1); // one refresh attempt only
    expect(adapter.calls, 2); // initial + single retry
  });
}
