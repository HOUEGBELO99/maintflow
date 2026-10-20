import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:maintflow_mobile/core/config/env.dart';
import 'package:maintflow_mobile/core/network/connectivity.dart';
import 'package:maintflow_mobile/core/router/app_router.dart';
import 'package:maintflow_mobile/core/theme/app_theme.dart';
import 'package:maintflow_mobile/data/repositories/missions_repository.dart';
import 'package:maintflow_mobile/features/auth/auth_controller.dart';
import 'package:maintflow_mobile/data/repositories/sync_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Real auth runs against Supabase when configured (prod); local dev falls
  // back to the API dev-login route and a no-op token refresher.
  if (Env.isConfigured) {
    await Supabase.initialize(
      url: Env.supabaseUrl,
      // The anon key is Supabase's renamed "publishable" public client key.
      publishableKey: Env.supabaseAnonKey,
    );
  }
  runApp(const ProviderScope(child: MaintFlowApp()));
}

class MaintFlowApp extends ConsumerStatefulWidget {
  const MaintFlowApp({super.key});

  @override
  ConsumerState<MaintFlowApp> createState() => _MaintFlowAppState();
}

class _MaintFlowAppState extends ConsumerState<MaintFlowApp>
    with WidgetsBindingObserver {
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Keep data live while the app is open: changes made from the back-office
    // (new assignment, rescheduling…) show up without signing out and in.
    _ticker = Timer.periodic(const Duration(minutes: 1), (_) => _refresh());
  }

  @override
  void dispose() {
    _ticker?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _refresh();
  }

  /// Push queued writes, then pull fresh missions / machines / faults into the
  /// offline cache (screens update from the cache). Silent when offline.
  void _refresh() {
    final user = ref.read(authControllerProvider).valueOrNull;
    if (user == null) return;
    final repo = ref.read(missionsRepositoryProvider);
    unawaited(
      ref
          .read(syncServiceProvider)
          .drain()
          .then(
            (_) => Future.wait([
              repo.refreshMissions(user.id),
              repo.refreshMachines(),
              repo.refreshFaults(),
            ]),
          )
          .catchError((Object _) => <void>[]),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Flush the offline write queue whenever connectivity returns.
    ref.listen(connectivityProvider, (_, next) {
      if (next.valueOrNull ?? false) _refresh();
    });

    return MaterialApp.router(
      title: 'MaintFlow',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: ref.watch(appRouterProvider),
    );
  }
}
