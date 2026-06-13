import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:maintflow_mobile/data/auth/token_refresher.dart';

/// Production [TokenRefresher]: asks the Supabase client to refresh the session
/// (using its stored refresh token) and hands back the new access token. Only
/// constructed when Supabase is configured and initialized (see `main`).
class SupabaseTokenRefresher implements TokenRefresher {
  const SupabaseTokenRefresher();

  @override
  Future<String?> refresh() async {
    try {
      final res = await Supabase.instance.client.auth.refreshSession();
      return res.session?.accessToken;
    } catch (_) {
      return null;
    }
  }
}
