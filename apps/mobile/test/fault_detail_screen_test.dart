import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maintflow_mobile/data/datasources/api_data_source.dart';
import 'package:maintflow_mobile/data/models/attachment.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/fault.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/features/alerts/alerts_providers.dart';
import 'package:maintflow_mobile/features/alerts/fault_detail_screen.dart';
import 'package:maintflow_mobile/features/missions/missions_providers.dart';

final _machine = Machine(
  id: 'm1',
  code: 'MCH-002',
  name: 'Convoyeur Ligne 2',
  type: 'convoyeur',
  workshop: 'Atelier A',
  installedAt: DateTime.utc(2019),
  state: MachineState.fault,
  runtime: 1000,
  criticality: Criticality.high,
  hourlyCost: 1000,
  lifespanYears: 10,
);

final _fault = Fault(
  id: 'f-0000-aaaa',
  machineId: 'm1',
  type: FaultType.mecanique,
  description: 'Roulement palier moteur en surchauffe',
  reportedAt: DateTime.utc(2026, 5, 21, 8),
  reportedBy: 'u1',
  severity: FaultSeverity.critical,
  status: FaultStatus.pending,
  rootCause: null,
  hasPhoto: true,
  takenAt: null,
);

class _FakeApi extends ApiDataSource {
  _FakeApi(this.attachments) : super(Dio());
  final List<Attachment> attachments;

  @override
  Future<List<Attachment>> fetchFaultAttachments(String faultId) async =>
      attachments;
}

Widget _host(List<Attachment> attachments) => ProviderScope(
      overrides: [
        faultsProvider.overrideWith((ref) => Stream.value([_fault])),
        machinesByIdProvider.overrideWith(
          (ref) => Stream.value({'m1': _machine}),
        ),
        apiDataSourceProvider.overrideWithValue(_FakeApi(attachments)),
      ],
      child: const MaterialApp(
        home: FaultDetailScreen(faultId: 'f-0000-aaaa'),
      ),
    );

void main() {
  testWidgets('renders the fault, machine and a photo thumbnail per attachment',
      (tester) async {
    await tester.pumpWidget(
      _host(const [
        Attachment(id: 'a1', kind: 'photo', mimeType: 'image/jpeg', url: 'u1'),
        Attachment(id: 'a2', kind: 'photo', mimeType: 'image/jpeg', url: 'u2'),
      ]),
    );
    await tester.pumpAndSettle();

    expect(find.text('Roulement palier moteur en surchauffe'), findsOneWidget);
    expect(find.text('Convoyeur Ligne 2'), findsOneWidget);
    expect(find.text('Critique'), findsOneWidget);
    expect(find.byType(Image), findsNWidgets(2));
  });

  testWidgets('shows the empty state when there are no photos', (tester) async {
    await tester.pumpWidget(_host(const []));
    await tester.pumpAndSettle();

    expect(find.text('Aucune photo pour cette panne.'), findsOneWidget);
    expect(find.byType(Image), findsNothing);
  });
}
