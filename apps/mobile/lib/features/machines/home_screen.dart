import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:maintflow_mobile/core/network/connectivity.dart';
import 'package:maintflow_mobile/core/theme/app_theme.dart';
import 'package:maintflow_mobile/core/widgets/app_pill.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/data/repositories/missions_repository.dart';
import 'package:maintflow_mobile/features/machines/machines_providers.dart';
import 'package:maintflow_mobile/features/missions/missions_providers.dart';
import 'package:maintflow_mobile/features/shell/bottom_tabs.dart';
import 'package:maintflow_mobile/features/shell/tab_nav.dart';

(String label, PillTone tone) machineStateBadge(MachineState s) => switch (s) {
      MachineState.ok => ('Opérationnel', PillTone.ok),
      MachineState.fault => ('En panne', PillTone.crit),
      MachineState.maintenance => ('Maintenance', PillTone.warn),
    };

bool _isActive(InterventionStatus s) =>
    s != InterventionStatus.completed && s != InterventionStatus.cancelled;

/// "Mon parc" — the technician's machine fleet, read offline-first from the
/// Drift cache. KPI strip, search and state filters, mirroring the prototype
/// `HomeScreen`. Rows open the machine detail.
class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _query = TextEditingController();
  MachineState? _filter;

  @override
  void initState() {
    super.initState();
    _query.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    try {
      await ref.read(missionsRepositoryProvider).refreshMachines();
    } catch (_) {
      // Offline — the cache keeps serving the last known fleet.
    }
  }

  @override
  Widget build(BuildContext context) {
    final machinesAsync = ref.watch(machinesListProvider);
    final missions =
        ref.watch(missionsProvider).valueOrNull ?? const <Intervention>[];
    final offline = ref.watch(connectivityProvider).valueOrNull == false;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        bottom: false,
        child: machinesAsync.when(
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
                  onPressed: () => ref.invalidate(machinesListProvider),
                  child: const Text('Réessayer'),
                ),
              ],
            ),
          ),
          data: (all) {
            final activeInterventions =
                missions.where((m) => _isActive(m.status)).length;
            final counts = <MachineState?, int>{
              null: all.length,
              MachineState.fault:
                  all.where((m) => m.state == MachineState.fault).length,
              MachineState.maintenance:
                  all.where((m) => m.state == MachineState.maintenance).length,
              MachineState.ok:
                  all.where((m) => m.state == MachineState.ok).length,
            };
            final shown =
                filterMachines(all, state: _filter, query: _query.text);

            return Column(
              children: [
                if (offline) const _OfflineBanner(),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
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
                                  'MON PARC',
                                  style: TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.mute,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '${all.length} machine${all.length > 1 ? 's' : ''}',
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
                          IconButton(
                            onPressed: () => context.push('/alerts'),
                            icon: const Icon(
                              Icons.notifications_none_rounded,
                              color: AppColors.ink,
                            ),
                            tooltip: 'Alertes',
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _KpiStrip(
                        operational: counts[MachineState.ok] ?? 0,
                        total: all.length,
                        faults: counts[MachineState.fault] ?? 0,
                        interventions: activeInterventions,
                      ),
                      const SizedBox(height: 14),
                      _SearchField(controller: _query),
                      const SizedBox(height: 12),
                      _FilterChips(
                        active: _filter,
                        counts: counts,
                        onSelect: (f) => setState(() => _filter = f),
                      ),
                    ],
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
                                  'Aucune machine ne correspond.',
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
                            itemBuilder: (_, i) => _MachineRow(
                              machine: shown[i],
                              onTap: () =>
                                  context.push('/machines/${shown[i].id}'),
                            ),
                          ),
                  ),
                ),
                BottomTabs(
                  active: 'home',
                  onTap: (key) => onTabTap(context, key),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _KpiStrip extends StatelessWidget {
  const _KpiStrip({
    required this.operational,
    required this.total,
    required this.faults,
    required this.interventions,
  });

  final int operational;
  final int total;
  final int faults;
  final int interventions;

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            flex: 11,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              decoration: BoxDecoration(
                color: AppColors.brandDeep,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Opérationnel',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Colors.white70,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '$operational / $total',
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                      fontFeatures: [FontFeature.tabularFigures()],
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    total == 0
                        ? '—'
                        : '${(operational * 100 / total).round()}% du parc',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.brandBright,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 10,
            child: Column(
              children: [
                Expanded(
                  child: _MiniKpi(
                    icon: Icons.error_outline,
                    iconBg: AppColors.critBg,
                    iconFg: AppColors.crit,
                    value: faults,
                    label: 'Pannes',
                  ),
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: _MiniKpi(
                    icon: Icons.build_outlined,
                    iconBg: AppColors.warnBg,
                    iconFg: AppColors.warn,
                    value: interventions,
                    label: 'Interventions',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MiniKpi extends StatelessWidget {
  const _MiniKpi({
    required this.icon,
    required this.iconBg,
    required this.iconFg,
    required this.value,
    required this.label,
  });

  final IconData icon;
  final Color iconBg;
  final Color iconFg;
  final int value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.bg,
        border: Border.all(color: AppColors.line),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 16, color: iconFg),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '$value',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                    height: 1,
                    fontFeatures: [FontFeature.tabularFigures()],
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 10.5, color: AppColors.mute),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SearchField extends StatelessWidget {
  const _SearchField({required this.controller});

  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    final has = controller.text.isNotEmpty;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: AppColors.soft,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: has ? AppColors.brand : AppColors.line),
      ),
      child: Row(
        children: [
          Icon(
            Icons.search,
            size: 18,
            color: has ? AppColors.brand : AppColors.mute,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: TextField(
              controller: controller,
              decoration: const InputDecoration(
                hintText: 'Rechercher une machine',
                border: InputBorder.none,
                isCollapsed: true,
                contentPadding: EdgeInsets.symmetric(vertical: 12),
              ),
              style: const TextStyle(fontSize: 13.5, color: AppColors.text),
            ),
          ),
          if (has)
            GestureDetector(
              onTap: controller.clear,
              child: const Icon(Icons.close, size: 16, color: AppColors.mute),
            ),
        ],
      ),
    );
  }
}

class _FilterChips extends StatelessWidget {
  const _FilterChips({
    required this.active,
    required this.counts,
    required this.onSelect,
  });

  final MachineState? active;
  final Map<MachineState?, int> counts;
  final ValueChanged<MachineState?> onSelect;

  static const _filters = <(MachineState? state, String label)>[
    (null, 'Tout'),
    (MachineState.fault, 'En panne'),
    (MachineState.maintenance, 'Maintenance'),
    (MachineState.ok, 'OK'),
  ];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final f in _filters) ...[
            _Chip(
              label: f.$2,
              count: counts[f.$1] ?? 0,
              selected: active == f.$1,
              onTap: () => onSelect(f.$1),
            ),
            if (f != _filters.last) const SizedBox(width: 6),
          ],
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({
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

class _MachineRow extends StatelessWidget {
  const _MachineRow({required this.machine, required this.onTap});

  final Machine machine;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final (label, tone) = machineStateBadge(machine.state);
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        machine.code,
                        style: const TextStyle(
                          fontSize: 10.5,
                          color: AppColors.faint,
                          fontFeatures: [FontFeature.tabularFigures()],
                        ),
                      ),
                      const SizedBox(width: 7),
                      AppPill(label, tone: tone, dot: tone == PillTone.crit),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    machine.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w600,
                      color: AppColors.text,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    machine.workshop,
                    style: const TextStyle(fontSize: 12, color: AppColors.mute),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.faint, size: 20),
          ],
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
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 14),
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
