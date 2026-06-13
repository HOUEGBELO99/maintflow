import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maintflow_mobile/data/auth/auth_repository.dart';
import 'package:maintflow_mobile/data/auth/remote_auth.dart';
import 'package:maintflow_mobile/data/auth/session_store.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/session_user.dart';

/// In-memory session store — never touches platform secure storage.
class _FakeSession extends SessionStore {
  String? savedToken;
  SessionUser? savedUser;
  String? savedRefresh;
  String? updatedToken;

  @override
  Future<void> save(
    String token,
    SessionUser user, {
    String? refreshToken,
  }) async {
    savedToken = token;
    savedUser = user;
    savedRefresh = refreshToken;
  }

  @override
  Future<void> updateAccessToken(String token) async => updatedToken = token;
}

class _FakeRemote implements RemoteAuth {
  _FakeRemote(this.token);
  final String token;

  @override
  String? get refreshToken => 'refresh-xyz';

  @override
  Future<String> signInWithPassword(String email, String password) async =>
      token;

  @override
  Future<void> signOut() async {}
}

class _Adapter implements HttpClientAdapter {
  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    final path = options.uri.path;
    if (path.endsWith('/auth/me')) {
      return _ok({
        'id': 'u1',
        'email': 's@maintflow.io',
        'name': 'Sophie Diallo',
        'role': 'technicien',
        'siteId': 'site-1',
      });
    }
    if (path.endsWith('/auth/dev-login')) {
      return _ok({
        'accessToken': 'dev-token',
        'user': {
          'id': 'u1',
          'email': 's.diallo@usine.fr',
          'name': 'Sophie Diallo',
          'role': 'technicien',
          'siteId': 'site-1',
        },
      });
    }
    return ResponseBody.fromString('', 404);
  }

  @override
  void close({bool force = false}) {}
}

ResponseBody _ok(Object body) => ResponseBody.fromString(
      jsonEncode(body),
      200,
      headers: <String, List<String>>{
        Headers.contentTypeHeader: <String>[Headers.jsonContentType],
      },
    );

Dio _dio() {
  final dio = Dio(BaseOptions(baseUrl: 'http://localhost:4000/api/v1'));
  dio.httpClientAdapter = _Adapter();
  return dio;
}

void main() {
  test('signIn (Supabase) hydrates the profile from /auth/me and saves it',
      () async {
    final session = _FakeSession();
    final repo = AuthRepository(_dio(), session, remote: _FakeRemote('acc-1'));

    final user = await repo.signIn('s@maintflow.io', 'pw');

    expect(user.name, 'Sophie Diallo');
    expect(user.role, UserRole.technicien);
    // Token is set before /auth/me so the interceptor can attach it…
    expect(session.updatedToken, 'acc-1');
    // …then the full session is persisted with the refresh token.
    expect(session.savedToken, 'acc-1');
    expect(session.savedRefresh, 'refresh-xyz');
    expect(session.savedUser?.id, 'u1');
  });

  test('signIn falls back to dev-login when no remote is configured', () async {
    final session = _FakeSession();
    final repo = AuthRepository(_dio(), session); // remote: null

    final user = await repo.signIn('s.diallo@usine.fr', 'ignored');

    expect(user.email, 's.diallo@usine.fr');
    expect(session.savedToken, 'dev-token');
    expect(session.savedRefresh, isNull);
  });
}
