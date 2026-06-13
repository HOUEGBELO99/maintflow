import 'package:flutter_test/flutter_test.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/features/machines/machines_providers.dart';

Machine _m(String code, String name, String workshop, MachineState state) =>
    Machine(
      id: 'id-$code',
      code: code,
      name: name,
      type: 'convoyeur',
      workshop: workshop,
      installedAt: DateTime.utc(2020),
      state: state,
      runtime: 1000,
      criticality: Criticality.medium,
      hourlyCost: 1000,
      lifespanYears: 10,
    );

void main() {
  final fleet = [
    _m('MCH-001', 'Convoyeur Ligne 1', 'Atelier A', MachineState.ok),
    _m('MCH-002', 'Presse hydraulique', 'Atelier B', MachineState.fault),
    _m('MCH-003', 'Chaudière CV2', 'Utilités', MachineState.maintenance),
  ];

  group('filterMachines', () {
    test('returns everything with no state and an empty query', () {
      expect(filterMachines(fleet), hasLength(3));
    });

    test('filters by state', () {
      final faults = filterMachines(fleet, state: MachineState.fault);
      expect(faults.map((m) => m.code), ['MCH-002']);
    });

    test('matches the query on code, name or workshop (case-insensitive)', () {
      expect(filterMachines(fleet, query: 'presse').single.code, 'MCH-002');
      expect(filterMachines(fleet, query: 'mch-003').single.code, 'MCH-003');
      expect(filterMachines(fleet, query: 'utilités').single.code, 'MCH-003');
      expect(filterMachines(fleet, query: 'ATELIER'), hasLength(2));
    });

    test('combines state and query', () {
      expect(
        filterMachines(fleet, state: MachineState.ok, query: 'presse'),
        isEmpty,
      );
      expect(
        filterMachines(fleet, state: MachineState.ok, query: 'ligne')
            .single
            .code,
        'MCH-001',
      );
    });
  });
}
