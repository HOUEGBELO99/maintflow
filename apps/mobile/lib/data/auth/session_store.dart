import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:maintflow_mobile/data/models/session_user.dart';

final sessionStoreProvider = Provider<SessionStore>((ref) => SessionStore());

/// Read/write access to the current access token, for the Dio auth interceptor.
abstract interface class AccessTokenStore {
  String? get token;

  /// Swap in a freshly-refreshed access token (memory + disk).
  Future<void> updateAccessToken(String token);
}

/// Persists the access token, refresh token and signed-in user in the OS secure
/// store, and keeps the access token in memory so the Dio interceptor can read
/// it synchronously.
class SessionStore implements AccessTokenStore {
  SessionStore({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;
  static const _tokenKey = 'mf_access_token';
  static const _refreshKey = 'mf_refresh_token';
  static const _userKey = 'mf_session_user';

  String? _token;
  @override
  String? get token => _token;

  String? _refreshToken;
  String? get refreshToken => _refreshToken;

  /// Hydrate from disk on startup; returns the persisted user if still signed in.
  Future<SessionUser?> load() async {
    _token = await _storage.read(key: _tokenKey);
    _refreshToken = await _storage.read(key: _refreshKey);
    final raw = await _storage.read(key: _userKey);
    if (_token == null || raw == null) return null;
    return SessionUser.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }

  Future<void> save(
    String token,
    SessionUser user, {
    String? refreshToken,
  }) async {
    _token = token;
    _refreshToken = refreshToken;
    await _storage.write(key: _tokenKey, value: token);
    await _storage.write(key: _userKey, value: jsonEncode(user.toJson()));
    if (refreshToken != null) {
      await _storage.write(key: _refreshKey, value: refreshToken);
    } else {
      await _storage.delete(key: _refreshKey);
    }
  }

  @override
  Future<void> updateAccessToken(String token) async {
    _token = token;
    await _storage.write(key: _tokenKey, value: token);
  }

  Future<void> clear() async {
    _token = null;
    _refreshToken = null;
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _refreshKey);
    await _storage.delete(key: _userKey);
  }
}
