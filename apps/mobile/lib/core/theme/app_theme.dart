import 'package:flutter/material.dart';

/// MaintFlow theme — green brand from the prototype.
class AppTheme {
  const AppTheme._();

  static const Color brand = Color(0xFF16A34A);
  static const Color ink = Color(0xFF0E1410);
  static const Color critical = Color(0xFFDC2626);
  static const Color warning = Color(0xFFF59E0B);

  static ThemeData get light => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: brand,
          primary: brand,
        ),
        scaffoldBackgroundColor: const Color(0xFFF7F9F8),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: ink,
          elevation: 0,
          centerTitle: false,
        ),
      );
}
