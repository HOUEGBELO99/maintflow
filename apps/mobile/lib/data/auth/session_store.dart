import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:maintflow_mobile/data/models/session_user.dart';

final sessionStoreProvider = Provider<SessionStore>((ref) => SessionStore());

/// Persists the access token + signed-in user in the OS secure store, and keeps
/// the token in memory so the Dio interceptor can read it synchronously.
class SessionStore {
  SessionStore({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;
  static const _tokenKey = 'mf_access_token';
  static const _userKey = 'mf_session_user';

  String? _token;
  String? get token => _token;

  /// Hydrate from disk on startup; returns the persisted user if still signed in.
  Future<SessionUser?> load() async {
    _token = await _storage.read(key: _tokenKey);
    final raw = await _storage.read(key: _userKey);
    if (_token == null || raw == null) return null;
    return SessionUser.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }

  Future<void> save(String token, SessionUser user) async {
    _token = token;
    await _storage.write(key: _tokenKey, value: token);
    await _storage.write(key: _userKey, value: jsonEncode(user.toJson()));
  }

  Future<void> clear() async {
    _token = null;
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _userKey);
  }
}
