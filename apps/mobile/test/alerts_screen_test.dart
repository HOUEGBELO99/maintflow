import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maintflow_mobile/core/network/connectivity.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/fault.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/features/alerts/alerts_providers.dart';
import 'package:maintflow_mobile/features/alerts/alerts_screen.dart';
import 'package:maintflow_mobile/features/missions/missions_providers.dart';

final _machine = Machine(
  id: 'm1',
  code: 'MCH-002',
  name: 'Convoyeur Ligne 2',
  type: 'convoyeur',
  workshop: 'Atelier A',
  installedAt: DateTime.utc(2019),
  state: MachineState.fault,
  runtime: 1000,
  criticality: Criticality.high,
  hourlyCost: 1000,
  lifespanYears: 10,
);

Fault _f(String id, FaultSeverity sev, FaultStatus status, String desc) =>
    Fault(
      id: id,
      machineId: 'm1',
      type: FaultType.mecanique,
      description: desc,
      reportedAt: DateTime.utc(2026, 5, 21, 8),
      reportedBy: 'u1',
      severity: sev,
      status: status,
      rootCause: null,
      hasPhoto: false,
      takenAt: null,
    );

final _feed = [
  _f('f1', FaultSeverity.critical, FaultStatus.pending, 'Fuite vapeur'),
  _f('f2', FaultSeverity.low, FaultStatus.resolved, 'Voyant HS'),
];

Widget _host() => ProviderScope(
      overrides: [
        faultsProvider.overrideWith((ref) => Stream.value(_feed)),
        machinesByIdProvider.overrideWith(
          (ref) => Stream.value({'m1': _machine}),
        ),
        connectivityProvider.overrideWith((ref) => Stream.value(true)),
      ],
      child: const MaterialApp(home: AlertsScreen()),
    );

void main() {
  testWidgets('renders the fault feed', (tester) async {
    await tester.pumpWidget(_host());
    await tester.pumpAndSettle();

    expect(find.text('Fuite vapeur'), findsOneWidget);
    expect(find.text('Voyant HS'), findsOneWidget);
    expect(find.text('MCH-002 · Atelier A · Mécanique'), findsWidgets);
  });

  testWidgets('the Critique tab narrows to critical faults', (tester) async {
    await tester.pumpWidget(_host());
    await tester.pumpAndSettle();

    // The tab renders before the row's severity pill, so target the first.
    await tester.tap(find.text('Critique').first);
    await tester.pumpAndSettle();

    expect(find.text('Fuite vapeur'), findsOneWidget);
    expect(find.text('Voyant HS'), findsNothing);
  });
}
