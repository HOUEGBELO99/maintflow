import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/fault.dart';
import 'package:maintflow_mobile/data/repositories/missions_repository.dart';

/// The alert feed filters, mirroring the prototype tabs.
enum AlertFilter { all, critical, unresolved }

/// All cached faults (offline-first), newest first, with a swallowed
/// background refresh. Backs the alerts feed.
final faultsProvider = StreamProvider.autoDispose<List<Fault>>((ref) {
  final repo = ref.watch(missionsRepositoryProvider);
  unawaited(repo.refreshFaults().catchError((Object _) {}));
  return repo.watchFaults().map(
        (list) =>
            list.toList()..sort((a, b) => b.reportedAt.compareTo(a.reportedAt)),
      );
});

/// Filters the fault feed for a tab. Pure so it can be unit-tested.
List<Fault> filterFaults(Iterable<Fault> faults, AlertFilter filter) {
  return faults.where((f) {
    switch (filter) {
      case AlertFilter.all:
        return true;
      case AlertFilter.critical:
        return f.severity == FaultSeverity.critical;
      case AlertFilter.unresolved:
        return f.status != FaultStatus.resolved;
    }
  }).toList();
}

/// A short "il y a …" label for a past instant. Pure (takes `now`).
String relativeTime(DateTime time, DateTime now) {
  final diff = now.difference(time);
  if (diff.inMinutes < 1) return "à l'instant";
  if (diff.inMinutes < 60) return 'il y a ${diff.inMinutes} min';
  if (diff.inHours < 24) return 'il y a ${diff.inHours} h';
  return 'il y a ${diff.inDays} j';
}
