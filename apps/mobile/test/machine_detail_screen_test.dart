import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/features/machines/machine_detail_screen.dart';
import 'package:maintflow_mobile/features/missions/missions_providers.dart';

final _machine = Machine(
  id: 'm1',
  code: 'MCH-002',
  name: 'Presse hydraulique',
  type: 'presse',
  workshop: 'Atelier B',
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
  duration: 3,
  status: InterventionStatus.inProgress,
  linkedFaultId: 'f1',
  planRuleId: null,
  actualDuration: null,
  rating: null,
  signedBy: null,
);

void main() {
  testWidgets('shows the spec card, interventions and report CTA',
      (tester) async {
    tester.view.physicalSize = const Size(1200, 2600);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          machinesByIdProvider.overrideWith(
            (ref) => Stream.value({'m1': _machine}),
          ),
          missionsProvider.overrideWith((ref) => Stream.value([_mission])),
        ],
        child: const MaterialApp(home: MachineDetailScreen(machineId: 'm1')),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Presse hydraulique'), findsOneWidget);
    expect(find.text('Critique'), findsOneWidget); // criticality spec
    expect(find.text('INTERVENTIONS · 1'), findsOneWidget);
    expect(find.text('Remplacement roulement'), findsOneWidget);
    expect(find.text('Signaler une panne'), findsOneWidget);
  });

  testWidgets('falls back when the machine is unknown', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          machinesByIdProvider.overrideWith((ref) => Stream.value(const {})),
          missionsProvider.overrideWith(
            (ref) => Stream.value(const <Intervention>[]),
          ),
        ],
        child: const MaterialApp(home: MachineDetailScreen(machineId: 'ghost')),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Machine introuvable.'), findsOneWidget);
  });
}
