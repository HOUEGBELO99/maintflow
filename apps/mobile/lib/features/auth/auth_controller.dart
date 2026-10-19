import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:maintflow_mobile/data/auth/auth_repository.dart';
import 'package:maintflow_mobile/data/auth/session_store.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/session_user.dart';

/// True after the app signed out on its own because the stored session was
/// rejected; the login screen explains it, then clears it.
final sessionExpiredProvider = StateProvider<bool>((ref) => false);

/// Mirrors MANAGE_INTERVENTIONS in packages/shared (ROLE_PERMISSIONS): who may
/// start, tick and close interventions. Operators only consult them.
final canWorkOnInterventionsProvider = Provider<bool>((ref) {
  final role = ref.watch(authControllerProvider).valueOrNull?.role;
  return role == UserRole.admin ||
      role == UserRole.chefMaintenance ||
      role == UserRole.technicien;
});

final authControllerProvider =
    AsyncNotifierProvider<AuthController, SessionUser?>(
  AuthController.new,
);

/// Holds the current auth state. `null` data = signed out.
class AuthController extends AsyncNotifier<SessionUser?> {
  @override
  Future<SessionUser?> build() => ref.read(sessionStoreProvider).load();

  Future<void> signIn(String email, String password) async {
    ref.read(sessionExpiredProvider.notifier).state = false;
    state = const AsyncLoading<SessionUser?>();
    state = await AsyncValue.guard(
      () => ref.read(authRepositoryProvider).signIn(email, password),
    );
  }

  Future<void> signOut() async {
    await ref.read(authRepositoryProvider).logout();
    state = const AsyncData<SessionUser?>(null);
  }

  /// The API rejected the stored session and it could not be refreshed: drop
  /// it and return to the login screen (once, even if several calls fail).
  Future<void> expireSession() async {
    if (state.valueOrNull == null) return;
    ref.read(sessionExpiredProvider.notifier).state = true;
    await signOut();
  }
}
