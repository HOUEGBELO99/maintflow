import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:maintflow_mobile/core/config/env.dart';
import 'package:maintflow_mobile/core/network/connectivity.dart';
import 'package:maintflow_mobile/core/router/app_router.dart';
import 'package:maintflow_mobile/core/theme/app_theme.dart';
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

class MaintFlowApp extends ConsumerWidget {
  const MaintFlowApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Flush the offline write queue whenever connectivity returns.
    ref.listen(connectivityProvider, (_, next) {
      if (next.valueOrNull ?? false) {
        unawaited(ref.read(syncServiceProvider).drain());
      }
    });

    return MaterialApp.router(
      title: 'MaintFlow',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: ref.watch(appRouterProvider),
    );
  }
}
