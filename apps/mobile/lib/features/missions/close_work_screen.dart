import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:signature/signature.dart';

import 'package:maintflow_mobile/core/theme/app_theme.dart';
import 'package:maintflow_mobile/core/widgets/app_pill.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/data/repositories/sync_service.dart';
import 'package:maintflow_mobile/features/auth/auth_controller.dart';
import 'package:maintflow_mobile/features/missions/missions_providers.dart';
import 'package:maintflow_mobile/features/missions/report_pdf.dart';

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

String _longDate(DateTime d) => '${d.day} ${_months[d.month - 1]} ${d.year}';

String fmtHours(double h) {
  if (h == h.roundToDouble()) return '${h.toInt()} h';
  final whole = h.floor();
  final mins = ((h - whole) * 60).round();
  return whole == 0 ? '$mins min' : '$whole h $mins';
}

/// Builds the closure PATCH body. Pure and unit-tested so it stays in sync with
/// the API `UpdateInterventionDto` (status + actualDuration + signedBy).
Map<String, dynamic> buildCloseBody({
  required double actualDuration,
  required String signedBy,
}) =>
    {
      'status': 'completed',
      'actualDuration': actualDuration,
      'signedBy': signedBy,
    };

/// Closure report — confirm the work, capture the actual duration and the
/// technician's signature, then complete the intervention offline-first.
/// Mirrors the prototype `CloseWorkScreen` (the generated-PDF step awaits a
/// pdf/share dependency; the quality rating stays read-only — it's the
/// manager's call). Reached from the mission detail "Terminer" action.
class CloseWorkScreen extends ConsumerStatefulWidget {
  const CloseWorkScreen({required this.missionId, super.key});

  final String missionId;

  @override
  ConsumerState<CloseWorkScreen> createState() => _CloseWorkScreenState();
}

class _CloseWorkScreenState extends ConsumerState<CloseWorkScreen> {
  final _sig =
      SignatureController(penStrokeWidth: 2.5, penColor: AppColors.ink);
  double? _actual;
  bool _submitting = false;

  @override
  void dispose() {
    _sig.dispose();
    super.dispose();
  }

  Future<void> _close(
    Intervention mission,
    Machine? machine,
    String signedBy,
  ) async {
    if (_sig.isEmpty || _submitting) return;
    setState(() => _submitting = true);
    final actual = _actual ?? mission.duration;
    final updated = mission.copyWith(
      status: InterventionStatus.completed,
      actualDuration: actual,
      signedBy: signedBy,
    );
    await ref.read(syncServiceProvider).mutateIntervention(
          updated,
          buildCloseBody(actualDuration: actual, signedBy: signedBy),
        );
    if (!mounted) return;
    // Generate the report PDF and open the share sheet (WhatsApp, e-mail…).
    // Best-effort + unawaited so closure persists and navigates regardless.
    unawaited(
      shareInterventionReport(
        mission: updated,
        machine: machine,
        technicianName: signedBy,
      ).catchError((Object _) {}),
    );
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Intervention clôturée')),
    );
    context.go('/missions');
  }

  @override
  Widget build(BuildContext context) {
    final mission = ref.watch(missionByIdProvider(widget.missionId));
    final machine =
        ref.watch(machinesByIdProvider).valueOrNull?[mission?.machineId];
    final signedBy = ref.watch(authControllerProvider).valueOrNull?.name ?? '';

    return Scaffold(
      backgroundColor: AppColors.bgSoft,
      appBar: AppBar(
        backgroundColor: AppColors.bgSoft,
        leading: IconButton(
          icon: const Icon(Icons.chevron_left, size: 28),
          onPressed: () =>
              context.canPop() ? context.pop() : context.go('/missions'),
        ),
        title: Text(
          mission == null ? '' : _ref(mission.id),
          style: const TextStyle(
            fontSize: 13,
            color: AppColors.mute,
            fontFeatures: [FontFeature.tabularFigures()],
          ),
        ),
        centerTitle: true,
      ),
      body: mission == null
          ? const Center(
              child: Text(
                'Mission introuvable.',
                style: TextStyle(color: AppColors.mute),
              ),
            )
          : _Body(
              mission: mission,
              machine: machine,
              signature: _sig,
              actual: _actual ?? mission.duration,
              submitting: _submitting,
              onActual: (v) => setState(() => _actual = v),
              onClose: () => _close(mission, machine, signedBy),
            ),
    );
  }
}

