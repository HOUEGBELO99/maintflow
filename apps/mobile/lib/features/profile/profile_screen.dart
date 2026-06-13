import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:maintflow_mobile/core/theme/app_theme.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/models/session_user.dart';
import 'package:maintflow_mobile/features/auth/auth_controller.dart';
import 'package:maintflow_mobile/features/missions/missions_providers.dart';
import 'package:maintflow_mobile/features/shell/bottom_tabs.dart';
import 'package:maintflow_mobile/features/shell/tab_nav.dart';

/// Up-to-two-letter initials from a display name, for the avatar. Pure.
String userInitials(String name) {
  final words = name.trim().split(RegExp(r'\s+')).where((w) => w.isNotEmpty);
  if (words.isEmpty) return '?';
  final letters = words.take(2).map((w) => w[0].toUpperCase());
  return letters.join();
}

/// French label for a role. Pure.
String roleLabel(UserRole role) => switch (role) {
      UserRole.admin => 'Admin',
      UserRole.chefMaintenance => 'Chef maintenance',
      UserRole.chefAtelier => "Chef d'atelier",
      UserRole.technicien => 'Technicien',
      UserRole.operateur => 'Opérateur',
    };

bool _isActive(InterventionStatus s) =>
    s != InterventionStatus.completed && s != InterventionStatus.cancelled;

/// "Profil" — the signed-in technician's identity, live counts from the
/// offline missions cache, quick links, and logout. Mirrors the prototype
/// `ProfileScreen` (the per-month hours/sparkline await a technician "me"
/// endpoint, so the KPIs here are the real cached counts instead).
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).valueOrNull;
    final missions =
        ref.watch(missionsProvider).valueOrNull ?? const <Intervention>[];
    final done =
        missions.where((m) => m.status == InterventionStatus.completed).length;
    final active = missions.where((m) => _isActive(m.status)).length;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(22, 8, 22, 24),
                children: [
                  const Text(
                    'PROFIL',
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w600,
                      color: AppColors.mute,
                      letterSpacing: 0.8,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _Identity(user: user),
                  const SizedBox(height: 22),
                  _KpiStrip(
                    total: missions.length,
                    done: done,
                    active: active,
                  ),
                  const SizedBox(height: 26),
                  const _SectionLabel('Mon espace'),
                  const SizedBox(height: 4),
                  _LinkRow(
                    label: 'Mes missions',
                    sub:
                        '${missions.length} assignée${missions.length > 1 ? 's' : ''}',
                    onTap: () => context.go('/missions'),
                  ),
                  _LinkRow(
                    label: 'Mon parc',
                    sub: 'Toutes les machines',
                    onTap: () => context.go('/home'),
                  ),
                  _LinkRow(
                    label: 'Alertes',
                    sub: 'Pannes du site',
                    onTap: () => context.push('/alerts'),
                    last: true,
                  ),
                  const SizedBox(height: 24),
                  const _SectionLabel('Compte'),
                  const SizedBox(height: 4),
                  _InfoRow(label: 'Email', value: user?.email ?? '—'),
                  _InfoRow(
                    label: 'Rôle',
                    value: user == null ? '—' : roleLabel(user.role),
                  ),
                  _InfoRow(
                    label: 'Site',
                    value: user?.siteId ?? '—',
                    last: true,
                  ),
                  const SizedBox(height: 28),
                  _LogoutButton(
                    onTap: () =>
                        ref.read(authControllerProvider.notifier).signOut(),
                  ),
                ],
              ),
            ),
            BottomTabs(
              active: 'profile',
              onTap: (key) => onTabTap(context, key),
            ),
          ],
        ),
      ),
    );
  }
}

class _Identity extends StatelessWidget {
  const _Identity({required this.user});

  final SessionUser? user;

  @override
  Widget build(BuildContext context) {
    final name = user?.name ?? 'Technicien';
    return Row(
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [AppColors.brand, AppColors.brandDeep],
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            userInitials(name),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                user == null ? '—' : roleLabel(user!.role),
                style: const TextStyle(fontSize: 12.5, color: AppColors.mute),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      color: AppColors.brand,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  const Text(
                    'En service',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.brandDeep,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _KpiStrip extends StatelessWidget {
  const _KpiStrip({
    required this.total,
    required this.done,
    required this.active,
  });

  final int total;
  final int done;
  final int active;

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            flex: 13,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              decoration: BoxDecoration(
                color: AppColors.brandDeep,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'Missions assignées',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Colors.white70,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '$total',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                      fontFeatures: [FontFeature.tabularFigures()],
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
                Expanded(child: _MiniKpi(value: done, label: 'Terminées')),
                const SizedBox(height: 8),
                Expanded(child: _MiniKpi(value: active, label: 'En cours')),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MiniKpi extends StatelessWidget {
  const _MiniKpi({required this.value, required this.label});

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
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
          const SizedBox(height: 3),
          Text(
            label,
            style: const TextStyle(fontSize: 10.5, color: AppColors.mute),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: const TextStyle(
        fontSize: 10.5,
        fontWeight: FontWeight.w600,
        color: AppColors.mute,
        letterSpacing: 0.6,
      ),
    );
  }
}

class _LinkRow extends StatelessWidget {
  const _LinkRow({
    required this.label,
    required this.sub,
    required this.onTap,
    this.last = false,
  });

  final String label;
  final String sub;
  final VoidCallback onTap;
  final bool last;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: last ? AppColors.line : AppColors.lineSoft,
            ),
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w500,
                      color: AppColors.text,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    sub,
                    style: const TextStyle(
                      fontSize: 11.5,
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
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value, this.last = false});

  final String label;
  final String value;
  final bool last;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: last ? AppColors.line : AppColors.lineSoft),
        ),
      ),
      child: Row(
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 13.5, color: AppColors.mute),
          ),
          const Spacer(),
          Flexible(
            child: Text(
              value,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.right,
              style: const TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.w500,
                color: AppColors.text,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LogoutButton extends StatelessWidget {
  const _LogoutButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: TextButton(
        onPressed: onTap,
        child: const Text(
          'Se déconnecter',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.crit,
          ),
        ),
      ),
    );
  }
}
