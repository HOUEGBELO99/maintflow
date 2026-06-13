import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/models/session_user.dart';
import 'package:maintflow_mobile/features/auth/auth_controller.dart';
import 'package:maintflow_mobile/features/missions/missions_providers.dart';
import 'package:maintflow_mobile/features/profile/profile_screen.dart';

const _user = SessionUser(
  id: 'u1',
  email: 'sophie.diallo@maintflow.io',
  name: 'Sophie Diallo',
  role: UserRole.technicien,
  siteId: 'site-1',
);

Intervention _mission(String id, InterventionStatus status) => Intervention(
      id: id,
      machineId: 'm1',
      technicianId: 'u1',
      kind: InterventionKind.corrective,
      description: 'Tâche $id',
      scheduledFor: DateTime.utc(2026, 5, 21),
      duration: 2,
      status: status,
      linkedFaultId: null,
      planRuleId: null,
      actualDuration: null,
      rating: null,
      signedBy: null,
    );

/// Fake auth notifier: serves a fixed user and records logout.
class _FakeAuth extends AuthController {
  _FakeAuth(this._value);

  final SessionUser? _value;
  bool signedOut = false;

  @override
  Future<SessionUser?> build() async => _value;

  @override
  Future<void> signOut() async => signedOut = true;
}

void main() {
  group('userInitials', () {
    test('takes up to two upper-cased initials', () {
      expect(userInitials('Sophie Diallo'), 'SD');
      expect(userInitials('madonna'), 'M');
      expect(userInitials('  jean  de  dieu '), 'JD');
    });

    test('falls back to ? for an empty name', () {
      expect(userInitials('   '), '?');
    });
  });

  test('roleLabel maps every role', () {
    expect(roleLabel(UserRole.technicien), 'Technicien');
    expect(roleLabel(UserRole.chefAtelier), "Chef d'atelier");
    expect(roleLabel(UserRole.admin), 'Admin');
  });

  testWidgets('renders identity, KPIs and logs out', (tester) async {
    tester.view.physicalSize = const Size(1200, 2600);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    final fake = _FakeAuth(_user);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authControllerProvider.overrideWith(() => fake),
          missionsProvider.overrideWith(
            (ref) => Stream.value([
              _mission('i1', InterventionStatus.completed),
              _mission('i2', InterventionStatus.inProgress),
              _mission('i3', InterventionStatus.planned),
            ]),
          ),
        ],
        child: const MaterialApp(home: ProfileScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Sophie Diallo'), findsOneWidget);
    expect(find.text('SD'), findsOneWidget); // avatar initials
    expect(find.text('sophie.diallo@maintflow.io'), findsOneWidget);
    expect(find.text('3'), findsOneWidget); // missions assignées
    expect(find.text('Terminées'), findsOneWidget);

    await tester.tap(find.text('Se déconnecter'));
    await tester.pump();
    expect(fake.signedOut, isTrue);
  });
}
