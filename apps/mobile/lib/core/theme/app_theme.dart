import 'package:flutter/material.dart';

/// MaintFlow design tokens — mirrored verbatim from the prototype palette
/// (`_src/mobile/design-tokens-and-primitives.js` `C` object), which itself
/// shares the desktop/web brand DNA. Keep in sync with `tailwind.config.ts`.
abstract final class AppColors {
  // Foundations
  static const ink = Color(0xFF0E1410);
  static const text = Color(0xFF1A1F1B);
  static const mute = Color(0xFF5C6A60);
  static const faint = Color(0xFF8A968F);
  static const line = Color(0xFFE4E9E4);
  static const lineSoft = Color(0xFFEEF2EE);
  static const bg = Color(0xFFFFFFFF);
  static const soft = Color(0xFFF2F5F2);
  static const bgSoft = Color(0xFFF7F9F7);

  // Brand greens
  static const brand = Color(0xFF00C24A);
  static const brandHover = Color(0xFF00A93D);
  static const brandDeep = Color(0xFF0A3D1F);
  static const brandBright = Color(0xFF00FF00);
  static const brand50 = Color(0xFFECFDF1);
  static const brand100 = Color(0xFFD2FADD);

  // Status
  static const ok = Color(0xFF00C24A);
  static const warn = Color(0xFFF59E0B);
  static const crit = Color(0xFFDC2626);
  static const info = Color(0xFF2563EB);

  // Status soft bg / fg / border triples (pills)
  static const okBg = Color(0xFFECFDF1);
  static const okFg = Color(0xFF047B32);
  static const okBorder = Color(0xFFD2FADD);
  static const warnBg = Color(0xFFFEF3C7);
  static const warnFg = Color(0xFFB45309);
  static const warnBorder = Color(0xFFFDE68A);
  static const critBg = Color(0xFFFEE2E2);
  static const critFg = Color(0xFFB91C1C);
  static const critBorder = Color(0xFFFECACA);
  static const infoBg = Color(0xFFDBEAFE);
  static const infoFg = Color(0xFF1D4ED8);
  static const infoBorder = Color(0xFFBFDBFE);
}

/// App-wide theme. Typography uses the platform default until the DM Sans /
/// IBM Plex Mono assets from the prototype are bundled.
abstract final class AppTheme {
  static ThemeData get light {
    final scheme = ColorScheme.fromSeed(
      seedColor: AppColors.brand,
      primary: AppColors.brand,
      surface: AppColors.bg,
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: AppColors.bg,
      splashFactory: InkSparkle.splashFactory,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.bg,
        foregroundColor: AppColors.ink,
        elevation: 0,
        centerTitle: false,
        scrolledUnderElevation: 0,
      ),
      dividerTheme:
          const DividerThemeData(color: AppColors.line, thickness: 1, space: 1),
      textTheme: const TextTheme().apply(
        bodyColor: AppColors.text,
        displayColor: AppColors.ink,
      ),
    );
  }
}
