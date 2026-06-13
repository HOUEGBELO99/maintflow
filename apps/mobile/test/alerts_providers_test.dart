import 'package:flutter_test/flutter_test.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/fault.dart';
import 'package:maintflow_mobile/features/alerts/alerts_providers.dart';

Fault _f(String id, FaultSeverity sev, FaultStatus status) => Fault(
      id: id,
      machineId: 'm1',
      type: FaultType.electrique,
      description: 'Fault $id',
      reportedAt: DateTime.utc(2026, 5, 21, 8),
      reportedBy: 'u1',
      severity: sev,
      status: status,
      rootCause: null,
      hasPhoto: false,
      takenAt: null,
    );

void main() {
  final feed = [
    _f('f1', FaultSeverity.critical, FaultStatus.pending),
    _f('f2', FaultSeverity.medium, FaultStatus.inProgress),
    _f('f3', FaultSeverity.low, FaultStatus.resolved),
  ];

  group('filterFaults', () {
    test('all returns everything', () {
      expect(filterFaults(feed, AlertFilter.all), hasLength(3));
    });

    test('critical keeps only critical severity', () {
      expect(
        filterFaults(feed, AlertFilter.critical).map((f) => f.id),
        ['f1'],
      );
    });

    test('unresolved drops resolved faults', () {
      expect(
        filterFaults(feed, AlertFilter.unresolved).map((f) => f.id),
        ['f1', 'f2'],
      );
    });
  });

  group('relativeTime', () {
    final base = DateTime.utc(2026, 5, 21, 12);
    test('formats minutes, hours and days', () {
      expect(
        relativeTime(base.subtract(const Duration(seconds: 20)), base),
        "à l'instant",
      );
      expect(
        relativeTime(base.subtract(const Duration(minutes: 8)), base),
        'il y a 8 min',
      );
      expect(
        relativeTime(base.subtract(const Duration(hours: 3)), base),
        'il y a 3 h',
      );
      expect(
        relativeTime(base.subtract(const Duration(days: 2)), base),
        'il y a 2 j',
      );
    });
  });
}