String _ref(String id) => 'I-${id.substring(id.length - 4).toUpperCase()}';

class _Body extends StatelessWidget {
  const _Body({
    required this.mission,
    required this.machine,
    required this.signature,
    required this.actual,
    required this.submitting,
    required this.onActual,
    required this.onClose,
  });

  final Intervention mission;
  final Machine? machine;
  final SignatureController signature;
  final double actual;
  final bool submitting;
  final ValueChanged<double> onActual;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    final tasks = mission.checklist.where((t) => t.done).toList();
    final over = actual > mission.duration;
    final delta = (actual - mission.duration).abs();

    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 4, 18, 8),
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(4, 8, 4, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'INTERVENTION TERMINÉE',
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w600,
                  color: AppColors.brand,
                  letterSpacing: 0.8,
                ),
              ),
              SizedBox(height: 6),
              Text(
                "Rapport d'intervention",
                style: TextStyle(
                  fontSize: 23,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.5,
                  color: AppColors.ink,
                ),
              ),
            ],
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: AppColors.bg,
            border: Border.all(color: AppColors.line),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: AppColors.line)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            "Rapport d'intervention",
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppColors.ink,
                            ),
                          ),
                          Text(
                            '${_ref(mission.id)} · MaintFlow',
                            style: const TextStyle(
                              fontSize: 10.5,
                              color: AppColors.mute,
                              fontFeatures: [FontFeature.tabularFigures()],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const AppPill('À clôturer', tone: PillTone.bright),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _DocRow(
                      k: 'Machine',
                      v: machine == null
                          ? mission.machineId
                          : '${machine!.name} · ${machine!.code}',
                    ),
                    _DocRow(k: 'Atelier', v: machine?.workshop ?? '—'),
                    _DocRow(k: 'Date', v: _longDate(mission.scheduledFor)),
                    const SizedBox(height: 14),
                    _DocLabel('Tâches réalisées · ${tasks.length}'),
                    const SizedBox(height: 6),
                    if (tasks.isEmpty)
                      const Text(
                        'Aucune tâche cochée.',
                        style: TextStyle(fontSize: 12.5, color: AppColors.mute),
                      )
                    else
                      for (final t in tasks) _TaskLine(label: t.label),
                    const SizedBox(height: 14),
                    const _DocLabel('Durée'),
                    const SizedBox(height: 6),
                    _DurationBlock(
                      planned: mission.duration,
                      actual: actual,
                      over: over,
                      delta: delta,
                      onActual: onActual,
                    ),
                    const SizedBox(height: 14),
                    const _DocLabel('Signature technicien'),
                    const SizedBox(height: 6),
                    _SignaturePad(controller: signature),
                    const SizedBox(height: 14),
                    const _DocLabel('Évaluation qualité'),
                    const SizedBox(height: 6),
                    const _RatingNote(),
                  ],
                ),
              ),
            ],
          ),
        ),
        const Padding(
          padding: EdgeInsets.fromLTRB(4, 10, 4, 4),
          child: Text(
            'La note qualité est attribuée par le responsable, pas par le '
            'technicien.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 10.5, color: AppColors.faint),
          ),
        ),
        const SizedBox(height: 12),
        ValueListenableBuilder<List<Point>>(
          valueListenable: signature,
          builder: (context, points, _) {
            final canClose = points.isNotEmpty && !submitting;
            return _Cta(
              label: points.isEmpty
                  ? 'Signez pour clôturer'
                  : (submitting ? 'Clôture…' : 'Clôturer & générer le PDF'),
              onTap: canClose ? onClose : null,
            );
          },
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _DocRow extends StatelessWidget {
  const _DocRow({required this.k, required this.v});

  final String k;
  final String v;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 84,
            child: Text(
              k,
              style: const TextStyle(fontSize: 12, color: AppColors.mute),
            ),
          ),
          Expanded(
            child: Text(
              v,
              style: const TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: AppColors.text,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DocLabel extends StatelessWidget {
  const _DocLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: const TextStyle(
        fontSize: 10.5,
        fontWeight: FontWeight.w700,
        color: AppColors.mute,
        letterSpacing: 0.5,
      ),
    );
  }
}

class _TaskLine extends StatelessWidget {
  const _TaskLine({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Container(
            width: 18,
            height: 18,
            decoration: BoxDecoration(
              color: AppColors.brand,
              borderRadius: BorderRadius.circular(5),
            ),
            child: const Icon(Icons.check, size: 12, color: Colors.white),
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(fontSize: 12.5, color: AppColors.text),
            ),
          ),
        ],
      ),
    );
  }
}

