import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/models/machine.dart';

const _brand = PdfColor.fromInt(0xFF00C24A);
const _brandDeep = PdfColor.fromInt(0xFF0E2A18);
const _ink = PdfColor.fromInt(0xFF0E1410);
const _mute = PdfColor.fromInt(0xFF6B7280);
const _line = PdfColor.fromInt(0xFFE5E7EB);

const _months = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];
String _date(DateTime d) => '${d.day} ${_months[d.month - 1]} ${d.year}';
String _ref(String id) => 'I-${id.substring(id.length - 4).toUpperCase()}';
String _hours(double h) {
  final whole = h.floor();
  final mins = ((h - whole) * 60).round();
  return mins == 0 ? '$whole h' : '$whole h $mins';
}

/// Build the intervention report PDF and open the OS share sheet (WhatsApp,
/// e-mail, drive…). Mirrors the prototype "Rapport PDF" layout.
Future<void> shareInterventionReport({
  required Intervention mission,
  required Machine? machine,
  required String technicianName,
}) async {
  final doc = pw.Document();
  final planned = mission.duration;
  final actual = mission.actualDuration ?? mission.duration;
  final deltaMin = ((actual - planned) * 60).round();
  final tasks = mission.checklist.where((c) => c.done).toList();
  final kind =
      mission.kind == InterventionKind.preventive ? 'Préventive' : 'Corrective';

  doc.addPage(
    pw.Page(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(36),
      build: (context) => pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          // Letterhead
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.RichText(
                    text: pw.TextSpan(
                      children: [
                        pw.TextSpan(
                          text: 'Maint',
                          style: pw.TextStyle(
                            fontSize: 20,
                            fontWeight: pw.FontWeight.bold,
                            color: _ink,
                          ),
                        ),
                        pw.TextSpan(
                          text: 'Flow',
                          style: pw.TextStyle(
                            fontSize: 20,
                            fontWeight: pw.FontWeight.bold,
                            color: _brand,
                          ),
                        ),
                      ],
                    ),
                  ),
                  pw.Text(
                    'GMAO · RAPPORT',
                    style: const pw.TextStyle(fontSize: 8, color: _mute),
                  ),
                ],
              ),
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  pw.Text(
                    'RÉF.',
                    style: const pw.TextStyle(fontSize: 8, color: _mute),
                  ),
                  pw.Text(
                    _ref(mission.id),
                    style: pw.TextStyle(
                      fontSize: 13,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.Text(
                    _date(mission.scheduledFor),
                    style: const pw.TextStyle(fontSize: 9, color: _mute),
                  ),
                ],
              ),
            ],
          ),
          pw.SizedBox(height: 10),
          pw.Container(height: 2.5, color: _brand),
          pw.SizedBox(height: 18),
          pw.Text(
            "Rapport d'intervention",
            style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold),
          ),
          pw.SizedBox(height: 14),

          // Summary table
          pw.Table(
            border: pw.TableBorder.all(color: _line),
            columnWidths: const {
              0: pw.FlexColumnWidth(1),
              1: pw.FlexColumnWidth(2),
            },
            children: [
              _row(
                'Machine',
                '${machine?.name ?? mission.machineId} (${machine?.code ?? '—'})',
              ),
              _row('Atelier', machine?.workshop ?? '—'),
              _row('Technicien', technicianName),
              _row('Type', kind),
              _row('Statut', 'Clôturé'),
            ],
          ),
          pw.SizedBox(height: 18),

          // Tasks
          pw.Text(
            'TÂCHES RÉALISÉES',
            style: pw.TextStyle(
              fontSize: 10,
              fontWeight: pw.FontWeight.bold,
              color: _mute,
            ),
          ),
          pw.SizedBox(height: 8),
          if (tasks.isEmpty)
            pw.Text(
              'Aucune tâche enregistrée.',
              style: const pw.TextStyle(fontSize: 11, color: _mute),
            )
          else
            for (var i = 0; i < tasks.length; i++)
              pw.Padding(
                padding: const pw.EdgeInsets.only(bottom: 5),
                child: pw.Row(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.SizedBox(
                      width: 22,
                      child: pw.Text(
                        (i + 1).toString().padLeft(2, '0'),
                        style: pw.TextStyle(
                          fontSize: 11,
                          fontWeight: pw.FontWeight.bold,
                          color: _brand,
                        ),
                      ),
                    ),
                    pw.Expanded(
                      child: pw.Text(
                        tasks[i].label,
                        style: const pw.TextStyle(fontSize: 11),
                      ),
                    ),
                  ],
                ),
              ),
          pw.SizedBox(height: 18),

          // Durations
          pw.Row(
            children: [
              _durTile('PRÉVU', _hours(planned), _ink),
              pw.SizedBox(width: 10),
              _durTile('RÉEL', _hours(actual), _brand),
              pw.SizedBox(width: 10),
              _durTile(
                'ÉCART',
                deltaMin == 0
                    ? '0 min'
                    : '${deltaMin > 0 ? '+' : ''}$deltaMin min',
                deltaMin > 0 ? PdfColors.red : _brand,
              ),
            ],
          ),
          pw.SizedBox(height: 26),

          // Signatures
          pw.Row(
            children: [
              pw.Expanded(child: _signBlock('TECHNICIEN', mission.signedBy)),
              pw.SizedBox(width: 24),
              pw.Expanded(child: _signBlock('RESPONSABLE', null)),
            ],
          ),
          pw.Spacer(),
          pw.Center(
            child: pw.Text(
              'Document généré automatiquement par MaintFlow GMAO · ${_ref(mission.id)} · Page 1/1',
              style: const pw.TextStyle(fontSize: 8, color: _mute),
            ),
          ),
        ],
      ),
    ),
  );

  await Printing.sharePdf(
    bytes: await doc.save(),
    filename: 'rapport-${_ref(mission.id)}.pdf',
  );
}

pw.TableRow _row(String label, String value) => pw.TableRow(
      children: [
        pw.Padding(
          padding: const pw.EdgeInsets.all(8),
          child: pw.Text(
            label,
            style: const pw.TextStyle(fontSize: 10, color: _mute),
          ),
        ),
        pw.Padding(
          padding: const pw.EdgeInsets.all(8),
          child: pw.Text(
            value,
            style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold),
          ),
        ),
      ],
    );

pw.Widget _durTile(String label, String value, PdfColor color) => pw.Expanded(
      child: pw.Container(
        padding: const pw.EdgeInsets.symmetric(vertical: 12),
        decoration: pw.BoxDecoration(
          border: pw.Border.all(color: _line),
          borderRadius: pw.BorderRadius.circular(8),
        ),
        child: pw.Column(
          children: [
            pw.Text(
              value,
              style: pw.TextStyle(
                fontSize: 15,
                fontWeight: pw.FontWeight.bold,
                color: color,
              ),
            ),
            pw.SizedBox(height: 3),
            pw.Text(
              label,
              style: const pw.TextStyle(fontSize: 8, color: _mute),
            ),
          ],
        ),
      ),
    );

pw.Widget _signBlock(String label, String? name) => pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(
          label,
          style: pw.TextStyle(
            fontSize: 9,
            fontWeight: pw.FontWeight.bold,
            color: _mute,
          ),
        ),
        pw.SizedBox(height: 16),
        pw.Text(
          name ?? 'En attente',
          style: pw.TextStyle(
            fontSize: 13,
            fontStyle: name != null ? pw.FontStyle.italic : null,
            color: name != null ? _brandDeep : _mute,
          ),
        ),
        pw.SizedBox(height: 4),
        pw.Container(height: 0.8, color: _line),
      ],
    );
