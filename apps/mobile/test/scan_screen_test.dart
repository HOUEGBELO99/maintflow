import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/features/missions/missions_providers.dart';
import 'package:maintflow_mobile/features/scan/scan_screen.dart';

final _machine = Machine(
  id: '00000000-0000-4000-a000-000000000202',
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

/// Hosts the scanner exactly like the app does when it is pushed from Home:
/// nothing else on screen keeps the machine cache alive, and the cache (a
/// Drift stream in the app) answers asynchronously.
Widget _host() {
  return ProviderScope(
    overrides: [
      machinesByIdProvider.overrideWith(
        (ref) => Stream.fromFuture(
          Future<Map<String, Machine>>.delayed(
            const Duration(milliseconds: 50),
            () => {_machine.id: _machine},
          ),
        ),
      ),
      missionsProvider.overrideWith(
        (ref) => Stream.value(const <Intervention>[]),
      ),
    ],
    child: const MaterialApp(home: ScanScreen()),
  );
}

Future<void> _enterManually(WidgetTester tester, String code) async {
  await tester.tap(find.text("Saisir l'ID manuellement").first);
  await tester.pump(const Duration(milliseconds: 300));
  await tester.enterText(find.byType(TextField), code);
  await tester.tap(find.text('Valider'));
  // Let the cache resolve and the result sheet animate in.
  for (var i = 0; i < 10; i++) {
    await tester.pump(const Duration(milliseconds: 100));
  }
}

void main() {
  testWidgets('a scan opened cold still resolves the machine', (tester) async {
    await tester.pumpWidget(_host());
    await tester.pump(const Duration(milliseconds: 100));

    await _enterManually(tester, 'mch-002');

    expect(find.text('Machine introuvable'), findsNothing);
    expect(find.text('Convoyeur Ligne 2'), findsOneWidget);
  });

  testWidgets('tags printed with the old URL/UUID payload still resolve', (
    tester,
  ) async {
    await tester.pumpWidget(_host());
    await tester.pump(const Duration(milliseconds: 100));

    await _enterManually(
      tester,
      'https://maintflow.vercel.app/machines/${_machine.id}',
    );

    expect(find.text('Convoyeur Ligne 2'), findsOneWidget);
  });
}