class _DurationBlock extends StatelessWidget {
  const _DurationBlock({
    required this.planned,
    required this.actual,
    required this.over,
    required this.delta,
    required this.onActual,
  });

  final double planned;
  final double actual;
  final bool over;
  final double delta;
  final ValueChanged<double> onActual;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.bgSoft,
        border: Border.all(color: AppColors.line),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Column(
            children: [
              Text(
                fmtHours(planned),
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink,
                  fontFeatures: [FontFeature.tabularFigures()],
                ),
              ),
              const Text(
                'Prévu',
                style: TextStyle(fontSize: 10, color: AppColors.mute),
              ),
            ],
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 12),
            child: Icon(Icons.arrow_forward, size: 15, color: AppColors.faint),
          ),
          Column(
            children: [
              Text(
                fmtHours(actual),
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: over ? AppColors.crit : AppColors.brand,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
              const Text(
                'Réel',
                style: TextStyle(fontSize: 10, color: AppColors.mute),
              ),
            ],
          ),
          const Spacer(),
          _StepBtn(
            icon: Icons.remove,
            onTap: actual <= 0 ? null : () => onActual(actual - 0.5),
          ),
          const SizedBox(width: 8),
          _StepBtn(icon: Icons.add, onTap: () => onActual(actual + 0.5)),
        ],
      ),
    );
  }
}

class _StepBtn extends StatelessWidget {
  const _StepBtn({required this.icon, this.onTap});

  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: 30,
        height: 30,
        decoration: BoxDecoration(
          color: AppColors.bg,
          border: Border.all(color: AppColors.line),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          icon,
          size: 16,
          color: enabled ? AppColors.ink : AppColors.faint,
        ),
      ),
    );
  }
}

class _SignaturePad extends StatelessWidget {
  const _SignaturePad({required this.controller});

  final SignatureController controller;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: Container(
            height: 120,
            decoration: BoxDecoration(
              color: AppColors.soft,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.line),
            ),
            child: Signature(
              controller: controller,
              backgroundColor: AppColors.soft,
            ),
          ),
        ),
        const SizedBox(height: 6),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton.icon(
            onPressed: controller.clear,
            icon: const Icon(Icons.refresh, size: 14, color: AppColors.mute),
            label: const Text(
              'Effacer',
              style: TextStyle(fontSize: 11.5, color: AppColors.mute),
            ),
          ),
        ),
      ],
    );
  }
}

class _RatingNote extends StatelessWidget {
  const _RatingNote();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 11),
      decoration: BoxDecoration(
        color: AppColors.bgSoft,
        border: Border.all(color: AppColors.line),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Row(
            children: List.generate(
              5,
              (_) => const Icon(
                Icons.star_border,
                size: 18,
                color: AppColors.faint,
              ),
            ),
          ),
          const SizedBox(width: 10),
          const Expanded(
            child: Text(
              'En attente — réservé au responsable.',
              style: TextStyle(fontSize: 11, color: AppColors.mute),
            ),
          ),
        ],
      ),
    );
  }
}

class _Cta extends StatelessWidget {
  const _Cta({required this.label, this.onTap});

  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    return Material(
      color: enabled ? AppColors.brandDeep : AppColors.faint,
      borderRadius: BorderRadius.circular(100),
      child: InkWell(
        borderRadius: BorderRadius.circular(100),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 15),
          child: Center(
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
