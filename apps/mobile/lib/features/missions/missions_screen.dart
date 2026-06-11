import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Placeholder for the technician's "Missions du jour" screen.
/// Real implementation: read from the offline Drift cache first, then sync.
class MissionsScreen extends ConsumerWidget {
  const MissionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mes missions')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Scaffold prêt.\nÀ implémenter : liste offline-first des interventions '
            'du jour, chrono live, scan QR, checklist, clôture signée.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
