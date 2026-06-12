import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/features/missions/missions_providers.dart';
import 'package:maintflow_mobile/features/scan/scan_screen.dart';

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
  duration: 3,
  status: InterventionStatus.inProgress,
  linkedFaultId: 'f1',
  planRuleId: null,
  actualDuration: null,
  rating: null,
  signedBy: null,
);

Widget _host(Widget sheet, List<Intervention> missions) {
  return ProviderScope(
    overrides: [
      missionsProvider.overrideWith((ref) => Stream.value(missions)),
    ],
    child: MaterialApp(home: Scaffold(body: sheet)),
  );
}

void main() {
  testWidgets('not-found state names the unknown code', (tester) async {
    await tester.pumpWidget(
      _host(
        ScanResultSheet(
          raw: 'MCH-999',
          machine: null,
          onOpenIntervention: (_) {},
          onDismiss: () {},
        ),
        const [],
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Machine introuvable'), findsOneWidget);
    expect(find.textContaining('MCH-999'), findsOneWidget);
    expect(find.text('Réessayer'), findsOneWidget);
  });

  testWidgets('found state with an intervention opens it', (tester) async {
    String? opened;
    await tester.pumpWidget(
      _host(
        ScanResultSheet(
          raw: 'MCH-002',
          machine: _machine,
          onOpenIntervention: (id) => opened = id,
          onDismiss: () {},
        ),
        [_mission],
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Convoyeur Ligne 2'), findsOneWidget);
    expect(find.text('Scanné'), findsOneWidget);

    await tester.tap(find.text("Ouvrir l'intervention"));
    expect(opened, 'i-0000-aaaa');
  });

  testWidgets('found state without an intervention shows the empty note',
      (tester) async {
    await tester.pumpWidget(
      _host(
        ScanResultSheet(
          raw: 'MCH-002',
          machine: _machine,
          onOpenIntervention: (_) {},
          onDismiss: () {},
        ),
        const [],
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Convoyeur Ligne 2'), findsOneWidget);
    expect(
      find.text('Aucune intervention assignée sur cette machine.'),
      findsOneWidget,
    );
    expect(find.text("Ouvrir l'intervention"), findsNothing);
  });
}
