import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:maintflow_mobile/data/auth/remote_auth.dart';

/// [RemoteAuth] backed by Supabase Auth. Only constructed when Supabase is
/// configured and initialized (see `main`).
class SupabaseRemoteAuth implements RemoteAuth {
  const SupabaseRemoteAuth();

  GoTrueClient get _auth => Supabase.instance.client.auth;

  @override
  Future<String> signInWithPassword(String email, String password) async {
    final res =
        await _auth.signInWithPassword(email: email, password: password);
    final token = res.session?.accessToken;
    if (token == null) {
      throw Exception('Supabase sign-in returned no session');
    }
    return token;
  }

  @override
  String? get refreshToken => _auth.currentSession?.refreshToken;

  @override
  Future<void> signOut() => _auth.signOut();
}
