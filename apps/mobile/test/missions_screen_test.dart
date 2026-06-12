import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/features/missions/missions_providers.dart';
import 'package:maintflow_mobile/features/missions/missions_screen.dart';

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

Intervention _mission(InterventionStatus status) => Intervention(
      id: 'i-00000000-aaaa',
      machineId: 'm1',
      technicianId: 'u1',
      kind: InterventionKind.corrective,
      description: 'Remplacement roulement',
      scheduledFor: DateTime.utc(2026, 5, 21),
      duration: 3,
      status: status,
      linkedFaultId: 'f1',
      planRuleId: null,
      actualDuration: null,
      rating: null,
      signedBy: null,
    );

void main() {
  testWidgets('MissionsScreen renders the count, progress and a mission row',
      (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          missionsProvider.overrideWith(
            (ref) => Stream.value([
              _mission(InterventionStatus.completed),
              _mission(InterventionStatus.planned),
            ]),
          ),
          machinesByIdProvider.overrideWith(
            (ref) => Stream.value({'m1': _machine}),
          ),
        ],
        child: const MaterialApp(home: MissionsScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('2 missions'), findsOneWidget);
    expect(find.textContaining('1/2'), findsOneWidget); // one completed of two
    expect(find.text('Remplacement roulement'), findsWidgets);
    expect(find.text('MCH-002 · Atelier A'), findsWidgets);
    expect(find.text('Corrective'), findsOneWidget); // the planned one
  });
}
