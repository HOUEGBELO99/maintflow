import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/fault.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/data/models/session_user.dart';
import 'package:maintflow_mobile/data/repositories/missions_repository.dart';
import 'package:maintflow_mobile/features/alerts/alerts_providers.dart';
import 'package:maintflow_mobile/features/auth/auth_controller.dart';
import 'package:maintflow_mobile/features/machines/machines_providers.dart';
import 'package:maintflow_mobile/features/missions/missions_providers.dart';

const _user = SessionUser(
  id: 'u1',
  email: 's@maintflow.io',
  name: 'Sophie Diallo',
  role: UserRole.technicien,
  siteId: 'site-1',
);

/// Session restored asynchronously, like secure storage on a cold start.
class _RestoringAuth extends AuthController {
  _RestoringAuth(this.restored);
  final Completer<SessionUser?> restored;

  @override
  Future<SessionUser?> build() => restored.future;
}

class _CountingRepo implements MissionsRepository {
  int machineRefreshes = 0;
  int faultRefreshes = 0;

  @override
  Future<void> refreshMachines() async => machineRefreshes++;

  @override
  Future<void> refreshFaults() async => faultRefreshes++;

  @override
  Stream<List<Machine>> watchMachines() => Stream.value(const []);

  @override
  Stream<List<Fault>> watchFaults() => Stream.value(const []);

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  test(
      'machine/fault caches wait for the restored session before refreshing '
      '(a refresh without token 401s and left the parc empty)', () async {
    final repo = _CountingRepo();
    final restored = Completer<SessionUser?>();
    final container = ProviderContainer(
      overrides: [
        missionsRepositoryProvider.overrideWithValue(repo),
        authControllerProvider.overrideWith(() => _RestoringAuth(restored)),
      ],
    );
    addTearDown(container.dispose);

    final subs = [
      container.listen(machinesByIdProvider, (_, __) {}),
      container.listen(machinesListProvider, (_, __) {}),
      container.listen(faultsProvider, (_, __) {}),
    ];
    await Future<void>.delayed(Duration.zero);
    expect(repo.machineRefreshes, 0, reason: 'no token yet — must not fire');
    expect(repo.faultRefreshes, 0);

    restored.complete(_user);
    await Future<void>.delayed(Duration.zero);
    await Future<void>.delayed(Duration.zero);

    expect(repo.machineRefreshes, 2, reason: 'by-id map + parc list');
    expect(repo.faultRefreshes, 1);
    for (final s in subs) {
      s.close();
    }
  });
}
