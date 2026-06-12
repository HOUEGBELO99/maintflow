import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:maintflow_mobile/data/auth/auth_repository.dart';
import 'package:maintflow_mobile/data/auth/session_store.dart';
import 'package:maintflow_mobile/data/models/session_user.dart';

final authControllerProvider =
    AsyncNotifierProvider<AuthController, SessionUser?>(
  AuthController.new,
);

/// Holds the current auth state. `null` data = signed out.
class AuthController extends AsyncNotifier<SessionUser?> {
  @override
  Future<SessionUser?> build() => ref.read(sessionStoreProvider).load();

  Future<void> signInDev(String email) async {
    state = const AsyncLoading<SessionUser?>();
    state = await AsyncValue.guard(
      () => ref.read(authRepositoryProvider).devLogin(email),
    );
  }

  Future<void> signOut() async {
    await ref.read(authRepositoryProvider).logout();
    state = const AsyncData<SessionUser?>(null);
  }
}
