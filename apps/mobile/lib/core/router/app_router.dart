import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:maintflow_mobile/features/missions/missions_screen.dart';

/// App routes — mirrors the prototype technician flow:
/// login → missions → detail → checklist → scan → report → close.
final appRouter = GoRouter(
  initialLocation: '/missions',
  routes: [
    GoRoute(
      path: '/missions',
      builder: (context, state) => const MissionsScreen(),
    ),
    // TODO: /login, /missions/:id, /missions/:id/checklist,
    //       /scan, /missions/:id/report, /profile
  ],
  errorBuilder: (context, state) => Scaffold(
    body: Center(child: Text('Route introuvable: ${state.uri}')),
  ),
);
