import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:maintflow_mobile/data/datasources/api_data_source.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/data/photos/photo_picker.dart';
import 'package:maintflow_mobile/data/repositories/sync_service.dart';
import 'package:maintflow_mobile/features/missions/missions_providers.dart';
import 'package:maintflow_mobile/features/report/report_screen.dart';

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

/// Records the fault body without touching the DB / network.
class _RecordingSync implements SyncService {
  Map<String, dynamic>? body;

  @override
  Future<void> reportFault(Map<String, dynamic> b) async => body = b;

  @override
  noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _FakePicker implements PhotoPicker {
  @override
  Future<PickedPhoto?> capture() async =>
      (bytes: <int>[1, 2, 3], filename: 'photo.jpg', mimeType: 'image/jpeg');
}

class _RecordingApi extends ApiDataSource {
  _RecordingApi() : super(Dio());

  Map<String, dynamic>? created;
  String? uploadedFaultId;

  @override
  Future<String> createFault(Map<String, dynamic> body) async {
    created = body;
    return 'f-new';
  }

  @override
  Future<void> uploadFaultPhoto(
    String faultId, {
    required List<int> bytes,
    required String filename,
    required String mimeType,
  }) async {
    uploadedFaultId = faultId;
  }
}

void main() {
  group('buildCreateFaultBody', () {
    test('maps enums to API wire values and trims the description', () {
      final body = buildCreateFaultBody(
        machineId: 'm1',
        type: FaultType.hydraulique,
        severity: FaultSeverity.critical,
        description: '  Fuite vérin principal  ',
      );
      expect(body, {
        'machineId': 'm1',
        'type': 'hydraulique',
        'severity': 'critical',
        'description': 'Fuite vérin principal',
      });
    });
  });

  testWidgets('submitting reports the fault with the selected fields',
      (tester) async {
    // Tall viewport so the whole form (incl. the CTA) builds in the ListView.
    tester.view.physicalSize = const Size(1200, 2600);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    final sync = _RecordingSync();
    final router = GoRouter(
      initialLocation: '/report',
      routes: [
        GoRoute(
          path: '/report',
          builder: (_, __) => const ReportScreen(machineId: 'm1'),
        ),
        GoRoute(
          path: '/missions',
          builder: (_, __) => const Scaffold(body: Text('missions')),
        ),
      ],
    );
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          machinesByIdProvider.overrideWith(
            (ref) => Stream.value({'m1': _machine}),
          ),
          syncServiceProvider.overrideWithValue(sync),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();

    // Machine context is shown.
    expect(find.text('Convoyeur Ligne 2'), findsOneWidget);

    // CTA is disabled until a valid description is entered.
    await tester.tap(find.text('Déclarer la panne'));
    await tester.pump();
    expect(sync.body, isNull);

    // Pick a fault type, a severity, and write a description.
    await tester.tap(find.text('Mécanique'));
    await tester.tap(find.text('Critique'));
    await tester.enterText(
      find.byType(TextField),
      'Roulement palier moteur en surchauffe',
    );
    await tester.pump();

    await tester.tap(find.text('Déclarer la panne'));
    await tester.pump();

    expect(sync.body, {
      'machineId': 'm1',
      'type': 'mecanique',
      'severity': 'critical',
      'description': 'Roulement palier moteur en surchauffe',
    });
  });

  testWidgets('shows a fallback when the machine is unknown', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          machinesByIdProvider.overrideWith(
            (ref) => Stream.value(const {}),
          ),
        ],
        child: const MaterialApp(home: ReportScreen(machineId: 'ghost')),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Machine introuvable.'), findsOneWidget);
    expect(find.text('Déclarer la panne'), findsNothing);
  });

  testWidgets('with a photo, submit creates the fault online then uploads it',
      (tester) async {
    tester.view.physicalSize = const Size(1200, 2800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    final api = _RecordingApi();
    final router = GoRouter(
      initialLocation: '/report',
      routes: [
        GoRoute(
          path: '/report',
          builder: (_, __) => const ReportScreen(machineId: 'm1'),
        ),
        GoRoute(
          path: '/missions',
          builder: (_, __) => const Scaffold(body: Text('missions')),
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          machinesByIdProvider.overrideWith(
            (ref) => Stream.value({'m1': _machine}),
          ),
          photoPickerProvider.overrideWithValue(_FakePicker()),
          apiDataSourceProvider.overrideWithValue(api),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'Surchauffe palier moteur');
    await tester.tap(find.text('Ajouter une photo'));
    await tester.pumpAndSettle();
    expect(find.text('Photo ajoutée'), findsOneWidget);

    await tester.tap(find.text('Déclarer la panne'));
    await tester.pumpAndSettle();

    expect(api.created?['machineId'], 'm1');
    expect(api.created?['description'], 'Surchauffe palier moteur');
    expect(api.uploadedFaultId, 'f-new');
  });
}
