/// Real identity provider (Supabase Auth) behind an interface, so the auth
/// repository can be exercised without a live Supabase project. When null,
/// the repository falls back to the API dev-login route.
abstract interface class RemoteAuth {
  /// Signs in with email/password and returns the access token. Throws on
  /// failure (bad credentials, no session).
  Future<String> signInWithPassword(String email, String password);

  /// The current refresh token, if the provider exposes one.
  String? get refreshToken;

  Future<void> signOut();
}
