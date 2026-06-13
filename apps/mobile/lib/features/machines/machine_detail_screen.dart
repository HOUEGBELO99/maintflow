import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:maintflow_mobile/core/theme/app_theme.dart';
import 'package:maintflow_mobile/core/widgets/app_pill.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/fault.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/features/alerts/alerts_providers.dart';
import 'package:maintflow_mobile/features/machines/home_screen.dart'
    show machineStateBadge;
import 'package:maintflow_mobile/features/machines/machines_providers.dart';

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

String _criticality(Criticality c) => switch (c) {
      Criticality.high => 'Critique',
      Criticality.medium => 'Moyenne',
      Criticality.low => 'Faible',
    };

String _intervStatus(InterventionStatus s) => switch (s) {
      InterventionStatus.planned => 'Planifiée',
      InterventionStatus.inProgress => 'En cours',
      InterventionStatus.completed => 'Terminée',
      InterventionStatus.cancelled => 'Annulée',
    };

String _faultType(FaultType t) => switch (t) {
      FaultType.mecanique => 'Mécanique',
      FaultType.electrique => 'Électrique',
      FaultType.hydraulique => 'Hydraulique',
      FaultType.logiciel => 'Logiciel',
    };

String _severity(FaultSeverity s) => switch (s) {
      FaultSeverity.critical => 'Critique',
      FaultSeverity.medium => 'Moyen',
      FaultSeverity.low => 'Faible',
    };

int _sevRank(FaultSeverity s) => switch (s) {
      FaultSeverity.critical => 2,
      FaultSeverity.medium => 1,
      FaultSeverity.low => 0,
    };

/// Mean time between failures, in days, from the machine's fault history.
int? _mtbfDays(List<Fault> faults) {
  if (faults.length < 2) return null;
  final ts = faults.map((f) => f.reportedAt.millisecondsSinceEpoch).toList()
    ..sort();
  var sum = 0;
  for (var i = 1; i < ts.length; i++) {
    sum += ts[i] - ts[i - 1];
  }
  return (sum / (ts.length - 1) / 86400000).round();
}

String _downtime(DateTime since) {
  final d = DateTime.now().difference(since);
  final h = d.inHours;
  final m = (d.inMinutes % 60).toString().padLeft(2, '0');
  final s = (d.inSeconds % 60).toString().padLeft(2, '0');
  if (d.inDays >= 1) return '${d.inDays}j ${h % 24}h ${m}m';
  return '${h}h ${m}m ${s}s';
}

/// Machine detail — spec card and the technician's interventions on it, read
/// offline-first from the cache. The primary action declares a fault.
class MachineDetailScreen extends ConsumerWidget {
  const MachineDetailScreen({required this.machineId, super.key});

