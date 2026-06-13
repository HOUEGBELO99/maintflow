import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:maintflow_mobile/core/config/env.dart';
import 'package:maintflow_mobile/data/auth/supabase_token_refresher.dart';

/// Obtains a fresh access token when the current one is rejected (HTTP 401).
/// Production plugs in Supabase; local dev-login tokens are long-lived so the
/// refresher is a no-op.
abstract interface class TokenRefresher {
  /// Returns a new access token, or null when refresh is unavailable / failed.
  Future<String?> refresh();
}

/// Refresh disabled — used for the long-lived dev-login token.
class NoopTokenRefresher implements TokenRefresher {
  const NoopTokenRefresher();

  @override
  Future<String?> refresh() async => null;
}

final tokenRefresherProvider = Provider<TokenRefresher>((ref) {
  if (Env.isConfigured) return const SupabaseTokenRefresher();
  return const NoopTokenRefresher();
});
