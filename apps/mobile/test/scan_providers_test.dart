import 'package:flutter_test/flutter_test.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/features/scan/scan_providers.dart';

Machine _machine(String code) => Machine(
      id: 'id-$code',
      code: code,
      name: 'Machine $code',
      type: 'convoyeur',
      workshop: 'Atelier A',
      installedAt: DateTime.utc(2020),
      state: MachineState.ok,
      runtime: 1000,
      criticality: Criticality.medium,
      hourlyCost: 1000,
      lifespanYears: 10,
    );

void main() {
  group('extractMachineCode', () {
    test('returns a bare code upper-cased and trimmed', () {
      expect(extractMachineCode('  mch-002 '), 'MCH-002');
    });

    test('returns null for empty / whitespace', () {
      expect(extractMachineCode(''), isNull);
      expect(extractMachineCode('   '), isNull);
    });

    test('reads the last path segment of a URL', () {
      expect(
        extractMachineCode('https://app.maintflow.io/machines/mch-002'),
        'MCH-002',
      );
    });

    test('prefers a code/machine query param over the path', () {
      expect(
        extractMachineCode('https://app.maintflow.io/m?code=mch-007'),
        'MCH-007',
      );
      expect(
        extractMachineCode('https://app.maintflow.io/x?machine=mch-009'),
        'MCH-009',
      );
    });

    test('handles a custom deeplink scheme', () {
      expect(extractMachineCode('maintflow://m/MCH-003'), 'MCH-003');
    });
  });

  group('resolveScannedMachine', () {
    final byCode = {'MCH-002': _machine('MCH-002')};

    test('resolves a matching code (case-insensitive)', () {
      final m = resolveScannedMachine('mch-002', byCode);
      expect(m, isNotNull);
      expect(m!.id, 'id-MCH-002');
    });

    test('returns null when the code is unknown', () {
      expect(resolveScannedMachine('MCH-999', byCode), isNull);
    });

    test('returns null for an unparseable payload', () {
      expect(resolveScannedMachine('   ', byCode), isNull);
    });
  });
}
