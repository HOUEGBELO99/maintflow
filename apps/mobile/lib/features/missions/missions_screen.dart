import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:maintflow_mobile/core/theme/app_theme.dart';
import 'package:maintflow_mobile/core/widgets/app_pill.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/features/missions/missions_providers.dart';
import 'package:maintflow_mobile/features/shell/bottom_tabs.dart';

/// "Mes missions" — the technician's interventions for today, read from the API
/// (offline Drift cache will front this next). Tapping a row will open its
/// detail / checklist once those screens land.
String _fmtHours(double h) {
  if (h == h.roundToDouble()) return '${h.toInt()} h';
  final whole = h.floor();
  final mins = ((h - whole) * 60).round();
  return whole == 0 ? '$mins min' : '$whole h $mins';
}

String _fmtDate(DateTime d) =>
    '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}';

bool _isActive(InterventionStatus s) =>
    s != InterventionStatus.completed && s != InterventionStatus.cancelled;

class MissionsScreen extends ConsumerWidget {
  const MissionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final missionsAsync = ref.watch(missionsProvider);
    final machines = ref.watch(machinesByIdProvider).valueOrNull ??
        const <String, Machine>{};

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        bottom: false,
        child: missionsAsync.when(
          loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.brand),
          ),
          error: (e, _) =>
              _ErrorState(onRetry: () => ref.invalidate(missionsProvider)),
          data: (missions) {
            final total = missions.length;
            final done = missions
                .where((m) => m.status == InterventionStatus.completed)
                .length;
            final remaining = missions
                .where((m) => _isActive(m.status))
                .fold<double>(0, (s, m) => s + m.duration);
            final progress = total == 0 ? 0.0 : done / total;

            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 22),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'MES INTERVENTIONS',
                                  style: TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.mute,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '$total mission${total > 1 ? 's' : ''}',
                                  style: const TextStyle(
                                    fontSize: 26,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: -0.7,
                                    color: AppColors.ink,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.tune, color: AppColors.ink),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _ProgressBlock(
                        done: done,
                        total: total,
                        remainingLabel: _fmtHours(remaining),
                        progress: progress,
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: missions.isEmpty
                      ? const Center(
                          child: Text(
                            'Aucune mission assignée.',
                            style: TextStyle(color: AppColors.mute),
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                          itemCount: missions.length,
                          separatorBuilder: (_, __) => const Divider(
                            height: 1,
                            thickness: 1,
                            color: AppColors.lineSoft,
                          ),
                          itemBuilder: (_, i) => _MissionRow(
                            mission: missions[i],
                            machine: machines[missions[i].machineId],
                          ),
                        ),
                ),
                BottomTabs(active: 'missions', onTap: (_) {}),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _ProgressBlock extends StatelessWidget {
  const _ProgressBlock({
    required this.done,
    required this.total,
    required this.remainingLabel,
    required this.progress,
  });

  final int done;
  final int total;
  final String remainingLabel;
  final double progress;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.bgSoft,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text.rich(
                TextSpan(
                  children: [
                    TextSpan(
                      text: '$done/$total',
                      style: const TextStyle(
                        color: AppColors.ink,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                    TextSpan(
                      text: done > 1 ? ' terminées' : ' terminée',
                      style: const TextStyle(
                        color: AppColors.mute,
                        fontSize: 12.5,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                '$remainingLabel restantes',
                style: const TextStyle(
                  color: AppColors.mute,
                  fontSize: 11.5,
                  fontFeatures: [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(2),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 4,
              backgroundColor: AppColors.line,
              valueColor: const AlwaysStoppedAnimation(AppColors.brand),
            ),
          ),
        ],
      ),
    );
  }
}

class _MissionRow extends StatelessWidget {
  const _MissionRow({required this.mission, this.machine});

  final Intervention mission;
  final Machine? machine;

  AppPill _statusPill() {
    switch (mission.status) {
      case InterventionStatus.inProgress:
        return const AppPill('En cours', tone: PillTone.bright, dot: true);
      case InterventionStatus.completed:
        return const AppPill('Terminée', tone: PillTone.ok, dot: true);
      case InterventionStatus.cancelled:
        return const AppPill('Annulée', tone: PillTone.mute);
      case InterventionStatus.planned:
        return mission.kind == InterventionKind.preventive
            ? const AppPill('Préventive', tone: PillTone.info)
            : const AppPill('Corrective', tone: PillTone.warn);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isNow = mission.status == InterventionStatus.inProgress;
    final isDone = mission.status == InterventionStatus.completed;
    final ref =
        'I-${mission.id.substring(mission.id.length - 4).toUpperCase()}';
    final subtitle = machine == null
        ? mission.machineId
        : '${machine!.code} · ${machine!.workshop}';

    return Opacity(
      opacity: isDone ? 0.55 : 1,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 54,
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: isNow ? AppColors.brandDeep : AppColors.bg,
                border: Border.all(
                  color: isNow ? AppColors.brandDeep : AppColors.line,
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                children: [
                  Text(
                    _fmtDate(mission.scheduledFor),
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.2,
                      height: 1,
                      color: isNow ? Colors.white : AppColors.ink,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    _fmtHours(mission.duration),
                    style: TextStyle(
                      fontSize: 10,
                      color: isNow ? AppColors.brandBright : AppColors.mute,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      _statusPill(),
                      const SizedBox(width: 6),
                      Text(
                        ref,
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppColors.faint,
                          fontFeatures: [FontFeature.tabularFigures()],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    mission.description,
                    style: TextStyle(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w600,
                      height: 1.3,
                      color: AppColors.text,
                      decoration: isDone ? TextDecoration.lineThrough : null,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 12, color: AppColors.mute),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Chargement impossible.',
            style: TextStyle(color: AppColors.mute),
          ),
          const SizedBox(height: 12),
          OutlinedButton(onPressed: onRetry, child: const Text('Réessayer')),
        ],
      ),
    );
  }
}
