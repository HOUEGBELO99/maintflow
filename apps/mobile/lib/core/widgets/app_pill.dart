import 'package:flutter/material.dart';

import 'package:maintflow_mobile/core/theme/app_theme.dart';

enum PillTone { ok, warn, crit, info, mute, bright, dark }

/// Status pill — colored bg/fg/border triples, mirrors the prototype `Pill`.
class AppPill extends StatelessWidget {
  const AppPill(this.label, {required this.tone, this.dot = false, super.key});

  final String label;
  final PillTone tone;
  final bool dot;

  static const _tones = <PillTone, (Color bg, Color fg, Color border)>{
    PillTone.ok: (AppColors.okBg, AppColors.okFg, AppColors.okBorder),
    PillTone.warn: (AppColors.warnBg, AppColors.warnFg, AppColors.warnBorder),
    PillTone.crit: (AppColors.critBg, AppColors.critFg, AppColors.critBorder),
    PillTone.info: (AppColors.infoBg, AppColors.infoFg, AppColors.infoBorder),
    PillTone.mute: (AppColors.soft, AppColors.mute, AppColors.line),
    PillTone.bright: (
      AppColors.brandBright,
      AppColors.brandDeep,
      AppColors.brand
    ),
    PillTone.dark: (AppColors.brandDeep, Colors.white, AppColors.brandDeep),
  };

  @override
  Widget build(BuildContext context) {
    final (bg, fg, border) = _tones[tone]!;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (dot) ...[
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(color: fg, shape: BoxShape.circle),
            ),
            const SizedBox(width: 5),
          ],
          Text(
            label,
            style: TextStyle(
              color: fg,
              fontSize: 10.5,
              fontWeight: FontWeight.w600,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}
