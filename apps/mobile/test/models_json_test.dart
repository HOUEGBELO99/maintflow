import 'package:flutter_test/flutter_test.dart';
import 'package:maintflow_mobile/data/models/attachment.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/fault.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/models/machine.dart';

void main() {
  group('JSON wire contract (must match the NestJS API / packages/shared)', () {
    test('Machine parses the API payload', () {
      final machine = Machine.fromJson(<String, dynamic>{
        'id': 'm1',
        'code': 'MCH-001',
        'name': 'Compresseur Atlas A7',
        'type': 'compresseur',
        'workshop': 'Atelier A',
        'installedAt': '2021-04-18T00:00:00.000Z',
        'state': 'ok',
        'runtime': 14328,
        'criticality': 'high',
        'hourlyCost': 1200,
        'lifespanYears': 12,
      });
      expect(machine.state, MachineState.ok);
      expect(machine.criticality, Criticality.high);
      expect(machine.installedAt.year, 2021);
    });

    test('Fault decodes snake_case status and nullable fields', () {
      final fault = Fault.fromJson(<String, dynamic>{
        'id': 'f1',
        'machineId': 'm1',
        'type': 'mecanique',
        'description': 'Roulement palier moteur en surchauffe',
        'reportedAt': '2026-05-21T08:14:00.000Z',
        'reportedBy': 'u1',
        'severity': 'critical',
        'status': 'in_progress',
        'rootCause': null,
        'hasPhoto': false,
        'takenAt': null,
      });
      expect(fault.type, FaultType.mecanique);
      expect(fault.severity, FaultSeverity.critical);
      expect(fault.status, FaultStatus.inProgress);
      expect(fault.rootCause, isNull);
    });

    test('Intervention round-trips through JSON with checklist defaults', () {
      final intervention = Intervention.fromJson(<String, dynamic>{
        'id': 'i1',
        'machineId': 'm1',
        'technicianId': 'u1',
        'kind': 'preventive',
        'description': 'Visite trimestrielle',
        'scheduledFor': '2026-05-23T00:00:00.000Z',
        'duration': 2,
        'status': 'planned',
        'linkedFaultId': null,
        'planRuleId': 'pm1',
        'checklist': <dynamic>[
          <String, dynamic>{'label': 'Consignation électrique', 'done': true},
        ],
        'partsUsed': <dynamic>['SKF-6208'],
        'actualDuration': null,
        'rating': null,
        'signedBy': null,
      });
      expect(intervention.kind, InterventionKind.preventive);
      expect(intervention.status, InterventionStatus.planned);
      expect(intervention.duration, 2.0);
      expect(intervention.checklist.single.done, isTrue);

      final reparsed = Intervention.fromJson(intervention.toJson());
      expect(reparsed, intervention);
    });

    test('Attachment parses the files endpoint payload', () {
      final att = Attachment.fromJson(<String, dynamic>{
        'id': 'a1',
        'kind': 'photo',
        'mimeType': 'image/jpeg',
        'url': 'https://signed.example/abc',
      });
      expect(att.kind, 'photo');
      expect(att.url, 'https://signed.example/abc');
    });
  });
}
