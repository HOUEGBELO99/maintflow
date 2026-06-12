import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:maintflow_mobile/core/theme/app_theme.dart';
import 'package:maintflow_mobile/core/widgets/app_pill.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/features/missions/missions_providers.dart';

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

String _kindLabel(InterventionKind k) =>
    k == InterventionKind.preventive ? 'Préventive' : 'Corrective';

AppPill _statusPill(Intervention m) {
  switch (m.status) {
    case InterventionStatus.inProgress:
      return const AppPill('En cours', tone: PillTone.bright, dot: true);
    case InterventionStatus.completed:
      return const AppPill('Terminée', tone: PillTone.ok, dot: true);
    case InterventionStatus.cancelled:
      return const AppPill('Annulée', tone: PillTone.mute);
    case InterventionStatus.planned:
      return m.kind == InterventionKind.preventive
          ? const AppPill('Préventive', tone: PillTone.info)
          : const AppPill('Corrective', tone: PillTone.warn);
  }
}

/// Mission (work-order) detail — read-only for now. Toggling the checklist and
/// changing status land with the offline write path.
class MissionDetailScreen extends ConsumerWidget {
  const MissionDetailScreen({required this.missionId, super.key});

  final String missionId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mission = ref.watch(missionByIdProvider(missionId));
    final machine =
        ref.watch(machinesByIdProvider).valueOrNull?[mission?.machineId];

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.chevron_left, size: 28),
          onPressed: () => context.pop(),
        ),
        title: Text(
          mission == null
              ? ''
              : 'I-${mission.id.substring(mission.id.length - 4).toUpperCase()}',
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
          : _Body(mission: mission, machine: machine),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({required this.mission, this.machine});

  final Intervention mission;
  final Machine? machine;

  @override
  Widget build(BuildContext context) {
    final done = mission.checklist.where((c) => c.done).length;
    return ListView(
      padding: const EdgeInsets.fromLTRB(22, 4, 22, 28),
      children: [
        Row(
          children: [
            _statusPill(mission),
            const SizedBox(width: 8),
            Text(
              _kindLabel(mission.kind),
              style: const TextStyle(fontSize: 12, color: AppColors.mute),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Text(
          mission.description,
          style: const TextStyle(
            fontSize: 21,
            fontWeight: FontWeight.w700,
            height: 1.25,
            letterSpacing: -0.4,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 16),
        _MachineCard(machine: machine, fallbackId: mission.machineId),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _MetaTile(
                label: 'Date prévue',
                value: _longDate(mission.scheduledFor),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _MetaTile(
                label: 'Durée prévue',
                value: '${mission.duration} h',
              ),
            ),
          ],
        ),
        const SizedBox(height: 22),
        Text(
          'TÂCHES · $done/${mission.checklist.length}',
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: AppColors.mute,
            letterSpacing: 0.4,
          ),
        ),
        const SizedBox(height: 10),
        if (mission.checklist.isEmpty)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 16),
            decoration: BoxDecoration(
              border:
                  Border.all(color: AppColors.faint, style: BorderStyle.solid),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Center(
              child: Text(
                'Aucune tâche pour cette intervention.',
                style: TextStyle(fontSize: 12.5, color: AppColors.mute),
              ),
            ),
          )
        else
          for (final item in mission.checklist)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _ChecklistRow(label: item.label, done: item.done),
            ),
      ],
    );
  }
}

class _MachineCard extends StatelessWidget {
  const _MachineCard({required this.fallbackId, this.machine});

  final Machine? machine;
  final String fallbackId;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.brand50,
        border: Border.all(color: AppColors.brand100),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Text(
            machine?.code ?? fallbackId,
            style: const TextStyle(
              fontSize: 10.5,
              fontWeight: FontWeight.w600,
              color: AppColors.brandDeep,
              fontFeatures: [FontFeature.tabularFigures()],
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              machine?.name ?? '',
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.brandDeep,
              ),
            ),
          ),
          Text(
            machine?.workshop ?? '',
            style: const TextStyle(fontSize: 11.5, color: AppColors.mute),
          ),
        ],
      ),
    );
  }
}

class _MetaTile extends StatelessWidget {
  const _MetaTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.bgSoft,
        border: Border.all(color: AppColors.line),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: AppColors.mute,
              letterSpacing: 0.4,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14.5,
              fontWeight: FontWeight.w600,
              color: AppColors.ink,
            ),
          ),
        ],
      ),
    );
  }
}

class _ChecklistRow extends StatelessWidget {
  const _ChecklistRow({required this.label, required this.done});

  final String label;
  final bool done;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
      decoration: BoxDecoration(
        color: done ? AppColors.bgSoft : AppColors.bg,
        border: Border.all(color: done ? AppColors.line : AppColors.lineSoft),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: done ? AppColors.brand : Colors.transparent,
              borderRadius: BorderRadius.circular(7),
              border: Border.all(
                color: done ? AppColors.brand : AppColors.faint,
                width: 1.5,
              ),
            ),
            child: done
                ? const Icon(Icons.check, size: 14, color: Colors.white)
                : null,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.w500,
                color: done ? AppColors.mute : AppColors.text,
                decoration: done ? TextDecoration.lineThrough : null,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
