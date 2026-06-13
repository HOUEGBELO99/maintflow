import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:maintflow_mobile/core/network/connectivity.dart';
import 'package:maintflow_mobile/core/theme/app_theme.dart';
import 'package:maintflow_mobile/core/widgets/app_pill.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/fault.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/data/repositories/missions_repository.dart';
import 'package:maintflow_mobile/features/alerts/alerts_providers.dart';
import 'package:maintflow_mobile/features/missions/missions_providers.dart';

(String label, PillTone tone) severityBadge(FaultSeverity s) => switch (s) {
      FaultSeverity.critical => ('Critique', PillTone.crit),
      FaultSeverity.medium => ('Moyenne', PillTone.warn),
      FaultSeverity.low => ('Faible', PillTone.info),
    };

String faultTypeLabel(FaultType t) => switch (t) {
      FaultType.mecanique => 'Mécanique',
      FaultType.electrique => 'Électrique',
      FaultType.hydraulique => 'Hydraulique',
      FaultType.logiciel => 'Logiciel',
    };

String _ref(String id) {
  final tail = id.length <= 4 ? id : id.substring(id.length - 4);
  return 'F-${tail.toUpperCase()}';
}

/// "Alertes" — the site's fault feed, read offline-first from the Drift cache,
/// newest first, with tab filters. Mirrors the prototype `AlertsScreen`. Rows
/// open the affected machine. (Read/unread state awaits the API notifications
/// module, so the tabs filter on severity/status instead.)
class AlertsScreen extends ConsumerStatefulWidget {
  const AlertsScreen({super.key});

  @override
  ConsumerState<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends ConsumerState<AlertsScreen> {
  AlertFilter _filter = AlertFilter.all;

  Future<void> _refresh() async {
    try {
      await ref.read(missionsRepositoryProvider).refreshFaults();
    } catch (_) {
      // Offline — the cache keeps serving the last known feed.
    }
  }

  @override
  Widget build(BuildContext context) {
    final faultsAsync = ref.watch(faultsProvider);
    final machines = ref.watch(machinesByIdProvider).valueOrNull ??
        const <String, Machine>{};
    final offline = ref.watch(connectivityProvider).valueOrNull == false;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.chevron_left, size: 28),
          onPressed: () =>
              context.canPop() ? context.pop() : context.go('/home'),
        ),
        title: const Text(
          'Alertes',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.ink,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        top: false,
        child: faultsAsync.when(
          loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.brand),
          ),
          error: (e, _) => Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Chargement impossible.',
                  style: TextStyle(color: AppColors.mute),
                ),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: () => ref.invalidate(faultsProvider),
                  child: const Text('Réessayer'),
                ),
              ],
            ),
          ),
          data: (all) {
            final counts = <AlertFilter, int>{
              AlertFilter.all: all.length,
              AlertFilter.critical:
                  filterFaults(all, AlertFilter.critical).length,
              AlertFilter.unresolved:
                  filterFaults(all, AlertFilter.unresolved).length,
            };
            final shown = filterFaults(all, _filter);

            return Column(
              children: [
                if (offline) const _OfflineBanner(),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
                  child: _Tabs(
                    active: _filter,
                    counts: counts,
                    onSelect: (f) => setState(() => _filter = f),
                  ),
                ),
                Expanded(
                  child: RefreshIndicator(
                    color: AppColors.brand,
                    onRefresh: _refresh,
                    child: shown.isEmpty
                        ? ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            children: const [
                              SizedBox(height: 80),
                              Center(
                                child: Text(
                                  'Rien à afficher ici.',
                                  style: TextStyle(color: AppColors.mute),
                                ),
                              ),
                            ],
                          )
                        : ListView.separated(
                            physics: const AlwaysScrollableScrollPhysics(),
                            padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                            itemCount: shown.length,
                            separatorBuilder: (_, __) => const Divider(
                              height: 1,
                              thickness: 1,
                              color: AppColors.lineSoft,
                            ),
                            itemBuilder: (_, i) => _AlertRow(
                              fault: shown[i],
                              machine: machines[shown[i].machineId],
                              onTap: () => context.push(
                                '/machines/${shown[i].machineId}',
                              ),
                            ),
                          ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _Tabs extends StatelessWidget {
  const _Tabs({
    required this.active,
    required this.counts,
    required this.onSelect,
  });

  final AlertFilter active;
  final Map<AlertFilter, int> counts;
  final ValueChanged<AlertFilter> onSelect;

  static const _tabs = <(AlertFilter filter, String label)>[
    (AlertFilter.all, 'Tout'),
    (AlertFilter.critical, 'Critique'),
    (AlertFilter.unresolved, 'Non résolues'),
  ];

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (final t in _tabs) ...[
          _Tab(
            label: t.$2,
            count: counts[t.$1] ?? 0,
            selected: active == t.$1,
            onTap: () => onSelect(t.$1),
          ),
          if (t != _tabs.last) const SizedBox(width: 6),
        ],
      ],
    );
  }
}

class _Tab extends StatelessWidget {
  const _Tab({
    required this.label,
    required this.count,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final int count;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? AppColors.brandDeep : AppColors.bg,
          border: Border.all(
            color: selected ? AppColors.brandDeep : AppColors.line,
          ),
          borderRadius: BorderRadius.circular(100),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
                color: selected ? Colors.white : AppColors.text,
              ),
            ),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              decoration: BoxDecoration(
                color: selected ? Colors.white24 : AppColors.soft,
                borderRadius: BorderRadius.circular(100),
              ),
              child: Text(
                '$count',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: selected ? Colors.white : AppColors.mute,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AlertRow extends StatelessWidget {
  const _AlertRow({required this.fault, required this.onTap, this.machine});

  final Fault fault;
  final Machine? machine;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final (label, tone) = severityBadge(fault.severity);
    final isCritical = fault.severity == FaultSeverity.critical &&
        fault.status != FaultStatus.resolved;
    final subtitle = machine == null
        ? fault.machineId
        : '${machine!.code} · ${machine!.workshop}';

    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: isCritical
            ? const BoxDecoration(
                border: Border(
                  left: BorderSide(color: AppColors.crit, width: 3),
                ),
              )
            : null,
        child: Padding(
          padding: EdgeInsets.only(left: isCritical ? 12 : 0),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.only(top: 5),
                decoration: BoxDecoration(
                  color: tone == PillTone.crit
                      ? AppColors.crit
                      : tone == PillTone.warn
                          ? AppColors.warn
                          : AppColors.info,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          _ref(fault.id),
                          style: const TextStyle(
                            fontSize: 10,
                            color: AppColors.faint,
                            fontFeatures: [FontFeature.tabularFigures()],
                          ),
                        ),
                        const SizedBox(width: 6),
                        AppPill(label, tone: tone),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      fault.description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        height: 1.3,
                        color: AppColors.text,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '$subtitle · ${faultTypeLabel(fault.type)}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.mute,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.faint, size: 18),
            ],
          ),
        ),
      ),
    );
  }
}

class _OfflineBanner extends StatelessWidget {
  const _OfflineBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(20, 8, 20, 6),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.warnBg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.warnBorder),
      ),
      child: const Row(
        children: [
          Icon(Icons.cloud_off_outlined, size: 16, color: AppColors.warnFg),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'Mode hors-ligne — données en cache',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.warnFg,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
