import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:maintflow_mobile/features/auth/auth_controller.dart';
import 'package:maintflow_mobile/features/auth/login_screen.dart';
import 'package:maintflow_mobile/features/missions/missions_screen.dart';

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
      GoRoute(
        path: '/missions',
        builder: (context, state) => const MissionsScreen(),
      ),
      // TODO: /missions/:id (detail), /checklist, /scan, /report, /close, /profile
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(child: Text('Route introuvable: ${state.uri}')),
    ),
  );
});
