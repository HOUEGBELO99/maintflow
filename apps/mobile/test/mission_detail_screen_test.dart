import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/features/missions/mission_detail_screen.dart';
import 'package:maintflow_mobile/features/missions/missions_providers.dart';

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
  description: 'Remplacement roulement palier moteur',
  scheduledFor: DateTime.utc(2026, 5, 21),
  duration: 3,
  status: InterventionStatus.inProgress,
  linkedFaultId: 'f1',
  planRuleId: null,
  checklist: const [
    ChecklistItem(label: 'Consignation (LOTO)', done: true),
    ChecklistItem(label: 'Extraction roulement', done: false),
  ],
  actualDuration: null,
  rating: null,
  signedBy: null,
);

void main() {
  testWidgets('MissionDetailScreen shows the mission, machine and checklist',
      (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          missionsProvider.overrideWith((ref) => Stream.value([_mission])),
          machinesByIdProvider
              .overrideWith((ref) => Stream.value({'m1': _machine})),
        ],
        child: const MaterialApp(
          home: MissionDetailScreen(missionId: 'i-0000-aaaa'),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Remplacement roulement palier moteur'), findsOneWidget);
    expect(find.text('Convoyeur Ligne 2'), findsOneWidget);
    expect(find.text('TÂCHES · 1/2'), findsOneWidget);
    expect(find.text('Consignation (LOTO)'), findsOneWidget);
    expect(find.text('Extraction roulement'), findsOneWidget);
    expect(find.text('En cours'), findsOneWidget); // status pill
  });
}