  final String machineId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final machine = ref.watch(machineByIdProvider(machineId));
    final interventions = ref.watch(machineInterventionsProvider(machineId));
    final allFaults = ref.watch(faultsProvider).valueOrNull ?? const <Fault>[];
    final machineFaults =
        allFaults.where((f) => f.machineId == machineId).toList();
    final activeFault =
        (machineFaults.where((f) => f.status != FaultStatus.resolved).toList()
              ..sort((a, b) {
                final sev =
                    _sevRank(b.severity).compareTo(_sevRank(a.severity));
                return sev != 0 ? sev : b.reportedAt.compareTo(a.reportedAt);
              }))
            .firstOrNull;
    final activeIv = interventions
        .where(
          (i) =>
              i.status == InterventionStatus.inProgress ||
              i.status == InterventionStatus.planned,
        )
        .firstOrNull;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.chevron_left, size: 28),
          onPressed: () =>
              context.canPop() ? context.pop() : context.go('/home'),
        ),
        title: Text(
          machine?.code ?? '',
          style: const TextStyle(
            fontSize: 13,
            color: AppColors.mute,
            fontFeatures: [FontFeature.tabularFigures()],
          ),
        ),
        centerTitle: true,
      ),
      body: machine == null
          ? const Center(
              child: Text(
                'Machine introuvable.',
                style: TextStyle(color: AppColors.mute),
              ),
            )
          : _Body(
              machine: machine,
              interventions: interventions,
              faults: machineFaults,
              activeFault: activeFault,
              onIntervene: activeIv == null
                  ? null
                  : () => context.push('/missions/${activeIv.id}'),
            ),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({
    required this.machine,
    required this.interventions,
    required this.faults,
    this.activeFault,
    this.onIntervene,
  });

  final Machine machine;
  final List<Intervention> interventions;
  final List<Fault> faults;
  final Fault? activeFault;
  final VoidCallback? onIntervene;

  @override
  Widget build(BuildContext context) {
    final (label, tone) = machineStateBadge(machine.state);
    final mtbf = _mtbfDays(faults);
    return ListView(
      padding: const EdgeInsets.fromLTRB(22, 4, 22, 28),
      children: [
        Text(
          '${machine.workshop} · ${machine.type}',
          style: const TextStyle(
            fontSize: 10.5,
            fontWeight: FontWeight.w600,
            color: AppColors.mute,
            letterSpacing: 0.6,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          machine.name,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w700,
            height: 1.2,
            letterSpacing: -0.5,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            AppPill(label, tone: tone, dot: tone == PillTone.crit),
            if (activeFault != null) ...[
              const SizedBox(width: 10),
              const Icon(Icons.schedule, size: 14, color: AppColors.mute),
              const SizedBox(width: 4),
              Text(
                'depuis ${_downtime(activeFault!.reportedAt)}',
                style: const TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFFDC2626),
                  fontFeatures: [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: _SpecTile(
                label: 'Criticité',
                value: _criticality(machine.criticality),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _SpecTile(
                label: 'Heures',
                value: '${(machine.runtime / 1000).toStringAsFixed(1)}k',
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _SpecTile(
                label: 'MTBF',
                value: mtbf != null ? '$mtbf j' : '—',
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _SpecTile(
                label: 'Installée le',
                value: _longDate(machine.installedAt),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _SpecTile(
                label: 'Durée de vie',
                value: '${machine.lifespanYears} ans',
              ),
            ),
          ],
        ),
        if (activeFault != null) ...[
          const SizedBox(height: 24),
          const Text(
            'PANNE EN COURS',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: AppColors.mute,
              letterSpacing: 0.4,
            ),
          ),
          const SizedBox(height: 10),
          _ActiveFaultCard(fault: activeFault!),
        ],
        const SizedBox(height: 24),
        Text(
          'INTERVENTIONS · ${interventions.length}',
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: AppColors.mute,
            letterSpacing: 0.4,
          ),
        ),
        const SizedBox(height: 10),
        if (interventions.isEmpty)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 16),
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.lineSoft),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Center(
              child: Text(
                'Aucune intervention sur cette machine.',
                style: TextStyle(fontSize: 12.5, color: AppColors.mute),
              ),
            ),
          )
        else
          for (final iv in interventions)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _InterventionRow(
                intervention: iv,
                onTap: () => context.push('/missions/${iv.id}'),
              ),
            ),
        const SizedBox(height: 18),
        if (onIntervene != null) ...[
          _Cta(label: 'Intervenir', onTap: onIntervene!),
          const SizedBox(height: 10),
        ],
        _Cta(
          label: 'Signaler une panne',
          onTap: () => context.push('/report?machineId=${machine.id}'),
        ),
      ],
    );
  }
}

/// "Panne en cours" card — green downtime banner + the fault detail.
class _ActiveFaultCard extends StatelessWidget {
  const _ActiveFaultCard({required this.fault});

  final Fault fault;

  @override
  Widget build(BuildContext context) {
    final ref = 'F-${fault.id.substring(fault.id.length - 4).toUpperCase()}';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: const BoxDecoration(
            color: AppColors.brandDeep,
            borderRadius: BorderRadius.vertical(top: Radius.circular(14)),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'IMMOBILISÉE DEPUIS',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: Colors.white70,
                        letterSpacing: 0.6,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _downtime(fault.reportedAt),
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: AppColors.brandBright,
                        fontFeatures: [FontFeature.tabularFigures()],
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.schedule,
                  size: 18,
                  color: AppColors.brandBright,
                ),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: const Color(0xFFFEECEC),
            borderRadius:
                const BorderRadius.vertical(bottom: Radius.circular(14)),
            border: Border.all(color: const Color(0xFFFAD4D4)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    ref,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFFDC2626),
                      fontFeatures: [FontFeature.tabularFigures()],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFAD4D4),
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: Text(
                      '${_faultType(fault.type)} · ${_severity(fault.severity)}',
                      style: const TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFFB91C1C),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                fault.description,
                style: const TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w600,
                  color: AppColors.ink,
                  height: 1.3,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Signalé par ${fault.reportedBy}'
                '${fault.rootCause != null ? ' · cause : ${fault.rootCause}' : ''}',
                style: const TextStyle(fontSize: 11.5, color: AppColors.mute),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SpecTile extends StatelessWidget {
  const _SpecTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
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
              fontSize: 9.5,
              fontWeight: FontWeight.w600,
              color: AppColors.mute,
              letterSpacing: 0.3,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w600,
              color: AppColors.ink,
            ),
          ),
        ],
      ),
    );
  }
}

class _InterventionRow extends StatelessWidget {
  const _InterventionRow({required this.intervention, required this.onTap});

  final Intervention intervention;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final ref = 'I-'
        '${intervention.id.substring(intervention.id.length - 4).toUpperCase()}';
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.bg,
          border: Border.all(color: AppColors.lineSoft),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        ref,
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppColors.faint,
                          fontFeatures: [FontFeature.tabularFigures()],
                        ),
                      ),
                      const SizedBox(width: 7),
                      Text(
                        _intervStatus(intervention.status),
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppColors.mute,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    intervention.description,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600,
                      color: AppColors.text,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.faint, size: 18),
          ],
        ),
      ),
    );
  }
}

class _Cta extends StatelessWidget {
  const _Cta({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.brandDeep,
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
