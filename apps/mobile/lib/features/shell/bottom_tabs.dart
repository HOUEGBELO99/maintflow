import 'package:flutter/material.dart';

import 'package:maintflow_mobile/core/theme/app_theme.dart';

/// Bottom navigation, mirroring the prototype `BottomTabs` (center Scan gets a
/// raised dark pill). Only Missions is wired so far; others are placeholders.
class BottomTabs extends StatelessWidget {
  const BottomTabs({required this.active, this.onTap, super.key});

  final String active;
  final ValueChanged<String>? onTap;

  static const _tabs = <({String key, String label, IconData icon})>[
    (key: 'home', label: 'Machines', icon: Icons.grid_view_rounded),
    (key: 'missions', label: 'Missions', icon: Icons.task_alt),
    (key: 'scan', label: 'Scan', icon: Icons.qr_code_scanner),
    (key: 'profile', label: 'Profil', icon: Icons.person_outline),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(top: 10, bottom: 16),
      decoration: const BoxDecoration(
        color: AppColors.bg,
        border: Border(top: BorderSide(color: AppColors.line)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          for (final t in _tabs)
            t.key == 'scan'
                ? _ScanTab(
                    label: t.label,
                    icon: t.icon,
                    onTap: () => onTap?.call(t.key),
                  )
                : _Tab(
                    label: t.label,
                    icon: t.icon,
                    active: active == t.key,
                    onTap: () => onTap?.call(t.key),
                  ),
        ],
      ),
    );
  }
}

class _Tab extends StatelessWidget {
  const _Tab({
    required this.label,
    required this.icon,
    required this.active,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = active ? AppColors.ink : AppColors.mute;
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            height: 4,
            child: active
                ? Container(
                    width: 14,
                    decoration: BoxDecoration(
                      color: AppColors.brand,
                      borderRadius: BorderRadius.circular(1),
                    ),
                  )
                : null,
          ),
          const SizedBox(height: 6),
          Icon(icon, size: 22, color: color),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w500,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _ScanTab extends StatelessWidget {
  const _ScanTab({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: const BoxDecoration(
              color: AppColors.ink,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.qr_code_scanner,
              size: 20,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Scan',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w500,
              color: AppColors.mute,
            ),
          ),
        ],
      ),
    );
  }
}
