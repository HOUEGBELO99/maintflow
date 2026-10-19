// End-to-end technician flow against a running local stack.
//
// Prerequisites: local API on :4000 (NODE_ENV=development, dev-login enabled)
// with the demo dataset freshly reset (POST /admin/reset-demo).
//
// Run (simulator):
//   flutter drive --driver=test_driver/integration_test.dart \
//     --target=integration_test/technician_flow_test.dart \
//     -d <simulator-id> --dart-define=API_URL=http://localhost:4000
//
// Screenshots land in build/e2e_screens/.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:signature/signature.dart';

import 'package:maintflow_mobile/main.dart' as app;

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  /// Pumps frames until [finder] matches (the app has live timers, so
  /// pumpAndSettle would never settle).
  Future<void> waitFor(
    WidgetTester tester,
    Finder finder, {
    Duration timeout = const Duration(seconds: 20),
  }) async {
    final end = DateTime.now().add(timeout);
    while (DateTime.now().isBefore(end)) {
      await tester.pump(const Duration(milliseconds: 200));
      if (finder.evaluate().isNotEmpty) return;
    }
    await binding.takeScreenshot('FAIL_waiting');
    throw TestFailure('Timed out waiting for $finder');
  }

  Future<void> settle(WidgetTester tester, [int ms = 800]) async {
    for (var t = 0; t < ms; t += 100) {
      await tester.pump(const Duration(milliseconds: 100));
    }
  }

  /// Scrolls the main list until [finder] is built (lists are lazy).
  Future<void> revealFinder(WidgetTester tester, Finder finder) async {
    if (finder.evaluate().isEmpty) {
      await tester.scrollUntilVisible(
        finder,
        250,
        scrollable: find.byType(Scrollable).first,
      );
    }
    await tester.ensureVisible(finder.first);
    await tester.pump(const Duration(milliseconds: 200));
  }

  Future<void> reveal(WidgetTester tester, String text) =>
      revealFinder(tester, find.text(text));

  Future<void> tapText(WidgetTester tester, String text) async {
    await reveal(tester, text);
    final f = find.text(text).last;
    await tester.ensureVisible(f);
    await tester.pump();
    await tester.tap(f);
    await settle(tester);
  }

  Future<void> shot(String name) => binding.takeScreenshot(name);

  testWidgets(
      'technician: login → parc → scan → panne → profil → mission → clôture', (
    tester,
  ) async {
    app.main();
    final loginButton = find.text('Se connecter');
    final missionsHeader = find.text('MES INTERVENTIONS');
    await waitFor(
      tester,
      find.byWidgetPredicate(
        (w) =>
            loginButton.evaluate().isNotEmpty ||
            missionsHeader.evaluate().isNotEmpty,
      ),
    );

    // ── Login (dev-login locally: the password is ignored but required).
    // A session saved by a previous run skips straight to the missions.
    if (loginButton.evaluate().isNotEmpty) {
      await shot('01_login');
      final fields = find.byType(TextField);
      await tester.enterText(fields.first, 's.diallo@usine.fr');
      await tester.enterText(fields.at(1), 'demo');
      await tapText(tester, 'Se connecter');
    }
    // Machine names (not raw ids) prove the machine cache loaded with a token.
    await waitFor(tester, find.textContaining('MCH-002'));
    await settle(tester, 1500);
    await shot('02_missions');

    // ── Parc
    await tapText(tester, 'Machines');
    await waitFor(tester, find.text('Rechercher une machine'));
    await settle(tester, 1000);
    await shot('03_parc');

    await tester.enterText(find.byType(TextField).first, 'cv2');
    await settle(tester, 600);
    await shot('03b_parc_search');
    await tapText(tester, 'Chaudière vapeur CV2');
    await waitFor(tester, find.text('Signaler une panne'));
    await settle(tester);
    await shot('04_machine_detail');
    await tester.tap(find.byIcon(Icons.chevron_left).first);
    await settle(tester);

    // ── Scan (no camera on the simulator → manual entry, same resolution path)
    await tapText(tester, 'Scan');
    await waitFor(tester, find.text("Saisir l'ID manuellement"));
    await settle(tester);
    await shot('05_scan');
    await tapText(tester, "Saisir l'ID manuellement");
    await waitFor(tester, find.text('Identifiant machine'));
    await tester.enterText(find.byType(TextField).last, 'mch-008');
    await tapText(tester, 'Valider');
    await waitFor(tester, find.text('Scanné'));
    await settle(tester);
    expect(find.text('Machine introuvable'), findsNothing);
    await shot('06_scan_result');

    // ── Report a fault from the scan
    await tapText(tester, 'Signaler une panne');
    await waitFor(tester, find.text('Quel type ?'));
    await settle(tester);
    await shot('07_report_form');
    await tapText(tester, 'Mécanique');
    await tapText(tester, 'Moyenne');
    await tester.enterText(
      find.byType(TextField).last,
      'E2E : vibration anormale sur le ventilateur de tirage',
    );
    await settle(tester, 300);
    await shot('08_report_filled');
    await tapText(tester, 'Déclarer la panne');
    await waitFor(tester, find.text('Panne déclarée'));
    await settle(tester);
    // Submitting returns to the missions list.
    await waitFor(tester, find.text('MES INTERVENTIONS'));
    await settle(tester, 1500);
    await shot('09_report_done');

    // ── Profile (wait for the snackbar to leave the tab bar first)
    for (var i = 0;
        i < 60 && find.text('Panne déclarée').evaluate().isNotEmpty;
        i++) {
      await tester.pump(const Duration(milliseconds: 200));
    }
    await settle(tester, 500);
    await tapText(tester, 'Profil');
    await waitFor(tester, find.textContaining('s.diallo@usine.fr'));
    await settle(tester);
    await shot('10a_profile');
    await tapText(tester, 'Missions');
    await waitFor(tester, find.text('MES INTERVENTIONS'));

    // ── Mission: finish the checklist then close with a signature
    await waitFor(tester, find.textContaining('Remplacement roulement palier'));
    await tapText(
      tester,
      'Remplacement roulement palier moteur, alignement convoyeur',
    );
    await waitFor(tester, find.text('Extraction roulement défectueux'));
    await settle(tester);
    await shot('10_mission_detail');
    for (final task in const [
      'Extraction roulement défectueux',
      'Montage roulement neuf + graissage',
      'Réalignement et test à vide',
    ]) {
      await tapText(tester, task);
    }
    await reveal(tester, 'Terminer l’intervention');
    await settle(tester);
    await shot('11_checklist_done');
    await tapText(tester, 'Terminer l’intervention');
    await waitFor(tester, find.text('INTERVENTION TERMINÉE'));
    await settle(tester);
    await shot('12_close_form');

    final pad = find.byType(Signature);
    await revealFinder(tester, pad);
    await settle(tester, 300);
    await tester.drag(pad, const Offset(140, 30));
    await tester.drag(pad, const Offset(-60, -20));
    await settle(tester, 300);
    await shot('13_signed');
    await tapText(tester, 'Clôturer & générer le PDF');
    // Closing generates the PDF report and opens the native share sheet
    // (outside Flutter's reach), so the flow ends on the snackbar.
    await waitFor(tester, find.text('Intervention clôturée'));
    await settle(tester, 1500);
    await shot('14_closed');
  });
}
