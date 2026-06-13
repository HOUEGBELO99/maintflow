import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:maintflow_mobile/features/auth/auth_controller.dart';
import 'package:maintflow_mobile/features/auth/login_screen.dart';
import 'package:maintflow_mobile/features/machines/home_screen.dart';
import 'package:maintflow_mobile/features/machines/machine_detail_screen.dart';
import 'package:maintflow_mobile/features/missions/close_work_screen.dart';
import 'package:maintflow_mobile/features/missions/mission_detail_screen.dart';
import 'package:maintflow_mobile/features/missions/missions_screen.dart';
import 'package:maintflow_mobile/features/profile/profile_screen.dart';
import 'package:maintflow_mobile/features/report/report_screen.dart';
import 'package:maintflow_mobile/features/scan/scan_screen.dart';

/// App router with an auth gate. Mirrors the prototype technician flow:
/// login → missions → detail → checklist → scan → report → close.
/// (Only login + missions are implemented so far.)
final appRouterProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier<int>(0);
  ref.listen(authControllerProvider, (_, __) => refresh.value++);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/missions',
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      if (auth.isLoading) return null;
      final signedIn = auth.valueOrNull != null;
      final atLogin = state.matchedLocation == '/login';
      if (!signedIn) return atLogin ? null : '/login';
      if (atLogin) return '/missions';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/machines/:id',
        builder: (context, state) =>
            MachineDetailScreen(machineId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/missions',
        builder: (context, state) => const MissionsScreen(),
        routes: [
          GoRoute(
            path: ':id',
            builder: (context, state) =>
                MissionDetailScreen(missionId: state.pathParameters['id']!),
            routes: [
              GoRoute(
                path: 'close',
                builder: (context, state) =>
                    CloseWorkScreen(missionId: state.pathParameters['id']!),
              ),
            ],
          ),
        ],
      ),
      GoRoute(path: '/scan', builder: (context, state) => const ScanScreen()),
      GoRoute(
        path: '/report',
        builder: (context, state) => ReportScreen(
          machineId: state.uri.queryParameters['machineId'] ?? '',
        ),
      ),
      // Still to come: /checklist, /close, /profile
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(child: Text('Route introuvable: ${state.uri}')),
    ),
  );
});
