import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';

/// Routes a bottom-tab tap. Tab switches replace the location (`go`); the Scan
/// flow is pushed so it can be popped back. Tabs without a screen yet (profile)
/// are intentionally no-ops.
void onTabTap(BuildContext context, String key) {
  switch (key) {
    case 'home':
      context.go('/home');
    case 'missions':
      context.go('/missions');
    case 'scan':
      context.push('/scan');
  }
}
