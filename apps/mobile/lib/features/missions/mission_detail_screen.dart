import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:maintflow_mobile/core/theme/app_theme.dart';
import 'package:maintflow_mobile/core/widgets/app_pill.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/location/location_service.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/data/repositories/sync_service.dart';
import 'package:maintflow_mobile/features/missions/missions_providers.dart';

const _statusWire = {
  InterventionStatus.planned: 'planned',
  InterventionStatus.inProgress: 'in_progress',
  InterventionStatus.completed: 'completed',
  InterventionStatus.cancelled: 'cancelled',
};

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

/// Mission (work-order) detail. The checklist and status changes are written
/// offline-first via [SyncService] — the cache updates instantly and the API
/// call is queued for replay.
class MissionDetailScreen extends ConsumerWidget {
  const MissionDetailScreen({required this.missionId, super.key});

  final String missionId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mission = ref.watch(missionByIdProvider(missionId));
    final machine =
        ref.watch(machinesByIdProvider).valueOrNull?[mission?.machineId];

    void toggle(int index) {
      if (mission == null) return;
      final next = [...mission.checklist];
      next[index] = next[index].copyWith(done: !next[index].done);
      final updated = mission.copyWith(checklist: next);
      ref.read(syncServiceProvider).mutateIntervention(updated, {
        'checklist': next.map((c) => c.toJson()).toList(),
      });
    }

    // Start the work order, capturing a best-effort check-in location. The
    // geolocation lookup never blocks the offline-first write: on denial/timeout
    // it resolves to null and we start without coordinates.
    Future<void> start() async {
      if (mission == null) return;
      final pos = await ref.read(locationServiceProvider).current();
      final updated = mission.copyWith(
        status: InterventionStatus.inProgress,
        checkInLat: pos?.lat,
        checkInLng: pos?.lng,
      );
      ref.read(syncServiceProvider).mutateIntervention(updated, {
        'status': _statusWire[InterventionStatus.inProgress],
        if (pos != null) 'checkInLat': pos.lat,
        if (pos != null) 'checkInLng': pos.lng,
      });
    }

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
          : _Body(
              mission: mission,
              machine: machine,
              onToggle: toggle,
              onStart: start,
              onClose: () => context.push('/missions/$missionId/close'),
            ),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({
    required this.mission,
    required this.onToggle,
    required this.onStart,
    required this.onClose,
    this.machine,
  });

  final Intervention mission;
  final Machine? machine;
  final void Function(int index) onToggle;
  final VoidCallback onStart;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    final done = mission.checklist.where((c) => c.done).length;
    final editable = mission.status == InterventionStatus.planned ||
        mission.status == InterventionStatus.inProgress;
    final allDone =
        mission.checklist.isNotEmpty && done == mission.checklist.length;
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
          for (var i = 0; i < mission.checklist.length; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _ChecklistRow(
                label: mission.checklist[i].label,
                done: mission.checklist[i].done,
                onTap: editable ? () => onToggle(i) : null,
              ),
            ),
        const SizedBox(height: 14),
        _ActionButton(
          status: mission.status,
          allDone: allDone,
          onStart: onStart,
          onClose: onClose,
        ),
      ],
    );
  }
}

/// Primary action for the work order: start it (planned), finish it (in progress
/// once the checklist is done), or nothing once completed/cancelled.
class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.status,
    required this.allDone,
    required this.onStart,
    required this.onClose,
  });

  final InterventionStatus status;
  final bool allDone;
  final VoidCallback onStart;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    if (status == InterventionStatus.planned) {
      return _Cta(
        label: 'Démarrer l’intervention',
        onTap: onStart,
      );
    }
    if (status == InterventionStatus.inProgress) {
      return _Cta(
        label:
            allDone ? 'Terminer l’intervention' : 'Validez toutes les tâches',
        onTap: allDone ? onClose : null,
      );
    }
    return const SizedBox.shrink();
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
  const _ChecklistRow({required this.label, required this.done, this.onTap});

  final String label;
  final bool done;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
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
      ),
    );
  }
}
