import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maintflow_mobile/core/network/connectivity.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/features/machines/home_screen.dart';
import 'package:maintflow_mobile/features/machines/machines_providers.dart';
import 'package:maintflow_mobile/features/missions/missions_providers.dart';

Machine _m(String code, String name, MachineState state) => Machine(
      id: 'id-$code',
      code: code,
      name: name,
      type: 'convoyeur',
      workshop: 'Atelier A',
      installedAt: DateTime.utc(2020),
      state: state,
      runtime: 1000,
      criticality: Criticality.medium,
      hourlyCost: 1000,
      lifespanYears: 10,
    );

final _fleet = [
  _m('MCH-001', 'Convoyeur Ligne 1', MachineState.ok),
  _m('MCH-002', 'Presse hydraulique', MachineState.fault),
  _m('MCH-003', 'Tour CNC', MachineState.ok),
];

Widget _host() => ProviderScope(
      overrides: [
        machinesListProvider.overrideWith((ref) => Stream.value(_fleet)),
        missionsProvider.overrideWith(
          (ref) => Stream.value(const <Intervention>[]),
        ),
        connectivityProvider.overrideWith((ref) => Stream.value(true)),
      ],
      child: const MaterialApp(home: HomeScreen()),
    );

void main() {
  testWidgets('renders the fleet count, KPI and machine rows', (tester) async {
    tester.view.physicalSize = const Size(1200, 2600);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(_host());
    await tester.pumpAndSettle();

    expect(find.text('3 machines'), findsOneWidget);
    expect(find.text('2 / 3'), findsOneWidget); // operational ok count
    expect(find.text('Convoyeur Ligne 1'), findsOneWidget);
    expect(find.text('Presse hydraulique'), findsOneWidget);
    expect(find.text('Tour CNC'), findsOneWidget);
  });

  testWidgets('the "En panne" filter narrows the list', (tester) async {
    tester.view.physicalSize = const Size(1200, 2600);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(_host());
    await tester.pumpAndSettle();

    // The chip renders before the row's state pill, so target the first.
    await tester.tap(find.text('En panne').first);
    await tester.pumpAndSettle();

    expect(find.text('Presse hydraulique'), findsOneWidget);
    expect(find.text('Convoyeur Ligne 1'), findsNothing);
    expect(find.text('Tour CNC'), findsNothing);
  });
}
