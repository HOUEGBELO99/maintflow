import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/data/models/session_user.dart';
import 'package:maintflow_mobile/data/repositories/sync_service.dart';
import 'package:maintflow_mobile/features/auth/auth_controller.dart';
import 'package:maintflow_mobile/features/missions/close_work_screen.dart';
import 'package:maintflow_mobile/features/missions/missions_providers.dart';
import 'package:signature/signature.dart';

const _user = SessionUser(
  id: 'u1',
  email: 's@maintflow.io',
  name: 'Sophie Diallo',
  role: UserRole.technicien,
  siteId: 'site-1',
);

final _machine = Machine(
  id: 'm1',
  code: 'MCH-002',
  name: 'Convoyeur Ligne 2',
  type: 'convoyeur',
  workshop: 'Atelier A',
  installedAt: DateTime.utc(2019, 11, 2),
  state: MachineState.fault,
  runtime: 22510,
  criticality: Criticality.high,
  hourlyCost: 1800,
  lifespanYears: 15,
);

final _mission = Intervention(
  id: 'i-0000-aaaa',
  machineId: 'm1',
  technicianId: 'u1',
  kind: InterventionKind.corrective,
  description: 'Remplacement roulement',
  scheduledFor: DateTime.utc(2026, 5, 21),
  duration: 2,
  status: InterventionStatus.inProgress,
  linkedFaultId: 'f1',
  planRuleId: null,
  checklist: const [
    ChecklistItem(label: 'Consignation (LOTO)', done: true),
    ChecklistItem(label: 'Extraction roulement', done: true),
  ],
  actualDuration: null,
  rating: null,
  signedBy: null,
);

class _FakeAuth extends AuthController {
  @override
  Future<SessionUser?> build() async => _user;
}

class _RecordingSync implements SyncService {
  Intervention? updated;
  Map<String, dynamic>? body;

  @override
  Future<void> mutateIntervention(
    Intervention u,
    Map<String, dynamic> b,
  ) async {
    updated = u;
    body = b;
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  group('buildCloseBody', () {
    test('completes with actual duration and signer', () {
      expect(
        buildCloseBody(actualDuration: 2.5, signedBy: 'Sophie Diallo'),
        {
          'status': 'completed',
          'actualDuration': 2.5,
          'signedBy': 'Sophie Diallo',
        },
      );
    });
  });

  group('fmtHours', () {
    test('formats whole and fractional hours', () {
      expect(fmtHours(2), '2 h');
      expect(fmtHours(1.5), '1 h 30');
      expect(fmtHours(0.5), '30 min');
    });
  });

  testWidgets('signing closes the intervention as completed', (tester) async {
    tester.view.physicalSize = const Size(1200, 3200);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    final sync = _RecordingSync();
    final router = GoRouter(
      initialLocation: '/missions/${_mission.id}/close',
      routes: [
        GoRoute(
          path: '/missions',
          builder: (_, __) => const Scaffold(body: Text('missions')),
        ),
        GoRoute(
          path: '/missions/:id/close',
          builder: (_, state) =>
              CloseWorkScreen(missionId: state.pathParameters['id']!),
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authControllerProvider.overrideWith(_FakeAuth.new),
          missionsProvider.overrideWith((ref) => Stream.value([_mission])),
          machinesByIdProvider.overrideWith(
            (ref) => Stream.value({'m1': _machine}),
          ),
          syncServiceProvider.overrideWithValue(sync),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();

    // The report renders and the CTA is gated on a signature.
    expect(find.text('Convoyeur Ligne 2 · MCH-002'), findsOneWidget);
    expect(find.text('Signez pour clôturer'), findsOneWidget);

    // Draw a stroke on the signature pad.
    final pad = tester.getCenter(find.byType(Signature));
    final gesture = await tester.startGesture(pad);
    await gesture.moveBy(const Offset(24, 12));
    await gesture.moveBy(const Offset(24, -12));
    await gesture.up();
    await tester.pumpAndSettle();

    expect(find.text('Clôturer & générer le PDF'), findsOneWidget);
    await tester.tap(find.text('Clôturer & générer le PDF'));
    await tester.pump();

    expect(sync.updated?.status, InterventionStatus.completed);
    expect(sync.body?['status'], 'completed');
    expect(sync.body?['signedBy'], 'Sophie Diallo');
    expect(sync.body?['actualDuration'], _mission.duration);
  });
}
